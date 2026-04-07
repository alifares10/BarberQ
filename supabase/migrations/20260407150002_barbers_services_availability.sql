create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id),
  name text not null,
  avatar_url text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barbers_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id),
  name text not null,
  description text,
  duration integer not null,
  price numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_not_blank check (btrim(name) <> ''),
  constraint services_duration_check check (duration > 0),
  constraint services_price_check check (price >= 0)
);

create table if not exists public.barber_services (
  barber_id uuid not null references public.barbers (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (barber_id, service_id)
);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  constraint working_hours_day_of_week_check check (day_of_week between 0 and 6),
  constraint working_hours_time_range_check check (start_time < end_time)
);

create table if not exists public.barber_unavailable_dates (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_closures (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz not null default now()
);

drop trigger if exists set_barbers_updated_at on public.barbers;
create trigger set_barbers_updated_at
before update on public.barbers
for each row
execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

drop trigger if exists validate_barber_service_shop_match on public.barber_services;
create trigger validate_barber_service_shop_match
before insert or update on public.barber_services
for each row
execute function public.validate_barber_service_shop_match();
