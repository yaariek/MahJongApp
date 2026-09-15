import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Bucket } from '@/lib/scoring-draft';

export type BucketTabsProps = {
  concealedCount: number;
  concealedTarget: number;
  meldCount: number;
  flowerCount: number;
  active: Bucket;
  canAddMeld: boolean;
  onSelect: (bucket: Bucket) => void;
  onAddMeld: () => void;
};

export function BucketTabs({
  concealedCount,
  concealedTarget,
  meldCount,
  flowerCount,
  active,
  canAddMeld,
  onSelect,
  onAddMeld,
}: BucketTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Chip
        label={`Concealed ${concealedCount}/${concealedTarget}`}
        active={active.kind === 'concealed'}
        onPress={() => onSelect({ kind: 'concealed' })}
      />
      {Array.from({ length: meldCount }, (_, i) => (
        <Chip
          key={i}
          label={`Meld ${i + 1}`}
          active={active.kind === 'meld' && active.index === i}
          onPress={() => onSelect({ kind: 'meld', index: i })}
        />
      ))}
      <Chip
        label={`Flowers ${flowerCount}`}
        active={active.kind === 'flowers'}
        onPress={() => onSelect({ kind: 'flowers' })}
      />
      <Chip label="+ Meld" active={false} onPress={onAddMeld} disabled={!canAddMeld} />
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [(pressed || disabled) && styles.dim]}
    >
      <ThemedView type={active ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
        <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  dim: { opacity: 0.4 },
});
