create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text not null,
  avatar_url text,
  role text not null,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_not_blank check (btrim(phone) <> ''),
  constraint profiles_full_name_not_blank check (btrim(full_name) <> ''),
  constraint profiles_role_check check (role in ('customer', 'shop_owner')),
  constraint profiles_language_check check (language in ('en', 'he'))
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  description text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null,
  cover_image_url text,
  is_active boolean not null default true,
  buffer_minutes integer not null default 0,
  cancellation_window_hours integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_name_not_blank check (btrim(name) <> ''),
  constraint shops_address_not_blank check (btrim(address) <> ''),
  constraint shops_phone_not_blank check (btrim(phone) <> ''),
  constraint shops_latitude_check check (latitude between -90 and 90),
  constraint shops_longitude_check check (longitude between -180 and 180),
  constraint shops_buffer_minutes_check check (buffer_minutes >= 0),
  constraint shops_cancellation_window_hours_check check (
    cancellation_window_hours is null or cancellation_window_hours >= 0
  )
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_shops_updated_at on public.shops;
create trigger set_shops_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();
