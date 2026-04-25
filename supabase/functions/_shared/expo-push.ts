// @ts-nocheck

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

type SendPushToUserParams = {
  adminClient: ReturnType<typeof import('./supabase.ts').createAdminClient>;
  body: string;
  data?: Record<string, unknown>;
  title: string;
  userId: string;
};

export type PushDeliveryResult = {
  failed: number;
  removed: number;
  sent: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function sendExpoPushBatch(messages: Record<string, unknown>[]) {
  const response = await fetch(EXPO_PUSH_API_URL, {
    body: JSON.stringify(messages),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Expo Push API request failed with status ${response.status}.`);
  }

  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error('Expo Push API returned an unexpected response.');
  }

  return payload.data as Record<string, unknown>[];
}

function isDeviceNotRegisteredTicket(ticket: Record<string, unknown>) {
  const details = ticket.details;

  return isRecord(details) && details.error === 'DeviceNotRegistered';
}

export async function sendPushToUser({
  adminClient,
  body,
  data,
  title,
  userId,
}: SendPushToUserParams): Promise<PushDeliveryResult> {
  const { data: pushTokens, error: tokensError } = await adminClient
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId);

  if (tokensError != null) {
    throw tokensError;
  }

  if (pushTokens == null || pushTokens.length === 0) {
    return { failed: 0, removed: 0, sent: 0 };
  }

  let failed = 0;
  let sent = 0;
  const staleTokens = new Set<string>();
  const tokenValues = pushTokens.map((pushToken) => pushToken.expo_push_token);

  for (const tokenBatch of chunkArray(tokenValues, EXPO_BATCH_SIZE)) {
    const messages = tokenBatch.map((expoPushToken) => ({
      body,
      data,
      sound: 'default',
      title,
      to: expoPushToken,
    }));
    const tickets = await sendExpoPushBatch(messages);

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        sent += 1;
        return;
      }

      failed += 1;
      console.error('Expo push ticket failed', ticket);

      if (isDeviceNotRegisteredTicket(ticket)) {
        staleTokens.add(tokenBatch[index]);
      }
    });
  }

  if (staleTokens.size > 0) {
    const { error: deleteError } = await adminClient
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .in('expo_push_token', Array.from(staleTokens));

    if (deleteError != null) {
      throw deleteError;
    }
  }

  return {
    failed,
    removed: staleTokens.size,
    sent,
  };
}
