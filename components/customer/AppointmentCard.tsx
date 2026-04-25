import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';
import { getRtlLayout } from '@/lib/rtl';
import { useAppTheme } from '@/lib/theme';

type AppointmentCardProps = {
  appointmentId: string;
  barberName: string;
  canCancel: boolean;
  date: string;
  endTime: string;
  isCancelling: boolean;
  onCancel: (appointmentId: string) => void;
  servicesSummary: string;
  shopName: string;
  showCancelAction: boolean;
  startTime: string;
  status: 'cancelled' | 'completed' | 'confirmed' | 'pending' | 'unknown';
  statusLabel: string;
};

export const AppointmentCard = memo(function AppointmentCard({
  appointmentId,
  barberName,
  canCancel,
  date,
  endTime,
  isCancelling,
  onCancel,
  servicesSummary,
  shopName,
  showCancelAction,
  startTime,
  status,
  statusLabel,
}: AppointmentCardProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);
  const { colors } = useAppTheme();
  const statusBadgeColor = {
    cancelled: colors.statusCancelled,
    completed: colors.statusCompleted,
    confirmed: colors.statusConfirmed,
    pending: colors.statusPending,
    unknown: colors.statusCompleted,
  }[status];

  return (
    <Card>
      <View style={[styles.headerRow, { flexDirection: rtlLayout.rowDirection }]}>
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{shopName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
          <Text color="$inverseColor">{statusLabel}</Text>
        </View>
      </View>

      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.bookings.barberLine', { barber: barberName })}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{date}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{`${startTime} - ${endTime}`}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{servicesSummary}</Text>

      {showCancelAction ? (
        <View style={styles.cancelSection}>
          <Button disabled={!canCancel || isCancelling} onPress={() => onCancel(appointmentId)}>
            <ButtonText>
              {isCancelling ? t('customer.bookings.cancellingButton') : t('customer.bookings.cancelButton')}
            </ButtonText>
          </Button>
          {!canCancel ? <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.bookings.cancelBlocked')}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  cancelSection: {
    gap: 8,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBadge: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
