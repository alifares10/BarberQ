import { memo } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type PhotoTone =
  | 'chair'
  | 'tools'
  | 'hands'
  | 'mirror'
  | 'counter'
  | 'light'
  | 'portrait'
  | 'interior';

export type PhotoProps = {
  tone?: PhotoTone;
  /** Optional mono label burnt into the bottom-left corner. */
  label?: string;
  /** Vignette darkness 0..1 (default 0.35). */
  dim?: number;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  radius?: number;
  style?: ViewStyle;
};

const tonePalettes: Record<PhotoTone, [string, string, string]> = {
  chair: ['#3a2418', '#1a1008', '#2a1810'],
  tools: ['#4a3a2a', '#2a1f15', '#1a120a'],
  hands: ['#4a342a', '#2a1f18', '#3a261a'],
  mirror: ['#5a4434', '#3a2a1f', '#2a1f15'],
  counter: ['#3a281a', '#1a120a', '#2a1f12'],
  light: ['#6a4a30', '#3a2a1a', '#2a1f12'],
  portrait: ['#3a2a20', '#1a120c', '#2a1f15'],
  interior: ['#2a1f15', '#0e0b08', '#1a1410'],
};

/**
 * Warm-toned photo placeholder. Three layers:
 *   1. SVG radial gradient — the tone palette (off-center hot spot)
 *   2. Expo linear-gradient — bottom vignette for legibility of overlaid copy
 *   3. Optional gold highlight blob via opacity tint
 *
 * For real photography, swap this in favor of <expo-image> with the same
 * <LinearGradient> overlay layers for legibility. Source: tokens.jsx:146-184.
 */
export const Photo = memo(function Photo({
  tone = 'chair',
  label,
  dim = 0.35,
  width = '100%',
  height = '100%',
  radius = 0,
  style,
}: PhotoProps) {
  const { colors } = useAppTheme();
  const [hot, mid, cold] = tonePalettes[tone];

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: cold,
        },
        style,
      ]}
    >
      {/* Layer 1 — radial tone */}
      <Svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 } as any}>
        <Defs>
          <SvgRadialGradient
            id={`tone-${tone}`}
            cx="30%"
            cy="20%"
            r="80%"
            fx="30%"
            fy="20%"
          >
            <Stop offset="0%" stopColor={hot} stopOpacity={1} />
            <Stop offset="55%" stopColor={mid} stopOpacity={1} />
            <Stop offset="100%" stopColor={cold} stopOpacity={1} />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#tone-${tone})`} />
      </Svg>

      {/* Layer 2 — gold highlight wash, top-left */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          backgroundColor: colors.gold,
          opacity: 0.08,
          borderRadius: 9999,
        }}
      />

      {/* Layer 3 — bottom vignette for legibility */}
      <LinearGradient
        colors={['transparent', `rgba(0,0,0,${dim})`]}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', inset: 0 } as any}
      />

      {label ? (
        <Text
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: fontFamilies.mono.regular,
            fontSize: 9,
            color: 'rgba(245,239,230,0.5)',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
});
