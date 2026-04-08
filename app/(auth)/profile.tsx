import { useMutation } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreen, Button, ButtonText, Input, Text } from '@/components';
import { createProfile } from '@/lib/auth/api';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileSetupScreen() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const clearOnboardingDraft = useAuthStore((state) => state.clearOnboardingDraft);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);
  const setProfile = useAuthStore((state) => state.setProfile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
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
      clearOnboardingDraft();
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.generic');

      setErrorMessage(message);
    }
  };

  return (
    <AuthScreen
      title={t('auth.profileTitle')}
      description={t('auth.profileDescription')}
      footer={<Text color="$colorMuted">{t('auth.profileFooter')}</Text>}
    >
      <View style={styles.content}>
        <View style={styles.fieldGroup}>
          <Text fontWeight="700">{t('auth.fullNameLabel')}</Text>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            onChangeText={setFullName}
            placeholder={t('auth.fullNamePlaceholder')}
            textContentType="name"
            value={fullName}
          />
        </View>

        <Text color="$colorMuted">
          {t('auth.selectedRoleLabel', {
            role: pendingRole === 'customer' ? t('auth.roleCustomer') : t('auth.roleShopOwner'),
          })}
        </Text>

        {errorMessage != null ? <Text color="$error">{errorMessage}</Text> : null}

        <Button disabled={createProfileMutation.isPending} onPress={() => void handleSubmit()}>
          <ButtonText>
            {createProfileMutation.isPending
              ? t('auth.creatingProfileButton')
              : t('auth.completeProfileButton')}
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
