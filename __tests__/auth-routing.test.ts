import { getHomeRouteForRole, getInitialRoute, getOnboardingRoute } from '@/lib/auth/routing';

describe('auth routing helpers', () => {
  it('routes signed out users to auth', () => {
    expect(
      getInitialRoute({
        isHydrated: true,
        pendingRole: null,
        profile: null,
        session: null,
      })
    ).toBe('/(auth)');
  });

  it('routes users without profiles into onboarding', () => {
    expect(
      getInitialRoute({
        isHydrated: true,
        pendingRole: null,
        profile: null,
        session: {},
      })
    ).toBe('/(auth)/role');
  });

  it('routes users with a selected role to the profile step', () => {
    expect(getOnboardingRoute('customer')).toBe('/(auth)/profile');
  });

  it('routes customers to the customer tab group', () => {
    expect(getHomeRouteForRole('customer')).toBe('/(customer)');
  });

  it('routes shop owners to the shop owner tab group', () => {
    expect(getHomeRouteForRole('shop_owner')).toBe('/(shop-owner)');
  });
});
