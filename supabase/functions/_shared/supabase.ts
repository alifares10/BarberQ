// @ts-nocheck
/* eslint-disable import/no-unresolved */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.1';

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (value == null || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createPublicClient() {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_ANON_KEY'), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function getRequiredSecret(name: string) {
  return getRequiredEnv(name);
}
