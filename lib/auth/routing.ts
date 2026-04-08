import type { Profile, ProfileRole } from '@/stores/auth-store';

type AppRoute = '/(auth)' | '/(auth)/profile' | '/(auth)/role' | '/(customer)' | '/(shop-owner)';

export function getHomeRouteForRole(role: ProfileRole): AppRoute {
  return role === 'shop_owner' ? '/(shop-owner)' : '/(customer)';
}

export function getOnboardingRoute(pendingRole: ProfileRole | null): AppRoute {
  return pendingRole == null ? '/(auth)/role' : '/(auth)/profile';
}

export function getInitialRoute({
  isHydrated,
  pendingRole,
  profile,
  session,
}: {
  isHydrated: boolean;
  pendingRole: ProfileRole | null;
  profile: Profile | null;
  session: object | null;
}) {
  if (!isHydrated) {
    return null;
  }

  if (session == null) {
    return '/(auth)' as const;
  }

  if (profile == null) {
    return getOnboardingRoute(pendingRole);
  }

  return getHomeRouteForRole(profile.role as ProfileRole);
}
