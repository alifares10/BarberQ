import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CTA, SerifTitle, StepHeader, Text, useToast } from '@/components';
import { sendOtp, verifyOtp } from '@/lib/auth/api';
import { fontFamilies } from '@/lib/fonts';
import { maskPhoneNumber } from '@/lib/auth/phone';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const OTP_LENGTH = 6;

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function OtpScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const clearOnboardingDraft = useAuthStore((state) => state.clearOnboardingDraft);
  const pendingPhone = useAuthStore((state) => state.pendingPhone);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(60);
  const hiddenInputRef = useRef<RNTextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const resendOtpMutation = useMutation({
    mutationFn: sendOtp,
  });
  const verifyOtpMutation = useMutation({
    mutationFn: ({ code: otpCode, phone }: { code: string; phone: string }) =>
      verifyOtp(phone, otpCode),
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

  // Holds the latest `handleVerify` so the auto-submit effect can call it
  // without re-firing whenever the function identity changes each render.
  const handleVerifyRef = useRef<() => Promise<void>>(async () => {});

  // Auto-submit when the user has entered all six digits — saves a tap and
  // matches the keyboard-flow expectation on iOS number-pad which has no
  // Done key. Depending on `code` only is intentional.
  useEffect(() => {
    if (code.length === OTP_LENGTH && !verifyOtpMutation.isPending) {
      Keyboard.dismiss();
      void handleVerifyRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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

  // Keep the ref pointed at the latest `handleVerify` closure so the
  // auto-submit effect always calls the most current version.
  handleVerifyRef.current = handleVerify;

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

  const cells = Array.from({ length: OTP_LENGTH });
  const focusIndex = code.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          // Tapping outside the cells dismisses the keypad. The cell row
          // re-focuses the hidden input via its own Pressable.
          Keyboard.dismiss();
        }}
        accessible={false}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <StepHeader step={2} total={3} />

      <View style={{ marginTop: 30 }}>
        <SerifTitle size={32} weight="regular">
          {t('auth.otpHeadlineA')}
        </SerifTitle>
        <SerifTitle size={32} italic color={colors.gold}>
          {t('auth.otpHeadlineB')}
        </SerifTitle>
        <Text
          style={{
            marginTop: 14,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {t('auth.otpSentTo')}{' '}
          <Text style={{ color: colors.ivory }}>{maskPhoneNumber(pendingPhone)}</Text>
        </Text>
      </View>

      <Pressable
        onPress={() => hiddenInputRef.current?.focus()}
        style={{ marginTop: 48, flexDirection: 'row', gap: 10 }}
      >
        {cells.map((_, i) => {
          const isCellFocused = isFocused && i === focusIndex;
          const digit = code[i] ?? '';
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 64,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isCellFocused ? colors.gold : colors.line,
                backgroundColor: isCellFocused ? colors.goldDim : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                borderCurve: 'continuous',
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamilies.serif.medium,
                  fontSize: 28,
                  color: colors.ivory,
                }}
              >
                {digit}
              </Text>
            </View>
          );
        })}
        <TextInput
          ref={hiddenInputRef}
          value={code}
          onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, OTP_LENGTH))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          caretHidden
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
          }}
        />
      </Pressable>

      <View style={{ marginTop: 22, alignItems: 'center' }}>
        {resendIn > 0 ? (
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {t('auth.otpResendPrefix')}{' '}
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                color: colors.ivory,
                fontSize: 12,
              }}
            >
              {formatCountdown(resendIn)}
            </Text>
          </Text>
        ) : (
          <Pressable
            disabled={resendOtpMutation.isPending}
            onPress={() => void handleResend()}
          >
            <Text
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 12,
                color: colors.gold,
              }}
            >
              {resendOtpMutation.isPending
                ? t('auth.resendingOtpButton')
                : t('auth.resendOtpButton')}
            </Text>
          </Pressable>
        )}
      </View>

          {errorMessage != null ? (
            <Text
              style={{
                marginTop: 16,
                textAlign: 'center',
                color: colors.terra,
                fontFamily: fontFamilies.sans.regular,
                fontSize: 13,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}

          {/* Spacer pushes the CTA to the bottom; KeyboardAvoidingView
              shrinks the available area when the keypad is up. */}
          <View style={{ flex: 1 }} />

          <View>
            <CTA
              disabled={code.length < OTP_LENGTH || verifyOtpMutation.isPending}
              onPress={() => {
                Keyboard.dismiss();
                void handleVerify();
              }}
            >
              {verifyOtpMutation.isPending
                ? t('auth.verifyingOtpButton')
                : t('auth.verifyOtpButton')}
            </CTA>
            <Pressable
              onPress={() => router.back()}
              style={{ marginTop: 14, alignItems: 'center' }}
            >
              <Text
                style={{
                  fontFamily: fontFamilies.sans.regular,
                  fontSize: 12,
                  color: colors.gold,
                }}
              >
                {t('auth.otpUseDifferentNumber')}
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
