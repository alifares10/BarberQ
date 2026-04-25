import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';
import { getRtlLayout } from '@/lib/rtl';

type ServiceItemProps = {
  duration: number;
  isSelected: boolean;
  name: string;
  onToggle: (serviceId: string) => void;
  price: number;
  serviceId: string;
};

export const ServiceItem = memo(function ServiceItem({
  duration,
  isSelected,
  name,
  onToggle,
  price,
  serviceId,
}: ServiceItemProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);
  const isPressed = useSharedValue(0);
  const pressGesture = Gesture.Tap()
    .onBegin(() => {
      isPressed.value = 1;
    })
    .onFinalize(() => {
      isPressed.value = 0;
    });
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPressed.value === 1 ? 0.8 : 1, { duration: 100 }),
    transform: [
      {
        scale: withTiming(isPressed.value === 1 ? 0.97 : 1, { duration: 100 }),
      },
    ],
  }));

  return (
    <GestureDetector gesture={pressGesture}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={() => onToggle(serviceId)}>
          <Card style={isSelected ? styles.selectedCard : styles.card}>
            <View style={[styles.row, { flexDirection: rtlLayout.rowDirection }]}>
              <View style={[styles.column, { alignItems: rtlLayout.leadingAlignItems }]}>
                <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{name}</Text>
                <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>
                  {t('customer.serviceSelection.durationMinutes', {
                    minutes: duration,
                  })}
                </Text>
              </View>

              <View style={[styles.rightColumn, { alignItems: rtlLayout.trailingAlignItems }]}>
                <Text fontWeight="700" textAlign={rtlLayout.textAlign}>
                  {t('customer.serviceSelection.priceValue', {
                    price: price.toFixed(2),
                  })}
                </Text>
                {isSelected ? <Text color="$accent" textAlign={rtlLayout.textAlign}>{t('customer.serviceSelection.selected')}</Text> : null}
              </View>
            </View>
          </Card>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 18,
    boxShadow: '0px 6px 18px rgba(2, 6, 23, 0.08)',
  },
  column: {
    flex: 1,
    gap: 4,
  },
  rightColumn: {
    gap: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  selectedCard: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0px 6px 18px rgba(79, 70, 229, 0.15)',
  },
});
