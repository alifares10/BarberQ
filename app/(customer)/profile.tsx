import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ButtonText, Card, Text } from '@/components';
import { signOut } from '@/lib/auth/sign-out';
import { useAuthStore } from '@/stores/auth-store';

export default function CustomerProfileScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const signOutMutation = useMutation({
    mutationFn: signOut,
  });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} contentInsetAdjustmentBehavior="automatic">
      <Card>
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34}>
          {t('customer.profileTitle')}
        </Text>
        <Text color="$colorMuted">{t('customer.profileDescription')}</Text>
      </Card>

      <Card>
        <Text fontWeight="700">{profile?.full_name ?? t('customer.profileFallbackName')}</Text>
        <Text color="$colorMuted">{profile?.phone ?? t('customer.profileFallbackPhone')}</Text>
      </Card>

      <Card>
        <Text fontWeight="700">{t('customer.profileAccountTitle')}</Text>
        <Text color="$colorMuted">{t('customer.profileAccountDescription')}</Text>

        <View style={styles.actionsRow}>
          <Button disabled={signOutMutation.isPending} onPress={() => void signOutMutation.mutateAsync()}>
            <ButtonText>
              {signOutMutation.isPending ? t('common.signingOutButton') : t('common.signOutButton')}
            </ButtonText>
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    marginTop: 12,
  },
  contentContainer: {
    gap: 12,
    padding: 16,
    paddingBottom: 24,
  },
});
