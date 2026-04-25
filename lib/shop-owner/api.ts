import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';

type Shop = Database['public']['Tables']['shops']['Row'];
type ShopInsert = Database['public']['Tables']['shops']['Insert'];
type ShopUpdate = Database['public']['Tables']['shops']['Update'];
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Barber = Database['public']['Tables']['barbers']['Row'];
type BarberInsert = Database['public']['Tables']['barbers']['Insert'];
type BarberUpdate = Database['public']['Tables']['barbers']['Update'];
type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type ServiceUpdate = Database['public']['Tables']['services']['Update'];
type BarberServiceLink = Database['public']['Tables']['barber_services']['Row'];
type WorkingHour = Database['public']['Tables']['working_hours']['Row'];
type WorkingHourInsert = Database['public']['Tables']['working_hours']['Insert'];
type WorkingHourUpdate = Database['public']['Tables']['working_hours']['Update'];
type BarberUnavailableDate = Database['public']['Tables']['barber_unavailable_dates']['Row'];
type BarberUnavailableDateInsert = Database['public']['Tables']['barber_unavailable_dates']['Insert'];
type BarberUnavailableDateUpdate = Database['public']['Tables']['barber_unavailable_dates']['Update'];
type ShopClosure = Database['public']['Tables']['shop_closures']['Row'];
type ShopClosureInsert = Database['public']['Tables']['shop_closures']['Insert'];
type ShopClosureUpdate = Database['public']['Tables']['shop_closures']['Update'];
export type AppointmentStatusUpdate = 'cancelled' | 'completed' | 'confirmed';

export type ShopAppointment = Pick<
  Database['public']['Tables']['appointments']['Row'],
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
  barber: Pick<Barber, 'id' | 'name'> | null;
  customer: Pick<Profile, 'full_name' | 'id'> | null;
};

const DEFAULT_SHOP_MEDIA_BUCKET = 'shop-media';

function getShopMediaBucket() {
  return process.env.EXPO_PUBLIC_SUPABASE_SHOP_MEDIA_BUCKET ?? DEFAULT_SHOP_MEDIA_BUCKET;
}

function getFileExtensionFromMimeType(mimeType: string | null | undefined) {
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return 'heic';
  }

  return null;
}

function getFileExtension(fileUri: string, mimeType?: string | null) {
  const extensionFromMimeType = getFileExtensionFromMimeType(mimeType);

  if (extensionFromMimeType != null) {
    return extensionFromMimeType;
  }

  const parsedUri = fileUri.split('?')[0];
  const extension = parsedUri.split('.').pop()?.toLowerCase();

  if (extension == null || extension.length === 0) {
    return 'jpg';
  }

  return extension;
}

function getContentType(fileUri: string, mimeType?: string | null) {
  if (mimeType != null && mimeType.length > 0) {
    return mimeType;
  }

  const extension = getFileExtension(fileUri, mimeType);

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'heic') {
    return 'image/heic';
  }

  return 'image/jpeg';
}

function decodeBase64ToArrayBuffer(base64Data: string) {
  const normalizedBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

  if (typeof globalThis.atob !== 'function') {
    throw new Error('Base64 decoding is not available on this device.');
  }

  const decoded = globalThis.atob(normalizedBase64);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  if (bytes.byteLength === 0) {
    throw new Error('Selected image file is empty. Please choose another image.');
  }

  return bytes.buffer;
}

export async function fetchShopByOwnerId(ownerId: string) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data satisfies Shop | null;
}

export async function createShop(payload: ShopInsert) {
  const { data, error } = await supabase.from('shops').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies Shop;
}

export async function updateShop(shopId: string, payload: ShopUpdate) {
  const { data, error } = await supabase
    .from('shops')
    .update(payload)
    .eq('id', shopId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Shop;
}

export async function fetchBarbersByShopId(shopId: string) {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies Barber[];
}

export async function createBarber(payload: BarberInsert) {
  const { data, error } = await supabase.from('barbers').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies Barber;
}

export async function updateBarber(barberId: string, payload: BarberUpdate) {
  const { data, error } = await supabase
    .from('barbers')
    .update(payload)
    .eq('id', barberId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Barber;
}

export async function fetchServicesByShopId(shopId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies Service[];
}

export async function createService(payload: ServiceInsert) {
  const { data, error } = await supabase.from('services').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies Service;
}

export async function updateService(serviceId: string, payload: ServiceUpdate) {
  const { data, error } = await supabase
    .from('services')
    .update(payload)
    .eq('id', serviceId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Service;
}

export async function fetchBarberServiceLinksByShopId(shopId: string) {
  const { data: barbers, error: barbersError } = await supabase
    .from('barbers')
    .select('id')
    .eq('shop_id', shopId);

  if (barbersError != null) {
    throw barbersError;
  }

  if (barbers.length === 0) {
    return [] satisfies BarberServiceLink[];
  }

  const barberIds = barbers.map((barber) => barber.id);
  const { data: links, error: linksError } = await supabase
    .from('barber_services')
    .select('barber_id, service_id')
    .in('barber_id', barberIds);

  if (linksError != null) {
    throw linksError;
  }

  return links satisfies BarberServiceLink[];
}

export async function replaceBarberServiceLinks({
  barberId,
  serviceIds,
}: {
  barberId: string;
  serviceIds: string[];
}) {
  const deduplicatedServiceIds = [...new Set(serviceIds)];
  const { error: deleteError } = await supabase.from('barber_services').delete().eq('barber_id', barberId);

  if (deleteError != null) {
    throw deleteError;
  }

  if (deduplicatedServiceIds.length === 0) {
    return;
  }

  const insertPayload = deduplicatedServiceIds.map((serviceId) => ({
    barber_id: barberId,
    service_id: serviceId,
  }));
  const { error: insertError } = await supabase.from('barber_services').insert(insertPayload);

  if (insertError != null) {
    throw insertError;
  }
}

export async function fetchWorkingHoursByShopId(shopId: string) {
  const { data: barbers, error: barbersError } = await supabase
    .from('barbers')
    .select('id')
    .eq('shop_id', shopId);

  if (barbersError != null) {
    throw barbersError;
  }

  if (barbers.length === 0) {
    return [] satisfies WorkingHour[];
  }

  const barberIds = barbers.map((barber) => barber.id);
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .in('barber_id', barberIds)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies WorkingHour[];
}

export async function createWorkingHour(payload: WorkingHourInsert) {
  const { data, error } = await supabase.from('working_hours').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies WorkingHour;
}

export async function updateWorkingHour(workingHourId: string, payload: WorkingHourUpdate) {
  const { data, error } = await supabase
    .from('working_hours')
    .update(payload)
    .eq('id', workingHourId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies WorkingHour;
}

export async function deleteWorkingHour(workingHourId: string) {
  const { error } = await supabase.from('working_hours').delete().eq('id', workingHourId);

  if (error != null) {
    throw error;
  }
}

export async function fetchBarberUnavailableDatesByShopId(shopId: string) {
  const { data: barbers, error: barbersError } = await supabase
    .from('barbers')
    .select('id')
    .eq('shop_id', shopId);

  if (barbersError != null) {
    throw barbersError;
  }

  if (barbers.length === 0) {
    return [] satisfies BarberUnavailableDate[];
  }

  const barberIds = barbers.map((barber) => barber.id);
  const { data, error } = await supabase
    .from('barber_unavailable_dates')
    .select('*')
    .in('barber_id', barberIds)
    .order('date', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies BarberUnavailableDate[];
}

export async function createBarberUnavailableDate(payload: BarberUnavailableDateInsert) {
  const { data, error } = await supabase
    .from('barber_unavailable_dates')
    .insert(payload)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies BarberUnavailableDate;
}

export async function updateBarberUnavailableDate(
  unavailableDateId: string,
  payload: BarberUnavailableDateUpdate
) {
  const { data, error } = await supabase
    .from('barber_unavailable_dates')
    .update(payload)
    .eq('id', unavailableDateId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies BarberUnavailableDate;
}

export async function deleteBarberUnavailableDate(unavailableDateId: string) {
  const { error } = await supabase.from('barber_unavailable_dates').delete().eq('id', unavailableDateId);

  if (error != null) {
    throw error;
  }
}

export async function fetchShopClosures(shopId: string) {
  const { data, error } = await supabase
    .from('shop_closures')
    .select('*')
    .eq('shop_id', shopId)
    .order('date', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies ShopClosure[];
}

export async function fetchShopAppointmentsByDateRange({
  endDate,
  shopId,
  startDate,
}: {
  endDate: string;
  shopId: string;
  startDate: string;
}) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'appointment_date, appointment_time, barber_id, created_at, customer_id, end_time, id, notes, shop_id, status, updated_at, barber:barbers!appointments_barber_id_fkey(id, name), customer:profiles!appointments_customer_id_fkey(id, full_name)'
    )
    .eq('shop_id', shopId)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error != null) {
    throw error;
  }

  const appointments = (data ?? []).map((item) => {
    const barberRecord = Array.isArray(item.barber) ? (item.barber[0] ?? null) : item.barber;
    const customerRecord = Array.isArray(item.customer) ? (item.customer[0] ?? null) : item.customer;

    return {
      appointment_date: item.appointment_date,
      appointment_time: item.appointment_time,
      barber: barberRecord,
      barber_id: item.barber_id,
      created_at: item.created_at,
      customer: customerRecord,
      customer_id: item.customer_id,
      end_time: item.end_time,
      id: item.id,
      notes: item.notes,
      shop_id: item.shop_id,
      status: item.status,
      updated_at: item.updated_at,
    } satisfies ShopAppointment;
  });

  return appointments;
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatusUpdate) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies Appointment;
}

export async function createShopClosure(payload: ShopClosureInsert) {
  const { data, error } = await supabase.from('shop_closures').insert(payload).select('*').single();

  if (error != null) {
    throw error;
  }

  return data satisfies ShopClosure;
}

export async function updateShopClosure(shopClosureId: string, payload: ShopClosureUpdate) {
  const { data, error } = await supabase
    .from('shop_closures')
    .update(payload)
    .eq('id', shopClosureId)
    .select('*')
    .single();

  if (error != null) {
    throw error;
  }

  return data satisfies ShopClosure;
}

export async function deleteShopClosure(shopClosureId: string) {
  const { error } = await supabase.from('shop_closures').delete().eq('id', shopClosureId);

  if (error != null) {
    throw error;
  }
}

export async function uploadShopCoverImage({
  base64Data,
  fileUri,
  mimeType,
  ownerId,
  shopId,
}: {
  base64Data: string;
  fileUri: string;
  mimeType?: string | null;
  ownerId: string;
  shopId: string;
}) {
  const mediaBucket = getShopMediaBucket();
  const contentType = getContentType(fileUri, mimeType);
  const fileExtension = getFileExtension(fileUri, mimeType);
  const filePath = `${ownerId}/${shopId}/cover-${Date.now()}.${fileExtension}`;
  const fileBuffer = decodeBase64ToArrayBuffer(base64Data);
  const { error } = await supabase.storage.from(mediaBucket).upload(filePath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error != null) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(mediaBucket).getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadBarberAvatarImage({
  base64Data,
  barberId,
  fileUri,
  mimeType,
  ownerId,
  shopId,
}: {
  base64Data: string;
  barberId: string;
  fileUri: string;
  mimeType?: string | null;
  ownerId: string;
  shopId: string;
}) {
  const mediaBucket = getShopMediaBucket();
  const contentType = getContentType(fileUri, mimeType);
  const fileExtension = getFileExtension(fileUri, mimeType);
  const filePath = `${ownerId}/${shopId}/barbers/${barberId}/avatar-${Date.now()}.${fileExtension}`;
  const fileBuffer = decodeBase64ToArrayBuffer(base64Data);
  const { error } = await supabase.storage.from(mediaBucket).upload(filePath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error != null) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(mediaBucket).getPublicUrl(filePath);

  return publicUrl;
}
