import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function FavoritesScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('customer.favoritesTitle')}
      description={t('customer.favoritesDescription')}
    />
  );
}
