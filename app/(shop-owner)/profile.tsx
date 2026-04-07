import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function ShopOwnerProfileScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('shopOwner.profileTitle')}
      description={t('shopOwner.profileDescription')}
    />
  );
}
