import { memo, useMemo } from 'react';
import MapView, { Marker } from 'react-native-maps';

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

/**
 * Map view for Explore. We use `initialRegion` (one-shot) instead of the
 * controlled `region` prop because the latter triggers a programmatic
 * camera animation on every parent re-render — type a couple of search
 * keystrokes, those animations stack on the native side, and Apple Maps
 * crashes intermittently. The user can still pan freely; an explicit
 * "recenter" affordance can use a ref + `animateToRegion` if needed.
 */
export const ExploreMap = memo(function ExploreMap({
  center,
  onPressShop,
  shops,
}: ExploreMapProps) {
  const initialRegion = useMemo(
    () => ({
      latitude: center.latitude,
      latitudeDelta: 0.08,
      longitude: center.longitude,
      longitudeDelta: 0.08,
    }),
    // Center should only seed the camera once. If the user's location
    // updates later, the existing camera position is preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <MapView
      initialRegion={initialRegion}
      pitchEnabled={false}
      rotateEnabled={false}
      style={{ flex: 1 }}
    >
      {shops.map((shop) => (
        <Marker
          key={shop.id}
          coordinate={{
            latitude: shop.latitude,
            longitude: shop.longitude,
          }}
          description={shop.address}
          onPress={() => onPressShop(shop.id)}
          title={shop.name}
        />
      ))}
    </MapView>
  );
});
