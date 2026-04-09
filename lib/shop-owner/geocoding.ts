export type GeocodeResult = {
  latitude: number;
  longitude: number;
  normalizedAddress: string;
};

type NominatimSearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    throw new Error('Please enter an address before geocoding.');
  }

  const queryParams = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    q: trimmedAddress,
  });
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${queryParams.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Unable to geocode this address right now. Please try again.');
  }

  const payload = (await response.json()) as NominatimSearchResult[];
  const firstMatch = payload[0];

  if (firstMatch == null) {
    throw new Error('We could not find this address. Please refine it and try again.');
  }

  const latitude = Number(firstMatch.lat);
  const longitude = Number(firstMatch.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('The geocoding response was invalid. Please try again.');
  }

  return {
    latitude,
    longitude,
    normalizedAddress: firstMatch.display_name,
  };
}
