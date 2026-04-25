// @ts-nocheck

import { sendPushToUser } from '../_shared/expo-push.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { createAdminClient, getRequiredSecret } from '../_shared/supabase.ts';

type ReminderLocale = 'en' | 'he';

type DueAppointmentReminder = {
  appointment_date: string;
  appointment_id: string;
  appointment_time: string;
  customer_id: string;
  customer_name: string | null;
  shop_id: string;
  shop_name: string;
  shop_owner_id: string;
};

const REMINDER_TRANSLATIONS = {
  en: {
    customerBody: 'Your appointment at {{shopName}} is in 1 hour ({{date}} at {{time}}).',
    shopOwnerBody: '{{customerName}} has an appointment in 1 hour ({{date}} at {{time}}).',
    title: 'Upcoming appointment',
    unknownCustomer: 'A customer',
    unknownShop: 'your barber shop',
  },
  he: {
    customerBody: 'התור שלכם ב{{shopName}} מתחיל בעוד שעה ({{date}} בשעה {{time}}).',
    shopOwnerBody: 'ל{{customerName}} יש תור בעוד שעה ({{date}} בשעה {{time}}).',
    title: 'תור קרוב',
    unknownCustomer: 'לקוח',
    unknownShop: 'המספרה',
  },
} satisfies Record<ReminderLocale, Record<string, string>>;

function getReminderLocale(): ReminderLocale {
  return Deno.env.get('REMINDER_LOCALE') === 'he' ? 'he' : 'en';
}

function interpolate(template: string, values: Record<string, string>) {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '');
}

function formatAppointmentDate(dateValue: string, locale: ReminderLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00.000Z`));
}

function formatAppointmentTime(timeValue: string) {
  return timeValue.slice(0, 5);
}

function isAuthorized(request: Request) {
  const expectedSecret = getRequiredSecret('REMINDER_WORKER_SECRET');
  const providedSecret = request.headers.get('x-reminder-secret');

  return providedSecret != null && providedSecret === expectedSecret;
}

async function sendReminderToUser({
  adminClient,
  appointmentId,
  body,
  title,
  userId,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  appointmentId: string;
  body: string;
  title: string;
  userId: string;
}) {
  try {
    return await sendPushToUser({
      adminClient,
      body,
      data: {
        appointmentId,
        type: 'appointment_reminder',
      },
      title,
      userId,
    });
  } catch (error) {
    console.error('Failed to send appointment reminder', error);

    return {
      failed: 1,
      removed: 0,
      sent: 0,
    };
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
    if (!isAuthorized(request)) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    const adminClient = createAdminClient();
    const { data: reminders, error: remindersError } = await adminClient.rpc(
      'claim_due_appointment_reminders'
    );

    if (remindersError != null) {
      throw remindersError;
    }

    const claimedReminders = (reminders ?? []) as DueAppointmentReminder[];
    const locale = getReminderLocale();
    const translations = REMINDER_TRANSLATIONS[locale];
    let failed = 0;
    let removed = 0;
    let sent = 0;

    for (const reminder of claimedReminders) {
      const appointmentId = reminder.appointment_id;
      const date = formatAppointmentDate(reminder.appointment_date, locale);
      const time = formatAppointmentTime(reminder.appointment_time);
      const customerName = reminder.customer_name ?? translations.unknownCustomer;
      const shopName = reminder.shop_name ?? translations.unknownShop;
      const title = translations.title;

      const customerResult = await sendReminderToUser({
        adminClient,
        appointmentId,
        body: interpolate(translations.customerBody, {
          date,
          shopName,
          time,
        }),
        title,
        userId: reminder.customer_id,
      });
      const shopOwnerResult = await sendReminderToUser({
        adminClient,
        appointmentId,
        body: interpolate(translations.shopOwnerBody, {
          customerName,
          date,
          time,
        }),
        title,
        userId: reminder.shop_owner_id,
      });

      failed += customerResult.failed + shopOwnerResult.failed;
      removed += customerResult.removed + shopOwnerResult.removed;
      sent += customerResult.sent + shopOwnerResult.sent;
    }

    return jsonResponse({
      claimed: claimedReminders.length,
      failed,
      removed,
      sent,
    });
  } catch (error) {
    console.error('send-appointment-reminders failed', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to send appointment reminders.',
      },
      500
    );
  }
});
