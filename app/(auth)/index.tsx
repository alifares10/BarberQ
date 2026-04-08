import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreen, Button, ButtonText, Text } from '@/components';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const session = useAuthStore((state) => state.session);

  if (session != null) {
    return <Redirect href={getOnboardingRoute(pendingRole)} />;
  }

  return (
    <AuthScreen
      title={t('auth.welcomeTitle')}
      description={t('auth.welcomeDescription')}
      footer={<Text color="$colorMuted">{t('auth.welcomeFooter')}</Text>}
    >
      <View style={styles.content}>
        <Text>{t('auth.welcomeBody')}</Text>
        <Button onPress={() => router.push('/(auth)/phone')}>
          <ButtonText>{t('auth.startButton')}</ButtonText>
        </Button>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
});
