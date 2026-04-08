import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile, ProfileRole } from '@/stores/auth-store';

type SendOtpResponse = {
  expiresInSeconds: number;
  maskedPhone: string;
  retryAfterSeconds: number;
};

type VerifyOtpResponse = {
  needsOnboarding: boolean;
  session: {
    access_token: string;
    refresh_token: string;
  };
};

function isNoRowsError(error: PostgrestError | null) {
  return error?.code === 'PGRST116';
}

export async function fetchProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error != null && !isNoRowsError(error)) {
    throw error;
  }

  return data satisfies Profile | null;
}

export async function sendOtp(phone: string) {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { phone },
  });

  if (error != null) {
    throw error;
  }

  return data as SendOtpResponse;
}

export async function verifyOtp(phone: string, code: string) {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { code, phone },
  });

  if (error != null) {
    throw error;
  }

  const payload = data as VerifyOtpResponse;
  const { error: sessionError } = await supabase.auth.setSession(payload.session);

  if (sessionError != null) {
    throw sessionError;
  }

  return payload;
}

export async function createProfile({
  fullName,
  language,
  role,
}: {
  fullName: string;
  language: string;
  role: ProfileRole;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError != null) {
    throw sessionError;
  }

  if (session?.user.phone == null) {
    throw new Error('Missing authenticated phone number. Please verify your phone again.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      full_name: fullName.trim(),
      id: session.user.id,
      language,
      phone: session.user.phone,
      role,
    })
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Profile;
}
