import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { Eyebrow } from '@/components/Eyebrow';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Status } from '@/components/Status';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';

export type AppointmentStatusKind =
  | 'cancelled'
  | 'completed'
  | 'confirmed'
  | 'pending'
  | 'unknown';

type AppointmentCardProps = {
  appointmentId: string;
  shopName: string;
  shopCoverImageUrl?: string | null;
  barberName: string;
  servicesSummary: string;
  /** Mono uppercase eyebrow date — e.g. "WED · APR 16". */
  dateEyebrow: string;
  /** Compact start time — e.g. "3:30 PM". */
  startTime: string;
  status: AppointmentStatusKind;
  /** Localized status label override; defaults to capitalized `status`. */
  statusLabel?: string;
  /** Past variant renders compact text-only row. */
  compact?: boolean;
  /** Whether the user is allowed to cancel (drives swipe enable + hint). */
  canCancel?: boolean;
  /** Render the swipe-to-cancel reveal. */
  showCancelAction?: boolean;
  isCancelling?: boolean;
  onCancel?: (appointmentId: string) => void;
  onPress?: (appointmentId: string) => void;
};

/**
 * Customer appointment card with optional swipe-to-cancel reveal.
 * Source: ScrBookings upcoming card + past row.
 */
export const AppointmentCard = memo(function AppointmentCard(
  props: AppointmentCardProps,
) {
  if (props.compact === true) {
    return <CompactRow {...props} />;
  }
  return <FullCard {...props} />;
});

function FullCard({
  appointmentId,
  shopName,
  shopCoverImageUrl,
  barberName,
  servicesSummary,
  dateEyebrow,
  startTime,
  status,
  statusLabel,
  canCancel = false,
  showCancelAction = false,
  isCancelling = false,
  onCancel,
  onPress,
}: AppointmentCardProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const renderRightActions = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.terra,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 24,
        gap: 8,
      }}
    >
      <Icon name="trash" size={14} color="#F8F3EA" />
      <Text
        style={{
          color: '#F8F3EA',
          fontFamily: fontFamilies.mono.regular,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        {t('customer.bookings.cancelButton')}
      </Text>
    </View>
  );

  const card = (
    <Pressable
      onPress={onPress ? () => onPress(appointmentId) : undefined}
      style={{
        flexDirection: 'row',
        gap: 14,
        padding: 16,
        // `minHeight` not `height` — iOS Fraunces line metrics differ
        // from the design's CSS rendering, so a hard 116px cap clipped
        // the bottom row (time + status). 116 stays as the floor (84px
        // photo + 32px vertical padding); cards grow by a few px when
        // serif metrics need it.
        minHeight: 116,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.goldHair,
        backgroundColor: colors.surface,
        borderCurve: 'continuous',
      }}
    >
      <View
        style={{
          width: 70,
          height: 84,
          borderRadius: 6,
          overflow: 'hidden',
          borderCurve: 'continuous',
        }}
      >
        {shopCoverImageUrl ? (
          <Image
            source={{ uri: shopCoverImageUrl }}
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            contentFit="cover"
            transition={150}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Photo tone="chair" />
        )}
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between', minWidth: 0 }}>
        <View>
          <Eyebrow size={9} color={colors.gold}>
            {dateEyebrow}
          </Eyebrow>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamilies.serif.regular,
              fontSize: 18,
              color: colors.ivory,
              marginTop: 2,
            }}
          >
            {shopName}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
              marginTop: 2,
            }}
          >
            {t('customer.bookings.withBarberAndServices', {
              barber: barberName,
              services: servicesSummary,
            })}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.serif.italic,
              fontSize: 16,
              color: colors.gold,
              fontVariant: ['tabular-nums'],
            }}
          >
            {startTime}
          </Text>
          <Status kind={status} label={statusLabel} compact />
        </View>
      </View>
    </Pressable>
  );

  if (showCancelAction && canCancel && onCancel != null && !isCancelling) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={48}
        overshootRight={false}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') {
            onCancel(appointmentId);
          }
        }}
      >
        {card}
      </Swipeable>
    );
  }
  return card;
}

function CompactRow({
  appointmentId,
  shopName,
  dateEyebrow,
  barberName,
  status,
  statusLabel,
  onPress,
}: AppointmentCardProps) {
  const { colors } = useAppTheme();
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineSoft,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
            color: colors.ivory,
          }}
        >
          {shopName}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fontFamilies.mono.regular,
            fontSize: 11,
            color: colors.muted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {dateEyebrow} · w/ {barberName}
        </Text>
      </View>
      <Status kind={status} label={statusLabel} compact />
    </View>
  );
  if (onPress) {
    return <Pressable onPress={() => onPress(appointmentId)}>{inner}</Pressable>;
  }
  return inner;
}
