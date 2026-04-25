import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreen, Button, ButtonText, Input, Text, useToast } from '@/components';
import { sendOtp, verifyOtp } from '@/lib/auth/api';
import { maskPhoneNumber } from '@/lib/auth/phone';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function OtpScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const clearOnboardingDraft = useAuthStore((state) => state.clearOnboardingDraft);
  const pendingPhone = useAuthStore((state) => state.pendingPhone);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(60);
  const resendOtpMutation = useMutation({
    mutationFn: sendOtp,
  });
  const verifyOtpMutation = useMutation({
    mutationFn: ({ code: otpCode, phone }: { code: string; phone: string }) => verifyOtp(phone, otpCode),
  });

  useEffect(() => {
    if (resendIn <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendIn((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [resendIn]);

  if (pendingPhone == null) {
    return <Redirect href="/(auth)/phone" />;
  }

  if (session != null) {
    return <Redirect href={getOnboardingRoute(pendingRole)} />;
  }

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage(t('auth.errors.invalidCode'));
      return;
    }

    setErrorMessage(null);

    try {
      const result = await verifyOtpMutation.mutateAsync({ code, phone: pendingPhone });

      setPendingPhone(null);

      if (result.needsOnboarding) {
        router.replace('/(auth)/role');
        return;
      }

      clearOnboardingDraft();
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.generic');

      setErrorMessage(message);
    }
  };

  const handleResend = async () => {
    setErrorMessage(null);

    try {
      const result = await resendOtpMutation.mutateAsync(pendingPhone);

      setResendIn(result.retryAfterSeconds);
      showToast({ message: t('toast.otpResent'), type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.generic');

      setErrorMessage(message);
      showToast({ message: t('toast.otpResendFailed'), type: 'error' });
    }
  };

  return (
    <AuthScreen
      title={t('auth.otpTitle')}
      description={t('auth.otpDescription')}
      footer={<Text color="$colorMuted">{t('auth.otpFooter', { phone: maskPhoneNumber(pendingPhone) })}</Text>}
    >
      <View style={styles.content}>
        <View style={styles.fieldGroup}>
          <Text fontWeight="700">{t('auth.otpLabel')}</Text>
          <Input
            autoCapitalize="none"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder={t('auth.otpPlaceholder')}
            textContentType="oneTimeCode"
            value={code}
          />
        </View>

        {errorMessage != null ? <Text color="$error">{errorMessage}</Text> : null}

        <Button disabled={verifyOtpMutation.isPending} onPress={() => void handleVerify()}>
          <ButtonText>
            {verifyOtpMutation.isPending ? t('auth.verifyingOtpButton') : t('auth.verifyOtpButton')}
          </ButtonText>
        </Button>

        <Button disabled={resendOtpMutation.isPending || resendIn > 0} onPress={() => void handleResend()}>
          <ButtonText>
            {resendIn > 0
              ? t('auth.resendOtpCountdown', { seconds: resendIn })
              : resendOtpMutation.isPending
                ? t('auth.resendingOtpButton')
                : t('auth.resendOtpButton')}
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
