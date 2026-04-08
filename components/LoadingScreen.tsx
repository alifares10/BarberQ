import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text/Text';

type LoadingScreenProps = {
  description?: string;
  title?: string;
};

export function LoadingScreen({
  description = 'Checking your session and preparing the app.',
  title = 'Loading BarberQ',
}: LoadingScreenProps) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" textAlign="center">
          {title}
        </Text>
        <Text color="$colorMuted" textAlign="center">
          {description}
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
