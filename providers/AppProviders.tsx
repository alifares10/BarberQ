import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { LoadingScreen } from '@/components/LoadingScreen';
import { ToastProvider } from '@/components/ToastProvider';
import { useAppFonts } from '@/lib/fonts';
import { i18nReady } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/providers/AuthProvider';
import tamaguiConfig from '@/tamagui.config';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [isI18nReady, setIsI18nReady] = useState(false);
  const { fontsLoaded } = useAppFonts();

  useEffect(() => {
    let isMounted = true;

    i18nReady
      .catch((error) => {
        console.error('Failed to initialize i18n', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsI18nReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TamaguiProvider
            config={tamaguiConfig}
            defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            {isI18nReady && fontsLoaded ? (
              <ToastProvider>
                <AuthProvider>{children}</AuthProvider>
              </ToastProvider>
            ) : (
              <LoadingScreen />
            )}
          </TamaguiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
