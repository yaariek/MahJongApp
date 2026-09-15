import { StyleSheet, Switch, View } from 'react-native';

import { Segmented, type SegmentedOption } from './segmented';
import { TileButton } from './tile-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { MeldDraft, MeldKind } from '@/lib/scoring-draft';

const KIND_OPTIONS: readonly SegmentedOption<MeldKind>[] = [
  { value: 'chi', label: '吃' },
  { value: 'pon', label: '碰' },
  { value: 'kan', label: '槓' },
];

export type MeldEditorProps = {
  meld: MeldDraft;
  index: number;
  onKindChange: (kind: MeldKind) => void;
  onConcealedToggle: (value: boolean) => void;
  onRemoveTile: (tileIndex: number) => void;
  onRemoveMeld: () => void;
};

export function MeldEditor({
  meld,
  index,
  onKindChange,
  onConcealedToggle,
  onRemoveTile,
  onRemoveMeld,
}: MeldEditorProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Meld {index + 1}</ThemedText>
        <ThemedText type="link" themeColor="textSecondary" onPress={onRemoveMeld}>
          Remove meld
        </ThemedText>
      </View>

      <Segmented options={KIND_OPTIONS} value={meld.kind} onChange={onKindChange} />

      {meld.kind === 'kan' ? (
        <View style={styles.row}>
          <ThemedText type="small">暗槓 (concealed kan)</ThemedText>
          <Switch value={meld.concealed} onValueChange={onConcealedToggle} />
        </View>
      ) : null}

      <View style={styles.tiles}>
        {meld.tiles.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Tap tiles in the grid below to add them here.
          </ThemedText>
        ) : (
          meld.tiles.map((id, i) => (
            <TileButton key={`${id}-${i}`} id={id} size={24} onPress={() => onRemoveTile(i)} />
          ))
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    minHeight: 28,
    alignItems: 'center',
  },
});
