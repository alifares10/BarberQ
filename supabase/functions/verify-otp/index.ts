// @ts-nocheck

import type { User } from 'https://esm.sh/@supabase/supabase-js@2.102.1';

import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { normalizePhoneNumber } from '../_shared/phone.ts';
import { createAdminClient, createPublicClient } from '../_shared/supabase.ts';

const OTP_PATTERN = /^\d{6}$/;

async function findUserByPhone(phone: string) {
  const adminClient = createAdminClient();
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error != null) {
      throw error;
    }

    const matchingUser = data.users.find(
      (user) => user.phone === phone || user.phone === phone.replace('+', '')
    );

    if (matchingUser != null) {
      return matchingUser;
    }

    if (data.nextPage == null || data.users.length === 0) {
      return null;
    }

    page = data.nextPage;
  }
}

function createTemporaryPassword() {
  return crypto.randomUUID().replaceAll('-', '');
}

async function upsertUser(phone: string, password: string) {
  const adminClient = createAdminClient();
  const existingUser = await findUserByPhone(phone);

  if (existingUser == null) {
    const { data, error } = await adminClient.auth.admin.createUser({
      password,
      phone,
      phone_confirm: true,
      user_metadata: { phone },
    });

    if (error != null) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
    password,
    phone_confirm: true,
    user_metadata: {
      ...existingUser.user_metadata,
      phone,
    },
  });

  if (error != null) {
    throw error;
  }

  return data.user;
}

async function signInWithPassword(phone: string, password: string) {
  const publicClient = createPublicClient();
  const { data, error } = await publicClient.auth.signInWithPassword({
    password,
    phone,
  });

  if (error != null) {
    throw error;
  }

  if (data.session == null || data.user == null) {
    throw new Error('Supabase did not return a valid session.');
  }

  return data;
}

async function fetchProfileForUser(user: User) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (error != null && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const { code, phone: rawPhone } = (await request.json()) as { code?: string; phone?: string };
    const normalizedPhone = normalizePhoneNumber(rawPhone ?? '');

    if (normalizedPhone == null) {
      return jsonResponse({ error: 'Please enter a valid phone number.' }, 400);
    }

    if (!OTP_PATTERN.test(code ?? '')) {
      return jsonResponse({ error: 'Please enter the 6-digit verification code.' }, 400);
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: latestOtp, error: latestOtpError } = await adminClient
      .from('otp_codes')
      .select('code, id')
      .eq('phone', normalizedPhone)
      .eq('verified', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOtpError != null) {
      throw latestOtpError;
    }

    if (latestOtp == null || latestOtp.code !== code) {
      return jsonResponse({ error: 'The verification code is invalid or expired.' }, 400);
    }

    const { data: claimedOtp, error: claimError } = await adminClient
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', latestOtp.id)
      .eq('verified', false)
      .select('id')
      .maybeSingle();

    if (claimError != null) {
      throw claimError;
    }

    if (claimedOtp == null) {
      return jsonResponse({ error: 'The verification code is invalid or expired.' }, 400);
    }

    const password = createTemporaryPassword();
    const user = await upsertUser(normalizedPhone, password);

    let authResult;
    try {
      authResult = await signInWithPassword(normalizedPhone, password);
    } catch (signInError) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(user.id);
      throw signInError;
    }

    const profile = await fetchProfileForUser(authResult.user);

    return jsonResponse({
      needsOnboarding: profile == null,
      session: {
        access_token: authResult.session.access_token,
        refresh_token: authResult.session.refresh_token,
      },
    });
  } catch (error) {
    console.error('verify-otp failed', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to verify the code.',
      },
      500
    );
  }
});
