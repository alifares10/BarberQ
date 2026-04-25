import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '@/components';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function CustomerTabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (session == null) {
    return <Redirect href="/(auth)" />;
  }

  if (profile == null) {
    return <Redirect href={getOnboardingRoute(pendingRole)} />;
  }

  if (profile.role !== 'customer') {
    return <Redirect href="/(shop-owner)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.colorMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.explore') }} />
      <Tabs.Screen name="bookings" options={{ title: t('tabs.bookings') }} />
      <Tabs.Screen name="favorites" options={{ title: t('tabs.favorites') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
