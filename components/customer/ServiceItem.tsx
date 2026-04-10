import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';

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
  const { t } = useTranslation();
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
            <View style={styles.row}>
              <View style={styles.column}>
                <Text fontWeight="700">{name}</Text>
                <Text color="$colorMuted">
                  {t('customer.serviceSelection.durationMinutes', {
                    minutes: duration,
                  })}
                </Text>
              </View>

              <View style={styles.rightColumn}>
                <Text fontWeight="700">
                  {t('customer.serviceSelection.priceValue', {
                    price: price.toFixed(2),
                  })}
                </Text>
                {isSelected ? <Text color="$accent">{t('customer.serviceSelection.selected')}</Text> : null}
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
    alignItems: 'flex-end',
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
