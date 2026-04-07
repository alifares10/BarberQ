import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'BarberQ',
  slug: 'barberq',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'barberq',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  plugins: ['expo-router', 'expo-localization'],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
};

export default config;
