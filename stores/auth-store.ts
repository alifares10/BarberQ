import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Database } from '@/types/database';

export type ProfileRole = 'customer' | 'shop_owner';
export type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthStore = {
  authUser: User | null;
  isHydrated: boolean;
  pendingPhone: string | null;
  pendingRole: ProfileRole | null;
  profile: Profile | null;
  session: Session | null;
  clearOnboardingDraft: () => void;
  reset: () => void;
  setAuthState: (state: {
    authUser: User | null;
    profile: Profile | null;
    session: Session | null;
  }) => void;
  setHydrated: (isHydrated: boolean) => void;
  setPendingPhone: (phone: string | null) => void;
  setPendingRole: (role: ProfileRole | null) => void;
  setProfile: (profile: Profile | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  authUser: null,
  clearOnboardingDraft: () => {
    set({ pendingPhone: null, pendingRole: null });
  },
  isHydrated: false,
  pendingPhone: null,
  pendingRole: null,
  profile: null,
  session: null,
  reset: () => {
    set({
      authUser: null,
      isHydrated: true,
      pendingPhone: null,
      pendingRole: null,
      profile: null,
      session: null,
    });
  },
  setAuthState: ({ authUser, profile, session }) => {
    set({ authUser, profile, session });
  },
  setHydrated: (isHydrated) => {
    set({ isHydrated });
  },
  setPendingPhone: (pendingPhone) => {
    set({ pendingPhone });
  },
  setPendingRole: (pendingRole) => {
    set({ pendingRole });
  },
  setProfile: (profile) => {
    set({ profile });
  },
}));
