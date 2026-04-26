import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppTabBar, Icon, LoadingScreen } from '@/components';
import type { IconName } from '@/components/Icon';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

const tabIcon = (name: IconName) =>
  function TabBarIcon({ color, size }: { color: string; size: number }) {
    return <Icon name={name} color={color} size={size} />;
  };

export default function CustomerTabsLayout() {
  const { t } = useTranslation();
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
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.explore'), tabBarIcon: tabIcon('search') }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: t('tabs.bookings'), tabBarIcon: tabIcon('cal') }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: t('tabs.favorites'), tabBarIcon: tabIcon('heart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('user') }}
      />
    </Tabs>
  );
}
