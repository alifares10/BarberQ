import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';
import { useAppTheme } from '@/lib/theme';

type AuthScreenProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
};

export function AuthScreen({ children, description, footer, title }: AuthScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text color="$accent" fontWeight="700" textAlign="center">
            BarberQ
          </Text>
          <Text fontFamily="$heading" fontSize={32} fontWeight="800" lineHeight={38} textAlign="center">
            {title}
          </Text>
          <Text color="$colorMuted" textAlign="center">
            {description}
          </Text>
        </View>

        <Card>{children}</Card>

        {footer != null ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
  },
  footer: {
    alignItems: 'center',
  },
  hero: {
    gap: 10,
  },
});
