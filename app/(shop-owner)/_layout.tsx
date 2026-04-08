import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '@/components';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function ShopOwnerTabsLayout() {
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

  if (profile.role !== 'shop_owner') {
    return <Redirect href="/(customer)" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tabs.calendar') }} />
      <Tabs.Screen name="shop" options={{ title: t('tabs.shop') }} />
      <Tabs.Screen name="barbers" options={{ title: t('tabs.barbers') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
