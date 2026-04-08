import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreen, Button, ButtonText, Text } from '@/components';
import { useAuthStore } from '@/stores/auth-store';

export default function RoleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setPendingRole = useAuthStore((state) => state.setPendingRole);

  if (session == null) {
    return <Redirect href="/(auth)/phone" />;
  }

  const selectRole = (role: 'customer' | 'shop_owner') => {
    setPendingRole(role);
    router.push('/(auth)/profile');
  };

  return (
    <AuthScreen
      title={t('auth.roleTitle')}
      description={t('auth.roleDescription')}
      footer={<Text color="$colorMuted">{t('auth.roleFooter')}</Text>}
    >
      <View style={styles.content}>
        <Button onPress={() => selectRole('customer')}>
          <ButtonText>{t('auth.roleCustomer')}</ButtonText>
        </Button>
        <Button onPress={() => selectRole('shop_owner')}>
          <ButtonText>{t('auth.roleShopOwner')}</ButtonText>
        </Button>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
});
