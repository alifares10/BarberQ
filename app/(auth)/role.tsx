import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function RoleScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('auth.roleTitle')}
      description={t('auth.roleDescription')}
      actions={[{ href: '/(auth)/profile', label: t('auth.profileTitle') }]}
    />
  );
}
