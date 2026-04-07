import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function CustomerProfileScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('customer.profileTitle')}
      description={t('customer.profileDescription')}
    />
  );
}
