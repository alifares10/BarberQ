create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint otp_codes_phone_not_blank check (btrim(phone) <> ''),
  constraint otp_codes_code_format_check check (code ~ '^[0-9]{6}$')
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  created_at timestamptz not null default now(),
  constraint push_tokens_expo_push_token_not_blank check (btrim(expo_push_token) <> '')
);
