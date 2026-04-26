import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  Eyebrow,
  FloatingLabelInput,
  Icon,
  Photo,
  SerifTitle,
  Text,
} from '@/components';
import { createProfile } from '@/lib/auth/api';
import { fontFamilies } from '@/lib/fonts';
import { registerPushToken } from '@/lib/push/register-push-token';
import { getHomeRouteForRole } from '@/lib/auth/routing';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore, type ProfileRole } from '@/stores/auth-store';

export default function ProfileSetupScreen() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const clearOnboardingDraft = useAuthStore((state) => state.clearOnboardingDraft);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);
  const setProfile = useAuthStore((state) => state.setProfile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  // `pronouns` is captured locally for visual parity with the design but is
  // not persisted — `createProfile` does not accept it. A future schema
  // migration would extend the profiles table to store this.
  const [pronouns, setPronouns] = useState('');
  const createProfileMutation = useMutation({
    mutationFn: createProfile,
  });

  if (session == null) {
    return <Redirect href="/(auth)/phone" />;
  }

  if (pendingRole == null) {
    return <Redirect href="/(auth)/role" />;
  }

  const handleSubmit = async () => {
    if (fullName.trim().length < 2) {
      setErrorMessage(t('auth.errors.invalidName'));
      return;
    }

    setErrorMessage(null);

    try {
      const profile = await createProfileMutation.mutateAsync({
        fullName,
        language: i18n.language,
        role: pendingRole,
      });

      setProfile(profile);
      void registerPushToken(profile.id).catch((error) => {
        console.error('Failed to register push token after profile setup', error);
      });
      clearOnboardingDraft();
      router.replace(getHomeRouteForRole(profile.role as ProfileRole));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.generic');

      setErrorMessage(message);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Icon name="chevL" size={18} color={colors.muted} />
        <Eyebrow>{t('auth.profileEyebrow')}</Eyebrow>
      </Pressable>

      <View style={{ marginTop: 40 }}>
        <SerifTitle size={30} weight="regular">
          {t('auth.profileHeadlineA')}
        </SerifTitle>
        <SerifTitle size={30} italic color={colors.gold}>
          {t('auth.profileHeadlineB')}
        </SerifTitle>
        <Text
          style={{
            marginTop: 12,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {t('auth.profileSubtitle')}
        </Text>
      </View>

      <View style={{ marginTop: 36, alignItems: 'center' }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 1,
            borderColor: colors.goldBorder,
            padding: 4,
            borderCurve: 'continuous',
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 56,
              overflow: 'hidden',
              borderCurve: 'continuous',
            }}
          >
            <Photo tone="portrait" dim={0.4} />
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: -4,
            right: '50%',
            transform: [{ translateX: 78 }],
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.gold,
            borderWidth: 2,
            borderColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="camera" size={16} color={colors.bg} sw={1.6} />
        </View>
      </View>

      <View style={{ marginTop: 36, gap: 18 }}>
        <FloatingLabelInput
          label={t('auth.fullNameLabel')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          value={fullName}
          onChangeText={setFullName}
          error={errorMessage != null}
        />
        <FloatingLabelInput
          label={t('auth.pronounsLabel')}
          value={pronouns}
          onChangeText={setPronouns}
        />
      </View>

      {errorMessage != null ? (
        <Text
          style={{
            marginTop: 16,
            color: colors.terra,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 13,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}

      <View style={{ marginTop: 40 }}>
        <CTA
          disabled={createProfileMutation.isPending}
          onPress={() => void handleSubmit()}
        >
          {createProfileMutation.isPending
            ? t('auth.creatingProfileButton')
            : t('auth.completeProfileButton')}
        </CTA>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 14, alignItems: 'center' }}
        >
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {t('auth.profileSkip')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
