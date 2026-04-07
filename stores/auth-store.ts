import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type ProfileRole = 'customer' | 'shop_owner' | null;

type AuthStore = {
  role: ProfileRole;
  session: Session | null;
  setRole: (role: ProfileRole) => void;
  setSession: (session: Session | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  role: null,
  session: null,
  reset: () => {
    set({ role: null, session: null });
  },
  setRole: (role) => {
    set({ role });
  },
  setSession: (session) => {
    set({ session });
  },
}));
