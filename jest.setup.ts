import type { ReactNode } from 'react';

import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');

  return {
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('expo-router', () => ({
  Redirect: () => null,
  Stack: Object.assign(
    ({ children }: { children: ReactNode }) => children,
    { Screen: () => null }
  ),
  Tabs: Object.assign(
    ({ children }: { children: ReactNode }) => children,
    { Screen: () => null }
  ),
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSegments: () => [],
}));
