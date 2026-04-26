import { forwardRef, useEffect, useRef, useState } from 'react';
import type { TextInput as RNTextInput, TextInputProps, ViewStyle } from 'react-native';
import { Animated, I18nManager, TextInput, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type FloatingLabelInputProps = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  /** Optional prefix glyph rendered to the left of the input value. */
  prefix?: string;
  /** Treat the value as monospace digits (OTP, codes). */
  mono?: boolean;
  containerStyle?: ViewStyle;
  /** Forces error styling. */
  error?: boolean;
};

/**
 * Floating-label text input. Underline-only: 1px hairline at rest,
 * gold on focus. Label slides up + shrinks when focused or filled.
 */
export const FloatingLabelInput = forwardRef<RNTextInput, FloatingLabelInputProps>(
  function FloatingLabelInput(
    {
      label,
      prefix,
      mono = false,
      value,
      onFocus,
      onBlur,
      containerStyle,
      error = false,
      style,
      ...rest
    },
    ref,
  ) {
    const { colors } = useAppTheme();
    const [focused, setFocused] = useState(false);
    const hasValue = (value?.length ?? 0) > 0;
    const floated = focused || hasValue;

    const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(labelAnim, {
        toValue: floated ? 1 : 0,
        duration: 160,
        useNativeDriver: false,
      }).start();
    }, [floated, labelAnim]);

    const labelTop = labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 0],
    });
    const labelFontSize = labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 11],
    });
    const labelColor = error
      ? colors.terra
      : focused
        ? colors.gold
        : colors.muted;

    const underlineColor = error
      ? colors.terra
      : focused
        ? colors.gold
        : colors.lineSoft;

    return (
      <View style={[{ paddingTop: 18 }, containerStyle]}>
        <Animated.Text
          style={{
            position: 'absolute',
            left: 0,
            top: labelTop,
            fontFamily: fontFamilies.mono.regular,
            fontSize: labelFontSize,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: labelColor,
          }}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 36 }}>
          {prefix ? (
            <Text
              style={{
                color: colors.muted,
                fontFamily: mono
                  ? fontFamilies.mono.regular
                  : fontFamilies.sans.regular,
                fontSize: 16,
                marginRight: 8,
              }}
            >
              {prefix}
            </Text>
          ) : null}
          <TextInput
            ref={ref}
            value={value}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            placeholderTextColor={colors.mutedLow}
            style={[
              {
                flex: 1,
                color: colors.ivory,
                fontFamily: mono
                  ? fontFamilies.mono.medium
                  : fontFamilies.sans.regular,
                fontSize: mono ? 18 : 16,
                letterSpacing: mono ? 2 : 0,
                paddingVertical: 6,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
              },
              style,
            ]}
            {...rest}
          />
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: underlineColor,
            marginTop: 4,
          }}
        />
      </View>
    );
  },
);
