import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { useAppTheme } from '@/lib/theme';

type ExploreMapProps = {
  center: {
    latitude: number;
    longitude: number;
  };
  onPressShop: (shopId: string) => void;
  shops: {
    address: string;
    id: string;
    latitude: number;
    longitude: number;
    name: string;
  }[];
};

export function ExploreMap({ shops }: ExploreMapProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.fallback, { backgroundColor: colors.chip }]}>
      <Text color="$colorMuted">Map preview is available on iOS and Android.</Text>
      <Text color="$colorMuted">{shops.length} shops in this area</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 16,
  },
});
