create index if not exists idx_shops_active
  on public.shops (is_active)
  where is_active = true;

create index if not exists idx_shops_location
  on public.shops (latitude, longitude)
  where is_active = true;

create index if not exists idx_barbers_shop
  on public.barbers (shop_id)
  where is_active = true;

create index if not exists idx_services_shop
  on public.services (shop_id)
  where is_active = true;

create index if not exists idx_barber_services_barber
  on public.barber_services (barber_id);

create index if not exists idx_barber_services_service
  on public.barber_services (service_id);

create index if not exists idx_working_hours_barber_day
  on public.working_hours (barber_id, day_of_week);

create index if not exists idx_appointments_barber_date
  on public.appointments (barber_id, appointment_date)
  where status <> 'cancelled';

create index if not exists idx_appointments_customer
  on public.appointments (customer_id, appointment_date desc);

create index if not exists idx_appointments_shop_date
  on public.appointments (shop_id, appointment_date)
  where status <> 'cancelled';

create unique index if not exists idx_barber_unavailable
  on public.barber_unavailable_dates (barber_id, date);

create unique index if not exists idx_shop_closures
  on public.shop_closures (shop_id, date);

create index if not exists idx_appointment_services_appointment
  on public.appointment_services (appointment_id);

create index if not exists idx_appointment_services_service
  on public.appointment_services (service_id);

create index if not exists idx_otp_phone
  on public.otp_codes (phone);

create index if not exists idx_push_tokens_user
  on public.push_tokens (user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'no_overlapping_bookings'
  ) then
    alter table public.appointments
      add constraint no_overlapping_bookings
      exclude using gist (
        barber_id with =,
        appointment_date with =,
        tsrange(
          appointment_date + appointment_time,
          appointment_date + end_time,
          '[)'
        ) with &&
      )
      where (status <> 'cancelled');
  end if;
end;
$$;
