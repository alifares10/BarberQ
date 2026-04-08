import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components';
import { getInitialRoute } from '@/lib/auth/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function IndexScreen() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const pendingRole = useAuthStore((state) => state.pendingRole);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const targetRoute = getInitialRoute({
    isHydrated,
    pendingRole,
    profile,
    session,
  });

  if (targetRoute == null) {
    return <LoadingScreen />;
  }

  return <Redirect href={targetRoute} />;
}
