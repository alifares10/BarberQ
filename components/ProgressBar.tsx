import { memo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/lib/theme';

export type ProgressBarProps = {
  /** 1-based current step. */
  step: number;
  total: number;
};

/**
 * 1px hairline progress bar pinned at the top of booking flow screens.
 * Gold-fills proportional to `step / total` and animates the width on
 * change (200ms) so step transitions feel coherent.
 *
 * Visually identical to `<StepHeader>`'s built-in bar but without the
 * "STEP NN / NN" label — used inside `<ModalHeader>` where the step
 * count is rendered inline with the screen title.
 */
export const ProgressBar = memo(function ProgressBar({ step, total }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const ratio = Math.min(Math.max(step / total, 0), 1);

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${ratio * 100}%`, { duration: 220 }),
  }));

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.lineSoft,
        width: '100%',
      }}
    >
      <Animated.View
        style={[
          {
            height: 1,
            backgroundColor: colors.gold,
          },
          fillStyle,
        ]}
      />
    </View>
  );
});
