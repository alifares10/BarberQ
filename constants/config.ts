export const appConfig = {
  appName: 'BarberQ',
  defaultLanguage: 'en' as const,
  supportedLanguages: ['en', 'he'] as const,
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
};

export const hasSupabaseEnv =
  process.env.EXPO_PUBLIC_SUPABASE_URL != null &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY != null;

export type AppLanguage = (typeof appConfig.supportedLanguages)[number];
