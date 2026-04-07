import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function ExploreScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('customer.exploreTitle')}
      description={t('customer.exploreDescription')}
      actions={[{ href: '/booking', label: t('navigation.booking') }]}
    />
  );
}
