import { Text, type TextProps } from 'react-native';

import { RENDER_MODE, tileText, type RenderMode } from '@/lib/tile-glyph';
import { useTheme } from '@/hooks/use-theme';
import type { TileId } from '@/core/tiles';

export type TileFaceProps = TextProps & {
  id: TileId;
  size?: number;
  mode?: RenderMode;
};

/** A single tile face — a Unicode Mahjong glyph, or a Han label in fallback mode. */
export function TileFace({ id, size = 30, mode = RENDER_MODE, style, ...rest }: TileFaceProps) {
  const theme = useTheme();
  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          color: theme.text,
          fontSize: size,
          lineHeight: Math.round(size * 1.15),
          textAlign: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {tileText(id, mode)}
    </Text>
  );
}
