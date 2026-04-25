import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ButtonText, Card, Text } from '@/components';
import { signOut } from '@/lib/auth/sign-out';
import { useAuthStore } from '@/stores/auth-store';

export default function ShopOwnerProfileScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const signOutMutation = useMutation({
    mutationFn: signOut,
  });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} contentInsetAdjustmentBehavior="automatic">
      <Card>
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34}>
          {t('shopOwner.profileTitle')}
        </Text>
        <Text color="$colorMuted">{t('shopOwner.profileDescription')}</Text>
      </Card>

      <Card>
        <Text fontWeight="700">{profile?.full_name ?? t('shopOwner.profileFallbackName')}</Text>
        <Text color="$colorMuted">{profile?.phone ?? t('shopOwner.profileFallbackPhone')}</Text>
      </Card>

      <Card>
        <Text fontWeight="700">{t('shopOwner.profileAccountTitle')}</Text>
        <Text color="$colorMuted">{t('shopOwner.profileAccountDescription')}</Text>

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
