import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components';
import { getOnboardingRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function BookingLayout() {
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[shopId]" />
      <Stack.Screen name="barber" />
      <Stack.Screen name="services" />
      <Stack.Screen name="datetime" />
    </Stack>
  );
}
