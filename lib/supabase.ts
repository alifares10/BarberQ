import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { appConfig, hasSupabaseEnv } from '@/constants/config';
import type { Database } from '@/types/database';

const authStorage =
  typeof window === 'undefined'
    ? {
        getItem: async () => null,
        removeItem: async () => {},
        setItem: async () => {},
      }
    : AsyncStorage;

const shouldPersistSession = typeof window !== 'undefined';

if (!hasSupabaseEnv) {
  console.warn('Supabase environment variables are missing. Using placeholder values for Phase 1 scaffolding.');
}

export const supabase = createClient<Database>(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: shouldPersistSession,
    storage: authStorage,
  },
});
