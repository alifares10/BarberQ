// @ts-nocheck

import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { maskPhoneNumber, normalizePhoneNumber, toSms4FreeRecipient } from '../_shared/phone.ts';
import { createAdminClient, getRequiredSecret } from '../_shared/supabase.ts';

const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

function createOtpCode() {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;

  return randomValue.toString().padStart(6, '0');
}

function getSms4FreeConfig() {
  return {
    apiKey: getRequiredSecret('SMS4FREE_API_KEY'),
    password: getRequiredSecret('SMS4FREE_PASS'),
    sendUrl: getRequiredSecret('SMS4FREE_SEND_URL'),
    sender: getRequiredSecret('SMS4FREE_SENDER'),
    user: getRequiredSecret('SMS4FREE_USER'),
  };
}

function parseProviderPayload(rawPayload: string) {
  try {
    return JSON.parse(rawPayload) as unknown;
  } catch {
    return rawPayload;
  }
}

function readProviderStatus(payload: unknown) {
  if (typeof payload === 'number') {
    return payload;
  }

  if (typeof payload === 'string') {
    const parsedNumber = Number(payload);

    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  }

  if (typeof payload === 'object' && payload != null) {
    const status = Reflect.get(payload, 'status');

    return typeof status === 'number' ? status : null;
  }

  return null;
}

function readProviderMessage(payload: unknown) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload === 'object' && payload != null) {
    const message = Reflect.get(payload, 'message');

    return typeof message === 'string' ? message : null;
  }

  return null;
}

async function sendSms(phone: string, otpCode: string) {
  const config = getSms4FreeConfig();
  const response = await fetch(config.sendUrl, {
    body: JSON.stringify({
      key: config.apiKey,
      msg: `BarberQ verification code: ${otpCode}`,
      pass: config.password,
      recipient: toSms4FreeRecipient(phone),
      sender: config.sender,
      user: config.user,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const rawPayload = await response.text();
  const parsedPayload = parseProviderPayload(rawPayload);
  const status = readProviderStatus(parsedPayload);

  if (!response.ok) {
    throw new Error(`SMS4Free request failed with status ${response.status}.`);
  }

  if (status != null && status <= 0) {
    throw new Error(readProviderMessage(parsedPayload) ?? 'SMS4Free rejected the verification message.');
  }

  if (status == null && readProviderMessage(parsedPayload) == null) {
    throw new Error('SMS4Free returned an unexpected response.');
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const { phone: rawPhone } = (await request.json()) as { phone?: string };
    const normalizedPhone = normalizePhoneNumber(rawPhone ?? '');

    if (normalizedPhone == null) {
      return jsonResponse({ error: 'Please enter a valid phone number.' }, 400);
    }

    const adminClient = createAdminClient();
    const now = Date.now();
    const { data: latestOtp, error: latestOtpError } = await adminClient
      .from('otp_codes')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOtpError != null) {
      throw latestOtpError;
    }

    if (latestOtp != null) {
      const retryAfterSeconds = Math.ceil(
        (new Date(latestOtp.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000
      );

      if (retryAfterSeconds > 0) {
        return jsonResponse(
          {
            error: 'Please wait before requesting another verification code.',
            retryAfterSeconds,
          },
          429
        );
      }
    }

    const { error: invalidateError } = await adminClient
      .from('otp_codes')
      .update({ verified: true })
      .eq('phone', normalizedPhone)
      .eq('verified', false);

    if (invalidateError != null) {
      throw invalidateError;
    }

    const otpCode = createOtpCode();
    const expiresAt = new Date(now + OTP_EXPIRY_SECONDS * 1000).toISOString();
    const { data: insertedOtp, error: insertError } = await adminClient
      .from('otp_codes')
      .insert({
        code: otpCode,
        expires_at: expiresAt,
        phone: normalizedPhone,
      })
      .select('id')
      .single();

    if (insertError != null) {
      throw insertError;
    }

    const skipSms = Deno.env.get('SKIP_SMS') === 'true';

    if (skipSms) {
      console.log(`[DEV] OTP code for ${normalizedPhone}: ${otpCode}`);
    } else {
      try {
        await sendSms(normalizedPhone, otpCode);
      } catch (error) {
        await adminClient.from('otp_codes').delete().eq('id', insertedOtp.id);
        throw error;
      }
    }

    return jsonResponse({
      expiresInSeconds: OTP_EXPIRY_SECONDS,
      maskedPhone: maskPhoneNumber(normalizedPhone),
      retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('send-otp failed', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to send the verification code.',
      },
      500
    );
  }
});
