import { StyleSheet, View } from 'react-native';

import { TileButton } from './tile-button';
import { Spacing } from '@/constants/theme';
import type { TileId } from '@/core/tiles';

export type TileGridProps = {
  tiles: readonly TileId[];
  usage: Map<TileId, number>;
  /** Per-tile cap — disables a tile once it is reached. */
  max: number;
  onTilePress: (id: TileId) => void;
};

/** A wrapping grid of tappable tiles. Plain View, not a FlatList — 34 tiles need
 *  no virtualization and a FlatList inside the screen ScrollView warns. */
export function TileGrid({ tiles, usage, max, onTilePress }: TileGridProps) {
  return (
    <View style={styles.grid}>
      {tiles.map((id) => {
        const used = usage.get(id) ?? 0;
        return (
          <TileButton
            key={id}
            id={id}
            badge={used > 0 ? `×${used}` : undefined}
            disabled={used >= max}
            onPress={() => onTilePress(id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
});
