create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  barber_id uuid not null references public.barbers (id),
  shop_id uuid not null references public.shops (id),
  appointment_date date not null,
  appointment_time time not null,
  end_time time not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check check (
    status in ('pending', 'confirmed', 'completed', 'cancelled')
  ),
  constraint appointments_time_range_check check (appointment_time < end_time)
);

create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id),
  primary key (appointment_id, service_id)
);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

drop trigger if exists validate_appointment_barber_shop_match on public.appointments;
create trigger validate_appointment_barber_shop_match
before insert or update on public.appointments
for each row
execute function public.validate_appointment_barber_shop_match();

drop trigger if exists enforce_appointment_status_updates on public.appointments;
create trigger enforce_appointment_status_updates
before update on public.appointments
for each row
execute function public.enforce_appointment_status_updates();

drop trigger if exists validate_appointment_service_shop_match on public.appointment_services;
create trigger validate_appointment_service_shop_match
before insert or update on public.appointment_services
for each row
execute function public.validate_appointment_service_shop_match();
