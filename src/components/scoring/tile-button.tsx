import { Pressable, StyleSheet, View } from 'react-native';

import { TileFace } from './tile-glyph';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TileId } from '@/core/tiles';

export type TileButtonProps = {
  id: TileId;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Small corner badge, e.g. `×3` or `贏`. */
  badge?: string;
  size?: number;
};

export function TileButton({
  id,
  onPress,
  onLongPress,
  selected,
  disabled,
  badge,
  size = 30,
}: TileButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: selected ? theme.text : theme.backgroundSelected,
          backgroundColor: theme.backgroundElement,
          opacity: disabled ? 0.28 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <TileFace id={id} size={size} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.text }]}>
          <ThemedText style={[styles.badgeText, { color: theme.background }]}>{badge}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 58,
    borderRadius: Spacing.two,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});
