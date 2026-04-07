import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function BookingScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('booking.title')}
      description={t('booking.description')}
    />
  );
}
