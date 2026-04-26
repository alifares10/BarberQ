import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  Eyebrow,
  FloatingLabelInput,
  Icon,
  SerifTitle,
  StepHeader,
  Text,
} from '@/components';
import { sendOtp } from '@/lib/auth/api';
import { fontFamilies } from '@/lib/fonts';
import { normalizePhoneNumber } from '@/lib/auth/phone';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function PhoneScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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

  const isHebrew = i18n.language?.startsWith('he') ?? false;
  // Display-only country chip — `normalizePhoneNumber` handles the +CC prefix
  // from the input itself. A real picker ships in a follow-up phase.
  const country = isHebrew ? '+972 🇮🇱' : '+1 🇺🇸';

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
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
      }}
    >
      <StepHeader step={1} total={3} />

      <View style={{ marginTop: 30 }}>
        <SerifTitle size={32} weight="regular">
          {t('auth.phoneHeadlineA')}
        </SerifTitle>
        <SerifTitle size={32} italic color={colors.gold}>
          {t('auth.phoneHeadlineB')}
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
          {t('auth.phoneSubtitle')}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginTop: 56,
          alignItems: 'flex-end',
        }}
      >
        <View style={{ width: 88 }}>
          <Eyebrow size={10} color={colors.gold} style={{ marginBottom: 4 }}>
            {t('auth.countryLabel')}
          </Eyebrow>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
              paddingBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamilies.sans.regular,
                fontSize: 16,
                color: colors.ivory,
              }}
            >
              {country}
            </Text>
            <Icon name="chevD" size={14} color={colors.muted} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <FloatingLabelInput
            label={t('auth.phoneLabel')}
            keyboardType="phone-pad"
            autoComplete="tel"
            autoCapitalize="none"
            textContentType="telephoneNumber"
            value={phone}
            onChangeText={setPhone}
            error={errorMessage != null}
          />
        </View>
      </View>

      {errorMessage != null ? (
        <Text
          style={{
            marginTop: 12,
            color: colors.terra,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}

      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          left: 24,
          right: 24,
        }}
      >
        <CTA disabled={sendOtpMutation.isPending} onPress={() => void handleSubmit()}>
          {sendOtpMutation.isPending
            ? t('auth.sendingOtpButton')
            : t('auth.sendOtpButton')}
        </CTA>
        <Text
          style={{
            marginTop: 14,
            textAlign: 'center',
            fontFamily: fontFamilies.sans.regular,
            fontSize: 11,
            lineHeight: 17,
            color: colors.muted,
          }}
        >
          {t('auth.termsPrefix')}{' '}
          <Pressable>
            <Text style={{ color: colors.gold, fontSize: 11 }}>
              {t('auth.termsLink')}
            </Text>
          </Pressable>{' '}
          {t('auth.termsAnd')}{' '}
          <Pressable>
            <Text style={{ color: colors.gold, fontSize: 11 }}>
              {t('auth.privacyLink')}
            </Text>
          </Pressable>
          .
        </Text>
      </View>
    </View>
  );
}
