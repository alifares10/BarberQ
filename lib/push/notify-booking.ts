import i18n from '@/lib/i18n';
import { normalizeTime } from '@/lib/shop-owner/appointments-helpers';
import { supabase } from '@/lib/supabase';

type CancellationActor = 'customer' | 'shop';
type AppointmentNotificationType = 'booking_cancelled' | 'booking_confirmed' | 'new_booking';

type AppointmentNotificationContext = {
  appointment_date: string;
  appointment_time: string;
  customer: {
    full_name: string | null;
    id: string;
  } | null;
  customer_id: string;
  id: string;
  shop: {
    id: string;
    name: string;
    owner_id: string;
  } | null;
  shop_id: string;
};

type AppointmentNotificationRaw = Omit<AppointmentNotificationContext, 'customer' | 'shop'> & {
  customer:
    | {
        full_name: string | null;
        id: string;
      }
    | {
        full_name: string | null;
        id: string;
      }[]
    | null;
  shop:
    | {
        id: string;
        name: string;
        owner_id: string;
      }
    | {
        id: string;
        name: string;
        owner_id: string;
      }[]
    | null;
};

function unwrapRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatAppointmentDate(dateValue: string) {
  return new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
}

async function fetchNotificationContext(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'appointment_date, appointment_time, customer_id, id, shop_id, customer:profiles!appointments_customer_id_fkey(id, full_name), shop:shops!appointments_shop_id_fkey(id, name, owner_id)'
    )
    .eq('id', appointmentId)
    .single();

  if (error != null) {
    throw error;
  }

  const appointment = data as AppointmentNotificationRaw;

  return {
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    customer: unwrapRelation(appointment.customer),
    customer_id: appointment.customer_id,
    id: appointment.id,
    shop: unwrapRelation(appointment.shop),
    shop_id: appointment.shop_id,
  } satisfies AppointmentNotificationContext;
}

async function invokePushNotification({
  appointmentId,
  body,
  title,
  type,
  userId,
  by,
}: {
  appointmentId: string;
  body: string;
  by?: CancellationActor;
  title: string;
  type: AppointmentNotificationType;
  userId: string;
}) {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      body,
      data: {
        appointmentId,
        by,
        type,
      },
      title,
      user_id: userId,
    },
  });

  if (error != null) {
    throw error;
  }
}

async function notifyBookingEvent(
  appointmentId: string,
  buildNotification: (context: AppointmentNotificationContext) => Promise<void>
) {
  try {
    const context = await fetchNotificationContext(appointmentId);

    await buildNotification(context);
  } catch (error) {
    console.error('Failed to send booking notification', error);
  }
}

export async function notifyNewBooking(appointmentId: string) {
  await notifyBookingEvent(appointmentId, async (context) => {
    if (context.shop?.owner_id == null) {
      return;
    }

    const customerName = context.customer?.full_name ?? i18n.t('notifications.unknownCustomer');
    const date = formatAppointmentDate(context.appointment_date);
    const time = normalizeTime(context.appointment_time);

    await invokePushNotification({
      appointmentId,
      body: i18n.t('notifications.new_booking_body', {
        customerName,
        date,
        time,
      }),
      title: i18n.t('notifications.new_booking_title'),
      type: 'new_booking',
      userId: context.shop.owner_id,
    });
  });
}

export async function notifyBookingConfirmed(appointmentId: string) {
  await notifyBookingEvent(appointmentId, async (context) => {
    const date = formatAppointmentDate(context.appointment_date);
    const time = normalizeTime(context.appointment_time);

    await invokePushNotification({
      appointmentId,
      body: i18n.t('notifications.booking_confirmed_body', {
        date,
        shopName: context.shop?.name ?? i18n.t('notifications.unknownShop'),
        time,
      }),
      title: i18n.t('notifications.booking_confirmed_title'),
      type: 'booking_confirmed',
      userId: context.customer_id,
    });
  });
}

export async function notifyBookingCancelled(appointmentId: string, by: CancellationActor) {
  await notifyBookingEvent(appointmentId, async (context) => {
    const date = formatAppointmentDate(context.appointment_date);
    const time = normalizeTime(context.appointment_time);
    const customerName = context.customer?.full_name ?? i18n.t('notifications.unknownCustomer');
    const shopName = context.shop?.name ?? i18n.t('notifications.unknownShop');
    const recipientId = by === 'customer' ? context.shop?.owner_id : context.customer_id;

    if (recipientId == null) {
      return;
    }

    await invokePushNotification({
      appointmentId,
      body:
        by === 'customer'
          ? i18n.t('notifications.booking_cancelled_by_customer_body', {
              customerName,
              date,
              time,
            })
          : i18n.t('notifications.booking_cancelled_by_shop_body', {
              date,
              shopName,
              time,
            }),
      by,
      title:
        by === 'customer'
          ? i18n.t('notifications.booking_cancelled_by_customer_title')
          : i18n.t('notifications.booking_cancelled_by_shop_title'),
      type: 'booking_cancelled',
      userId: recipientId,
    });
  });
}
