import { useReducer, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BucketTabs } from '@/components/scoring/bucket-tabs';
import { ContextControls } from '@/components/scoring/context-controls';
import { HandSummary } from '@/components/scoring/hand-summary';
import { InlineError } from '@/components/scoring/inline-error';
import { MeldEditor } from '@/components/scoring/meld-editor';
import { RulesControls } from '@/components/scoring/rules-controls';
import { ScoreBreakdown } from '@/components/scoring/score-breakdown';
import { TileGrid } from '@/components/scoring/tile-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FLOWER_TILES, PLAYING_TILES, type FlowerTileId, type PlayingTileId } from '@/core/tiles';
import {
  amountPerLoser,
  netBySeat,
  scoreHand,
  settle,
  type HandContext,
  type ScoreResult,
  type SettlementInput,
  type Transfer,
} from '@/core/scoring';
import { buildHand, HandBuildError } from '@/lib/hand-builder';
import {
  canCalculate,
  expectedConcealedCount,
  FLOWER_MAX,
  initialScoringDraft,
  MAX_MELDS,
  scoringDraftReducer,
  TILE_MAX,
  tileUsage,
} from '@/lib/scoring-draft';

type Result =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      score: ScoreResult;
      transfers: Transfer[];
      perLoser: number;
      net: Map<number, number>;
      netSumsZero: boolean;
    };

export default function ScoringCalculatorScreen() {
  const theme = useTheme();
  const [draft, dispatchRaw] = useReducer(scoringDraftReducer, undefined, initialScoringDraft);
  const [result, setResult] = useState<Result>({ status: 'idle' });

  // Any edit invalidates a shown result.
  const dispatch: typeof dispatchRaw = (action) => {
    setResult((r) => (r.status === 'idle' ? r : { status: 'idle' }));
    dispatchRaw(action);
  };

  const usage = tileUsage(draft);
  const target = expectedConcealedCount(draft.hand.melds.length);
  const { focus } = draft.hand;
  const activeMeld = focus.kind === 'meld' ? draft.hand.melds[focus.index] : undefined;
  const ready = canCalculate(draft);

  function onCalculate() {
    try {
      const hand = buildHand(draft);
      const context: HandContext = {
        seatWind: draft.context.seatWind,
        roundWind: draft.context.roundWind,
        isDealer: draft.context.isDealer,
        linZong: draft.context.linZong,
        selfDraw: draft.context.selfDraw,
      };
      const score = scoreHand(hand, context);

      const base = Number(draft.rules.base.trim());
      if (!Number.isFinite(base) || base < 0) {
        throw new Error('底 must be a number ≥ 0');
      }
      const fanValue = Number(draft.rules.fanValue.trim()) || 1;

      const input: SettlementInput = {
        fanTotal: score.fanTotal,
        seats: [0, 1, 2, 3],
        winnerSeat: draft.rules.winnerSeat,
        discarderSeat: draft.context.selfDraw ? null : draft.rules.discarderSeat,
        rules: { base, fanValue, splitDiscardPayment: draft.rules.splitDiscardPayment },
      };
      const transfers = settle(input);
      const perLoser = amountPerLoser(score.fanTotal, input.rules);
      const net = netBySeat(transfers);
      const netSumsZero = [...net.values()].reduce((a, b) => a + b, 0) === 0;

      setResult({ status: 'ok', score, transfers, perLoser, net, netSumsZero });
    } catch (e) {
      setResult({
        status: 'error',
        message: e instanceof HandBuildError || e instanceof Error ? e.message : String(e),
      });
    }
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">計番 Scoring Calculator</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Build a winning hand, then Calculate to see the 番 and who pays whom.
          </ThemedText>

          <HandSummary
            hand={draft.hand}
            target={target}
            onRemoveConcealed={(index) => dispatch({ type: 'REMOVE_CONCEALED', index })}
            onMarkWinning={(index) => dispatch({ type: 'MARK_WINNING', index })}
            onRemoveFlower={(index) => dispatch({ type: 'REMOVE_FLOWER', index })}
          />

          <BucketTabs
            concealedCount={draft.hand.concealed.length}
            concealedTarget={target}
            meldCount={draft.hand.melds.length}
            flowerCount={draft.hand.flowers.length}
            active={focus}
            canAddMeld={draft.hand.melds.length < MAX_MELDS}
            onSelect={(bucket) => dispatch({ type: 'SET_FOCUS', bucket })}
            onAddMeld={() => dispatch({ type: 'ADD_MELD' })}
          />

          {focus.kind === 'meld' && activeMeld ? (
            <MeldEditor
              meld={activeMeld}
              index={focus.index}
              onKindChange={(kind) => dispatch({ type: 'SET_MELD_KIND', index: focus.index, kind })}
              onConcealedToggle={(value) =>
                dispatch({ type: 'SET_MELD_CONCEALED', index: focus.index, value })
              }
              onRemoveTile={(tileIndex) =>
                dispatch({ type: 'REMOVE_MELD_TILE', meldIndex: focus.index, tileIndex })
              }
              onRemoveMeld={() => dispatch({ type: 'REMOVE_MELD', index: focus.index })}
            />
          ) : null}

          <View style={styles.section}>
            <ThemedText type="smallBold">
              {focus.kind === 'flowers'
                ? 'Add flowers'
                : focus.kind === 'meld'
                  ? `Add tiles to Meld ${focus.index + 1}`
                  : 'Add concealed tiles'}
            </ThemedText>
            {focus.kind === 'flowers' ? (
              <TileGrid
                tiles={FLOWER_TILES}
                usage={usage}
                max={FLOWER_MAX}
                onTilePress={(id) => dispatch({ type: 'ADD_FLOWER', tile: id as FlowerTileId })}
              />
            ) : (
              <TileGrid
                tiles={PLAYING_TILES}
                usage={usage}
                max={TILE_MAX}
                onTilePress={(id) => dispatch({ type: 'ADD_TILE', tile: id as PlayingTileId })}
              />
            )}
          </View>

          <ContextControls
            value={draft.context}
            onChange={(patch) => dispatch({ type: 'SET_CONTEXT', patch })}
          />

          <RulesControls
            value={draft.rules}
            selfDraw={draft.context.selfDraw}
            onChange={(patch) => dispatch({ type: 'SET_RULES', patch })}
          />

          <Pressable
            onPress={onCalculate}
            disabled={!ready}
            style={({ pressed }) => [
              styles.calcButton,
              { backgroundColor: theme.text, opacity: !ready ? 0.3 : pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Calculate
            </ThemedText>
          </Pressable>

          {result.status === 'error' ? <InlineError message={result.message} /> : null}
          {result.status === 'ok' ? (
            <ScoreBreakdown
              score={result.score}
              transfers={result.transfers}
              perLoser={result.perLoser}
              net={result.net}
              netSumsZero={result.netSumsZero}
            />
          ) : null}

          <ThemedText
            type="link"
            themeColor="textSecondary"
            onPress={() => dispatch({ type: 'RESET' })}
          >
            Reset hand
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  section: { gap: Spacing.two },
  calcButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
