import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function OtpScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('auth.otpTitle')}
      description={t('auth.otpDescription')}
      actions={[{ href: '/(auth)/role', label: t('auth.roleTitle') }]}
    />
  );
}
