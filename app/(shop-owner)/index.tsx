import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function DashboardScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('shopOwner.dashboardTitle')}
      description={t('shopOwner.dashboardDescription')}
    />
  );
}
