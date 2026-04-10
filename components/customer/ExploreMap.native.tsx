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

export function ExploreMap({ center, onPressShop, shops }: ExploreMapProps) {
  return (
    <MapView
      region={{
        latitude: center.latitude,
        latitudeDelta: 0.08,
        longitude: center.longitude,
        longitudeDelta: 0.08,
      }}
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
}
