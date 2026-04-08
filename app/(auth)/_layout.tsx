import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components';
import { getHomeRouteForRole } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthLayout() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const profile = useAuthStore((state) => state.profile);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (profile != null) {
    return <Redirect href={getHomeRouteForRole(profile.role as 'customer' | 'shop_owner')} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="role" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
