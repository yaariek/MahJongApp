import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SegmentedOption<T> = { value: T; label: string };

export type SegmentedProps<T extends string | number> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** A small hand-rolled segmented control. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[styles.row, { borderColor: theme.backgroundSelected, opacity: disabled ? 0.4 : 1 }]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && { backgroundColor: theme.backgroundSelected }]}
          >
            <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  item: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    minWidth: 42,
    alignItems: 'center',
  },
});
