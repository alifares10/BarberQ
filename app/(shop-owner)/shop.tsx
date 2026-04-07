import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function ShopManagementScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('shopOwner.shopTitle')}
      description={t('shopOwner.shopDescription')}
    />
  );
}
