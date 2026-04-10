import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentService = Database['public']['Tables']['appointment_services']['Row'];
type AppointmentServiceInsert = Database['public']['Tables']['appointment_services']['Insert'];
type Barber = Database['public']['Tables']['barbers']['Row'];
type BarberServiceLink = Database['public']['Tables']['barber_services']['Row'];
type BarberUnavailableDate = Database['public']['Tables']['barber_unavailable_dates']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type Shop = Database['public']['Tables']['shops']['Row'];
type ShopClosure = Database['public']['Tables']['shop_closures']['Row'];
type WorkingHour = Database['public']['Tables']['working_hours']['Row'];

type Relation<T> = T | T[] | null;

type CustomerAppointmentService = {
  service: Pick<Service, 'duration' | 'id' | 'name' | 'price'> | null;
  service_id: string;
};

type CustomerAppointmentRaw = Pick<
  Appointment,
  | 'appointment_date'
  | 'appointment_time'
  | 'barber_id'
  | 'created_at'
  | 'customer_id'
  | 'end_time'
  | 'id'
  | 'notes'
  | 'shop_id'
  | 'status'
  | 'updated_at'
> & {
  appointment_services: {
    service: Relation<Pick<Service, 'duration' | 'id' | 'name' | 'price'>>;
    service_id: string;
  }[] | null;
  barber: Relation<Pick<Barber, 'avatar_url' | 'id' | 'name'>>;
  shop: Relation<Pick<Shop, 'address' | 'cancellation_window_hours' | 'cover_image_url' | 'id' | 'name'>>;
};

type CustomerShopRaw = Shop & {
  services: Pick<Service, 'id' | 'is_active' | 'name'>[] | null;
};

export type CustomerShop = Shop & {
  services: Pick<Service, 'id' | 'name'>[];
};

export type CustomerAppointment = Pick<
  Appointment,
  | 'appointment_date'
  | 'appointment_time'
  | 'barber_id'
  | 'created_at'
  | 'customer_id'
  | 'end_time'
  | 'id'
  | 'notes'
  | 'shop_id'
  | 'status'
  | 'updated_at'
> & {
  appointment_services: CustomerAppointmentService[];
  barber: Pick<Barber, 'avatar_url' | 'id' | 'name'> | null;
  shop: Pick<Shop, 'address' | 'cancellation_window_hours' | 'cover_image_url' | 'id' | 'name'> | null;
};

export type BarberBooking = Pick<Appointment, 'appointment_time' | 'end_time'>;

function unwrapRelation<T>(value: Relation<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function fetchActiveShops() {
  const { data, error } = await supabase
    .from('shops')
    .select(
      'address, buffer_minutes, cancellation_window_hours, cover_image_url, created_at, description, id, is_active, latitude, longitude, name, owner_id, phone, updated_at, services(id, name, is_active)'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  const shops = (data ?? []) as CustomerShopRaw[];

  return shops.map((shop) => ({
    ...shop,
    services: (shop.services ?? [])
      .filter((service) => service.is_active)
      .map((service) => ({
        id: service.id,
        name: service.name,
      })),
  })) satisfies CustomerShop[];
}

export async function fetchShopById(shopId: string) {
  const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();

  if (error != null) {
    throw error;
  }

  return data satisfies Shop;
}

export async function fetchActiveBarbersByShopId(shopId: string) {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies Barber[];
}

export async function fetchServicesByBarberId(barberId: string) {
  const { data: links, error: linksError } = await supabase
    .from('barber_services')
    .select('service_id')
    .eq('barber_id', barberId);

  if (linksError != null) {
    throw linksError;
  }

  const serviceIds = links.map((link) => link.service_id);

  if (serviceIds.length === 0) {
    return [] satisfies Service[];
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .in('id', serviceIds)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies Service[];
}

export async function fetchWorkingHoursByBarberAndDay(barberId: string, dayOfWeek: number) {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('barber_id', barberId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies WorkingHour[];
}

export async function fetchShopClosureByDate(shopId: string, date: string) {
  const { data, error } = await supabase
    .from('shop_closures')
    .select('*')
    .eq('shop_id', shopId)
    .eq('date', date)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data satisfies ShopClosure | null;
}

export async function fetchBarberUnavailableByDate(barberId: string, date: string) {
  const { data, error } = await supabase
    .from('barber_unavailable_dates')
    .select('*')
    .eq('barber_id', barberId)
    .eq('date', date)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data satisfies BarberUnavailableDate | null;
}

export async function fetchBarberBookingsByDate(barberId: string, date: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time, end_time')
    .eq('barber_id', barberId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .order('appointment_time', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies BarberBooking[];
}

export async function createAppointment(payload: AppointmentInsert) {
  const { data, error } = await supabase.from('appointments').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies Appointment;
}

export async function createAppointmentServices(appointmentId: string, serviceIds: string[]) {
  const uniqueServiceIds = Array.from(new Set(serviceIds));

  if (uniqueServiceIds.length === 0) {
    return [] satisfies AppointmentService[];
  }

  const payload = uniqueServiceIds.map((serviceId) => ({
    appointment_id: appointmentId,
    service_id: serviceId,
  })) satisfies AppointmentServiceInsert[];

  const { data, error } = await supabase.from('appointment_services').insert(payload).select('*');

  if (error != null) {
    throw error;
  }

  return data satisfies AppointmentService[];
}

export async function fetchCustomerAppointments(customerId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'appointment_date, appointment_time, barber_id, created_at, customer_id, end_time, id, notes, shop_id, status, updated_at, barber:barbers!appointments_barber_id_fkey(id, name, avatar_url), shop:shops!appointments_shop_id_fkey(id, name, address, cover_image_url, cancellation_window_hours), appointment_services(service_id, service:services!appointment_services_service_id_fkey(id, name, duration, price))'
    )
    .eq('customer_id', customerId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (error != null) {
    throw error;
  }

  const appointments = ((data ?? []) as CustomerAppointmentRaw[]).map((appointment) => ({
    appointment_date: appointment.appointment_date,
    appointment_services: (appointment.appointment_services ?? []).map((serviceLink) => ({
      service: unwrapRelation(serviceLink.service),
      service_id: serviceLink.service_id,
    })),
    appointment_time: appointment.appointment_time,
    barber: unwrapRelation(appointment.barber),
    barber_id: appointment.barber_id,
    created_at: appointment.created_at,
    customer_id: appointment.customer_id,
    end_time: appointment.end_time,
    id: appointment.id,
    notes: appointment.notes,
    shop: unwrapRelation(appointment.shop),
    shop_id: appointment.shop_id,
    status: appointment.status,
    updated_at: appointment.updated_at,
  } satisfies CustomerAppointment));

  return appointments;
}

export async function cancelAppointment(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Appointment;
}

export type { AppointmentService, BarberServiceLink, Service, Shop, ShopClosure, WorkingHour };
