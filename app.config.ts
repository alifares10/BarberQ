import type { ExpoConfig } from 'expo/config';

const easProjectId = process.env.EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: 'BarberQ',
  slug: 'barberq',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'barberq',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: easProjectId,
    },
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-font',
    [
      'expo-notifications',
      {
        color: '#111827',
        defaultChannel: 'default',
      },
    ],
  ],
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
