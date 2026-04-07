import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components';

export default function PhoneScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('auth.phoneTitle')}
      description={t('auth.phoneDescription')}
      actions={[{ href: '/(auth)/otp', label: t('auth.otpTitle') }]}
    />
  );
}
