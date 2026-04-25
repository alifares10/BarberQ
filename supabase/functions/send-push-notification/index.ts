// @ts-nocheck

import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { sendPushToUser } from '../_shared/expo-push.ts';
import { createAdminClient } from '../_shared/supabase.ts';

type PushRequestBody = {
  body?: unknown;
  data?: unknown;
  title?: unknown;
  user_id?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function readRequiredString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function parsePayload(payload: PushRequestBody) {
  const userId = readRequiredString(payload.user_id);
  const title = readRequiredString(payload.title);
  const body = readRequiredString(payload.body);

  if (userId == null || title == null || body == null) {
    return {
      error: 'user_id, title, and body are required.',
    };
  }

  if (payload.data != null && !isRecord(payload.data)) {
    return {
      error: 'data must be an object when provided.',
    };
  }

  return {
    body,
    data: payload.data as Record<string, unknown> | undefined,
    title,
    userId,
  };
}

async function readRequestPayload(request: Request) {
  try {
    const payload = await request.json();

    return isRecord(payload) ? (payload as PushRequestBody) : null;
  } catch {
    return null;
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
    const requestPayload = await readRequestPayload(request);

    if (requestPayload == null) {
      return jsonResponse({ error: 'Request body must be a JSON object.' }, 400);
    }

    const payload = parsePayload(requestPayload);

    if ('error' in payload) {
      return jsonResponse({ error: payload.error }, 400);
    }

    const adminClient = createAdminClient();
    const result = await sendPushToUser({
      adminClient,
      body: payload.body,
      data: payload.data,
      title: payload.title,
      userId: payload.userId,
    });

    return jsonResponse({
      removed: result.removed,
      sent: result.sent,
    });
  } catch (error) {
    console.error('send-push-notification failed', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to send the push notification.',
      },
      500
    );
  }
});
