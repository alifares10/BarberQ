import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type ModalHeaderProps = {
  /** Mono uppercase title — defaults to "BOOKING". */
  title: string;
  /** Optional 1-based current step number. Renders gold inline. */
  step?: number;
  total?: number;
  onBack?: () => void;
  /** When set, renders an `x` close button on the right. */
  onClose?: () => void;
};

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Booking-flow nav header: chevL on the left, mono "TITLE  step / total"
 * centered, optional `x` on the right. Mirrors the design's `ModalHeader`.
 *
 * Sits below the `<ProgressBar>` and above the screen's serif headline.
 */
export const ModalHeader = memo(function ModalHeader({
  title,
  step,
  total,
  onBack,
  onClose,
}: ModalHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 36,
      }}
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        disabled={onBack == null}
        style={{ width: 24, alignItems: 'flex-start', opacity: onBack == null ? 0 : 1 }}
      >
        <Icon name="chevL" size={20} color={colors.ivory} />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: fontFamilies.mono.regular,
            fontSize: 9,
            color: colors.muted,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
        {step != null && total != null ? (
          <Text
            style={{
              fontFamily: fontFamilies.mono.regular,
              fontSize: 9,
              color: colors.gold,
              letterSpacing: 2,
              marginLeft: 8,
            }}
          >
            {pad(step)} / {pad(total)}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onClose}
        hitSlop={12}
        disabled={onClose == null}
        style={{ width: 24, alignItems: 'flex-end', opacity: onClose == null ? 0 : 1 }}
      >
        <Icon name="x" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
});
