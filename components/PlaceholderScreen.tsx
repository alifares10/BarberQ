import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';

type PlaceholderAction = {
  href: Href;
  label: string;
};

type PlaceholderScreenProps = {
  actions?: PlaceholderAction[];
  description: string;
  title: string;
};

export function PlaceholderScreen({ actions, description, title }: PlaceholderScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <Card>
          <Text fontFamily="$heading" fontSize={30} fontWeight="800" lineHeight={36}>
            {title}
          </Text>
          <Text color="$colorMuted">{description}</Text>
        </Card>

        {actions != null ? (
          <Card backgroundColor="$cardMuted">
            <Text fontWeight="700">{t('common.nextSteps')}</Text>
            <View style={styles.actions}>
              {actions.map((action) => (
                <Button key={action.label} onPress={() => router.push(action.href)}>
                  <ButtonText>{action.label}</ButtonText>
                </Button>
              ))}
            </View>
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  container: {
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
