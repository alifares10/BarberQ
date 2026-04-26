import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type StepHeaderProps = {
  step: number;
  total: number;
  /** Optional override for the eyebrow label (default: "STEP NN / NN"). */
  label?: string;
};

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Mono "STEP NN / NN" eyebrow + 1px hairline progress bar. Used across
 * auth and booking flows.
 */
export const StepHeader = memo(function StepHeader({
  step,
  total,
  label,
}: StepHeaderProps) {
  const { colors } = useAppTheme();
  const ratio = Math.min(Math.max(step / total, 0), 1);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ height: 1, backgroundColor: colors.lineSoft }}>
        <View
          style={{
            height: 1,
            width: `${ratio * 100}%`,
            backgroundColor: colors.gold,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: fontFamilies.mono.regular,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: colors.muted,
        }}
      >
        {label ?? `Step ${pad(step)} / ${pad(total)}`}
      </Text>
    </View>
  );
});
