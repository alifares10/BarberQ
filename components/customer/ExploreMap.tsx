import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text/Text';

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
  return (
    <View style={styles.fallback}>
      <Text color="$colorMuted">Map preview is available on iOS and Android.</Text>
      <Text color="$colorMuted">{shops.length} shops in this area</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 16,
  },
});
