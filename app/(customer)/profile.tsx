import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ButtonText, Card, LanguageSettingsCard, Text, useToast } from '@/components';
import { signOut } from '@/lib/auth/sign-out';
import { getRtlLayout } from '@/lib/rtl';
import { useAuthStore } from '@/stores/auth-store';

export default function CustomerProfileScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const rtlLayout = getRtlLayout(i18n.language);
  const profile = useAuthStore((state) => state.profile);
  const signOutMutation = useMutation({
    mutationFn: signOut,
  });
  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch {
      showToast({ message: t('toast.signOutFailed'), type: 'error' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} contentInsetAdjustmentBehavior="automatic">
      <Card>
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign={rtlLayout.textAlign}>
          {t('customer.profileTitle')}
        </Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.profileDescription')}</Text>
      </Card>

      <Card>
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{profile?.full_name ?? t('customer.profileFallbackName')}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{profile?.phone ?? t('customer.profileFallbackPhone')}</Text>
      </Card>

      <LanguageSettingsCard />

      <Card>
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('customer.profileAccountTitle')}</Text>
        <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('customer.profileAccountDescription')}</Text>

        <View style={styles.actionsRow}>
          <Button disabled={signOutMutation.isPending} onPress={() => void handleSignOut()}>
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
