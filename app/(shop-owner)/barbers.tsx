import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function BarbersScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('shopOwner.barbersTitle')}
      description={t('shopOwner.barbersDescription')}
    />
  );
}
