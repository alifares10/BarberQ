import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import i18n from '@/lib/i18n';
import { Text } from '@/components/Text/Text';

type LoadingScreenProps = {
  description?: string;
  title?: string;
};

export function LoadingScreen({
  description,
  title,
}: LoadingScreenProps) {
  const resolvedTitle =
    title ?? (i18n.isInitialized ? i18n.t('common.loadingTitle') : 'Loading BarberQ');
  const resolvedDescription =
    description ??
    (i18n.isInitialized
      ? i18n.t('common.loadingDescription')
      : 'Checking your session and preparing the app.');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign="center">
          {resolvedTitle}
        </Text>
        <Text color="$colorMuted" textAlign="center">
          {resolvedDescription}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
