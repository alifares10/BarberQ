import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function CalendarScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('shopOwner.calendarTitle')}
      description={t('shopOwner.calendarDescription')}
    />
  );
}
