import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreen, Button, ButtonText, Input, Text } from '@/components';
import { sendOtp } from '@/lib/auth/api';
import { normalizePhoneNumber } from '@/lib/auth/phone';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pendingPhone = useAuthStore((state) => state.pendingPhone);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phone, setPhone] = useState(pendingPhone ?? '');
  const sendOtpMutation = useMutation({
    mutationFn: sendOtp,
  });

  if (session != null) {
    return <Redirect href={getOnboardingRoute(pendingRole)} />;
  }

  const handleSubmit = async () => {
    const normalizedPhone = normalizePhoneNumber(phone);

    if (normalizedPhone == null) {
      setErrorMessage(t('auth.errors.invalidPhone'));
      return;
    }

    setErrorMessage(null);

    try {
      await sendOtpMutation.mutateAsync(normalizedPhone);
      setPendingPhone(normalizedPhone);
      router.push('/(auth)/otp');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.generic');

      setErrorMessage(message);
    }
  };

  return (
    <AuthScreen
      title={t('auth.phoneTitle')}
      description={t('auth.phoneDescription')}
      footer={<Text color="$colorMuted">{t('auth.phoneFooter')}</Text>}
    >
      <View style={styles.content}>
        <View style={styles.fieldGroup}>
          <Text fontWeight="700">{t('auth.phoneLabel')}</Text>
          <Input
            autoCapitalize="none"
            autoComplete="tel"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            textContentType="telephoneNumber"
            value={phone}
          />
        </View>

        {errorMessage != null ? <Text color="$error">{errorMessage}</Text> : null}

        <Button disabled={sendOtpMutation.isPending} onPress={() => void handleSubmit()}>
          <ButtonText>
            {sendOtpMutation.isPending ? t('auth.sendingOtpButton') : t('auth.sendOtpButton')}
          </ButtonText>
        </Button>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
});
