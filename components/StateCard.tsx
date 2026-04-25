import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';
import { getRtlLayout } from '@/lib/rtl';

type StateCardVariant = 'empty' | 'error' | 'info' | 'loading';

type StateCardProps = {
  actionLabel?: string;
  description: string;
  framed?: boolean;
  onAction?: () => void;
  title?: string;
  variant?: StateCardVariant;
};

const descriptionColorByVariant: Record<StateCardVariant, '$colorMuted' | '$error'> = {
  empty: '$colorMuted',
  error: '$error',
  info: '$colorMuted',
  loading: '$colorMuted',
};

const titleKeyByVariant: Record<StateCardVariant, string> = {
  empty: 'common.state.emptyTitle',
  error: 'common.state.errorTitle',
  info: 'common.state.infoTitle',
  loading: 'common.state.loadingTitle',
};

export function StateCard({
  actionLabel,
  description,
  framed = true,
  onAction,
  title,
  variant = 'info',
}: StateCardProps) {
  const { i18n, t } = useTranslation();
  const rtlLayout = getRtlLayout(i18n.language);
  const resolvedTitle = title ?? t(titleKeyByVariant[variant]);

  const content = (
    <>
      <View style={[styles.header, { alignItems: rtlLayout.leadingAlignItems }]}>
        {variant === 'loading' ? <ActivityIndicator size="small" /> : null}
        <Text fontWeight="700" textAlign={rtlLayout.textAlign}>
          {resolvedTitle}
        </Text>
      </View>
      <Text color={descriptionColorByVariant[variant]} textAlign={rtlLayout.textAlign}>
        {description}
      </Text>
      {actionLabel != null && onAction != null ? (
        <Button onPress={onAction}>
          <ButtonText>{actionLabel}</ButtonText>
        </Button>
      ) : null}
    </>
  );

  if (!framed) {
    return <View style={styles.inline}>{content}</View>;
  }

  return (
    <Card style={styles.card}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  header: {
    gap: 8,
  },
  inline: {
    gap: 10,
  },
});
