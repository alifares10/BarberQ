import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

/**
 * AppTabBar — icon + tiny mono uppercase label + 24px gold underline on
 * the active tab. The underline animates left/width 200ms on tab change.
 *
 * Each screen passes its icon name via `tabBarIcon`'s `name` prop or
 * `options.tabBarIcon = ({ color, size }) => <Icon name="home" .../>`.
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;

  const activeLayout = layouts[state.index];

  useEffect(() => {
    if (!activeLayout) return;
    const target = activeLayout.x + activeLayout.width / 2 - 12;
    Animated.parallel([
      Animated.timing(underlineX, {
        toValue: target,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(underlineW, {
        toValue: 24,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, underlineX, underlineW]);

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 10,
    paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
  };

  return (
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const tone = isFocused ? colors.gold : colors.muted;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLayout={(e: LayoutChangeEvent) =>
              setLayouts((prev) => ({
                ...prev,
                [index]: {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                },
              }))
            }
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {options.tabBarIcon
              ? options.tabBarIcon({ focused: isFocused, color: tone, size: 20 })
              : null}
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                fontSize: 9,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: tone,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          height: 1,
          width: underlineW,
          left: underlineX,
          backgroundColor: colors.gold,
        }}
      />
    </View>
  );
}
