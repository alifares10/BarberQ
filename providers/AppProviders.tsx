import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import '@/lib/i18n';

import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/providers/AuthProvider';
import tamaguiConfig from '@/tamagui.config';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TamaguiProvider
            config={tamaguiConfig}
            defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            {children}
          </TamaguiProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
