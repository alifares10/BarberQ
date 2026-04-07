import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function ProfileSetupScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('auth.profileTitle')}
      description={t('auth.profileDescription')}
      actions={[
        { href: '/(customer)', label: t('navigation.customer') },
        { href: '/(shop-owner)', label: t('navigation.shopOwner') },
      ]}
    />
  );
}
