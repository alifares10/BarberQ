import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type CTAVariant = 'solid' | 'ghost';

export type CTAProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: CTAVariant;
  disabled?: boolean;
  /** Optional left-side adornment (icon). */
  leading?: ReactNode;
  /** Optional right-side adornment (icon). */
  trailing?: ReactNode;
  style?: ViewStyle;
};

/**
 * Primary call-to-action. One gold solid CTA per screen, with `ghost`
 * for secondary text-link variants. Source: tokens.jsx:207-228.
 */
export function CTA({
  children,
  onPress,
  variant = 'solid',
  disabled = false,
  leading,
  trailing,
  style,
}: CTAProps) {
  const { colors } = useAppTheme();

  const isGhost = variant === 'ghost';
  const bg = isGhost ? 'transparent' : disabled ? colors.goldDim : colors.gold;
  const fg = isGhost ? colors.gold : disabled ? colors.muted : colors.bg;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          height: isGhost ? 40 : 52,
          borderRadius: isGhost ? 0 : 12,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: isGhost ? 0 : 24,
          opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          transform: pressed && !disabled ? [{ scale: 0.98 }] : [],
          borderCurve: 'continuous',
        },
        style,
      ]}
    >
      {leading ? <View>{leading}</View> : null}
      <Text
        style={{
          color: fg,
          fontFamily: isGhost ? fontFamilies.serif.italic : fontFamilies.sans.semibold,
          fontSize: isGhost ? 14 : 15,
          letterSpacing: isGhost ? 0.3 : 0.6,
          textTransform: isGhost ? 'none' : 'uppercase',
        }}
      >
        {children}
      </Text>
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}
