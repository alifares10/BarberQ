const EARTH_RADIUS_KM = 6_371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lng2 - lng1);
  const latitude1 = toRadians(lat1);
  const latitude2 = toRadians(lat2);
  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return EARTH_RADIUS_KM * angularDistance;
}

export function formatDistance(km: number) {
  if (!Number.isFinite(km) || km < 0) {
    return '0 km';
  }

  const rounded = Math.round(km * 10) / 10;

  return `${rounded.toFixed(1).replace(/\.0$/, '')} km`;
}
