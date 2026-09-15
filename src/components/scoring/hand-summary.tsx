import { Pressable, StyleSheet, View } from 'react-native';

import { TileFace } from './tile-glyph';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HandDraft, MeldDraft } from '@/lib/scoring-draft';

export type HandSummaryProps = {
  hand: HandDraft;
  target: number;
  onRemoveConcealed: (index: number) => void;
  onMarkWinning: (index: number) => void;
  onRemoveFlower: (index: number) => void;
};

export function HandSummary({
  hand,
  target,
  onRemoveConcealed,
  onMarkWinning,
  onRemoveFlower,
}: HandSummaryProps) {
  const complete = hand.concealed.length === target;
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor={complete ? 'text' : 'textSecondary'}>
        Concealed incl. winning: {hand.concealed.length} / {target} • Melds: {hand.melds.length}
      </ThemedText>

      {hand.concealed.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tap tiles below. Tap a tile here to remove it; tap ☆ to mark the winning tile.
        </ThemedText>
      ) : (
        <View style={styles.tileRow}>
          {hand.concealed.map((id, i) => (
            <View key={`${id}-${i}`} style={styles.stack}>
              <Pressable onPress={() => onRemoveConcealed(i)}>
                <TileFace id={id} size={26} />
              </Pressable>
              <Pressable onPress={() => onMarkWinning(i)} hitSlop={6}>
                <ThemedText
                  type="small"
                  themeColor={hand.winningIndex === i ? 'text' : 'textSecondary'}
                >
                  {hand.winningIndex === i ? '★贏' : '☆'}
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {hand.melds.map((meld, i) => (
        <MeldRow key={i} meld={meld} index={i} />
      ))}

      {hand.flowers.length > 0 ? (
        <View style={styles.tileRow}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
            花
          </ThemedText>
          {hand.flowers.map((id, i) => (
            <Pressable key={`${id}-${i}`} onPress={() => onRemoveFlower(i)}>
              <TileFace id={id} size={24} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
}

function MeldRow({ meld, index }: { meld: MeldDraft; index: number }) {
  const theme = useTheme();
  const kanConcealed = meld.kind === 'kan' && meld.concealed;
  return (
    <View style={styles.tileRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
        {index + 1}
        {kanConcealed ? ' 暗槓' : ''}
      </ThemedText>
      {meld.tiles.map((id, i) => (
        <TileFace key={`${id}-${i}`} id={id} size={22} style={{ color: theme.textSecondary }} />
      ))}
      {meld.tiles.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          (empty)
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  stack: {
    alignItems: 'center',
  },
  rowLabel: {
    minWidth: 18,
  },
});
