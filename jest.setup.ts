import type { ReactNode } from 'react';

import '@testing-library/react-native/build/matchers/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

jest.mock('expo-device', () => ({
  __esModule: true,
  isDevice: true,
}));

jest.mock('expo-notifications', () => ({
  __esModule: true,
  AndroidImportance: {
    DEFAULT: 3,
  },
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');

  return {
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-reanimated', () => {
  const View = jest.requireActual('react-native').View;
  return {
    __esModule: true,
    default: { createAnimatedComponent: (component: unknown) => component, View },
    useSharedValue: (initialValue: unknown) => ({ value: initialValue }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withDelay: (_: unknown, value: unknown) => value,
    Easing: { linear: jest.fn(), ease: jest.fn(), bezier: jest.fn() },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    createAnimatedComponent: (component: unknown) => component,
  };
});

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
    replace: jest.fn(),
  }),
  useSegments: () => [],
}));

jest.mock('@/lib/supabase', () => {
  const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const queryBuilder: any = {
    delete: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    gt: jest.fn(() => queryBuilder),
    insert: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    maybeSingle,
    order: jest.fn(() => queryBuilder),
    select: jest.fn(() => queryBuilder),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn(() => queryBuilder),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: jest.fn(() => ({
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        })),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        setSession: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
      from: jest.fn(() => queryBuilder),
      functions: {
        invoke: jest.fn(),
      },
    },
  };
});
