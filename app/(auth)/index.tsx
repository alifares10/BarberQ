import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function AuthIndexScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('auth.welcomeTitle')}
      description={t('auth.welcomeDescription')}
      actions={[
        { href: '/(auth)/phone', label: t('auth.phoneTitle') },
        { href: '/(customer)', label: t('navigation.customer') },
        { href: '/(shop-owner)', label: t('navigation.shopOwner') },
      ]}
    />
  );
}
