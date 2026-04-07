import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { appConfig, hasSupabaseEnv } from '@/constants/config';

if (!hasSupabaseEnv) {
  console.warn('Supabase environment variables are missing. Using placeholder values for Phase 1 scaffolding.');
}

export const supabase = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
});
