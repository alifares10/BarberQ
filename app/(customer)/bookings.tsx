import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function CustomerBookingsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('customer.bookingsTitle')}
      description={t('customer.bookingsDescription')}
    />
  );
}
