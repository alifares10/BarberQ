import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CTA, Eyebrow, Photo, SerifTitle, Text, Wordmark } from '@/components';
import { fontFamilies } from '@/lib/fonts';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);

  if (session != null) {
    return <Redirect href={getOnboardingRoute(pendingRole)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Layer 1 — full-bleed warm photo */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Photo tone="interior" dim={0.55} />
      </View>

      {/* Layer 2 — top→bottom darken for legibility */}
      <LinearGradient
        colors={[
          'rgba(14,11,8,0.3)',
          'rgba(14,11,8,0.1)',
          'rgba(14,11,8,0.85)',
        ]}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Wordmark + eyebrow */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 40,
          left: 0,
          right: 0,
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Wordmark size={36} />
        <Eyebrow size={9} style={{ letterSpacing: 4 }}>
          {t('auth.welcomeEyebrow')}
        </Eyebrow>
      </View>

      {/* Headline + subtitle */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 180,
          left: 32,
          right: 32,
          alignItems: 'center',
        }}
      >
        <SerifTitle size={38} weight="regular" style={{ textAlign: 'center' }}>
          {t('auth.welcomeHeadlineA')}
        </SerifTitle>
        <SerifTitle
          size={38}
          italic
          color={colors.gold}
          style={{ textAlign: 'center' }}
        >
          {t('auth.welcomeHeadlineB')}
        </SerifTitle>
        <Text
          style={{
            marginTop: 18,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
            lineHeight: 19,
            letterSpacing: 0.2,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          {t('auth.welcomeSubtitle')}
        </Text>
      </View>

      {/* Bottom CTA + sign-in link */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          left: 24,
          right: 24,
        }}
      >
        <CTA onPress={() => router.push('/(auth)/phone')}>
          {t('auth.welcomeCta')}
        </CTA>
        <Pressable
          onPress={() => router.push('/(auth)/phone')}
          style={{ marginTop: 14, alignItems: 'center' }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {t('auth.welcomeSignInPrompt')}{' '}
            <Text
              style={{
                color: colors.gold,
                textDecorationLine: 'underline',
                textDecorationColor: colors.goldBorder,
              }}
            >
              {t('auth.welcomeSignIn')}
            </Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
