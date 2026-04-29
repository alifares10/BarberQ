import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  Eyebrow,
  HairlineDivider,
  Photo,
  SerifTitle,
  Text,
  useToast,
} from '@/components';
import { LanguageSegmentedToggle } from '@/components/customer/LanguageSegmentedToggle';
import { SettingsRow } from '@/components/customer/SettingsRow';
import { signOut } from '@/lib/auth/sign-out';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';

export default function CustomerProfileScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const profile = useAuthStore((state) => state.profile);
  const signOutMutation = useMutation({ mutationFn: signOut });

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch {
      showToast({ message: t('toast.signOutFailed'), type: 'error' });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 80,
      }}
    >
      <SerifTitle size={32} weight="regular">
        {t('customer.profileTitle')}
      </SerifTitle>

      {/* Avatar block */}
      <View style={{ alignItems: 'center', marginTop: 24, gap: 14 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 1.5,
            borderColor: colors.gold,
            padding: 4,
            borderCurve: 'continuous',
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 44,
              overflow: 'hidden',
              borderCurve: 'continuous',
            }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                placeholder={{ blurhash: DEFAULT_BLURHASH }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Photo tone="portrait" dim={0.3} />
            )}
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <SerifTitle size={24} weight="regular">
            {profile?.full_name ?? t('customer.profileFallbackName')}
          </SerifTitle>
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
              fontVariant: ['tabular-nums'],
            }}
          >
            {profile?.phone ?? t('customer.profileFallbackPhone')}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/profile')}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.line,
            borderCurve: 'continuous',
          }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.mono.regular,
              fontSize: 11,
              color: colors.muted,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {t('customer.profile.editButton')}
          </Text>
        </Pressable>
      </View>

      <HairlineDivider spacing={20} />

      {/* Settings list */}
      <View>
        <SettingsRow
          icon="globe"
          label={t('customer.profile.languageLabel')}
          valueComponent={<LanguageSegmentedToggle />}
        />
        <SettingsRow
          icon="bell"
          label={t('customer.profile.notificationsLabel')}
          value={t('customer.profile.notificationsValue')}
          chev
          onPress={() => {
            // TODO: route to notifications settings.
          }}
        />
        <SettingsRow
          icon="pin"
          label={t('customer.profile.locationLabel')}
          value={t('customer.profile.locationValue')}
          chev
          onPress={() => {
            // TODO: route to location settings.
          }}
        />
        <SettingsRow
          icon="lock"
          label={t('customer.profile.privacyLabel')}
          chev
          onPress={() => {
            // TODO: route to privacy & data settings.
          }}
        />
        <SettingsRow
          icon="moon"
          label={t('customer.profile.appearanceLabel')}
          value={
            isDark
              ? t('customer.profile.appearanceValueDark')
              : t('customer.profile.appearanceValueLight')
          }
          chev
          onPress={() => {
            // TODO: route to appearance settings.
          }}
        />
        <SettingsRow
          icon="info"
          label={t('customer.profile.aboutLabel')}
          value={t('customer.profile.aboutValue')}
          chev
          isLast
          onPress={() => {
            // TODO: route to about screen.
          }}
        />
      </View>

      {/* Sign out */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Pressable
          onPress={() => void handleSignOut()}
          disabled={signOutMutation.isPending}
        >
          <Eyebrow size={11} color={colors.terra}>
            {signOutMutation.isPending
              ? t('common.signingOutButton')
              : t('common.signOutButton')}
          </Eyebrow>
        </Pressable>
      </View>
    </ScrollView>
  );
}
