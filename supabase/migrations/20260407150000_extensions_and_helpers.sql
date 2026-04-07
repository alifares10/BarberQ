create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "btree_gist" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_barber_service_shop_match()
returns trigger
language plpgsql
as $$
declare
  barber_shop_id uuid;
  service_shop_id uuid;
begin
  select b.shop_id
    into barber_shop_id
  from public.barbers as b
  where b.id = new.barber_id;

  select s.shop_id
    into service_shop_id
  from public.services as s
  where s.id = new.service_id;

  if barber_shop_id is null or service_shop_id is null then
    raise exception 'Barber and service must both exist before linking them.';
  end if;

  if barber_shop_id <> service_shop_id then
    raise exception 'Barber and service must belong to the same shop.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_appointment_barber_shop_match()
returns trigger
language plpgsql
as $$
declare
  barber_shop_id uuid;
begin
  select b.shop_id
    into barber_shop_id
  from public.barbers as b
  where b.id = new.barber_id;

  if barber_shop_id is null then
    raise exception 'Appointments must reference an existing barber.';
  end if;

  if barber_shop_id <> new.shop_id then
    raise exception 'Appointment barber must belong to the selected shop.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_appointment_service_shop_match()
returns trigger
language plpgsql
as $$
declare
  appointment_shop_id uuid;
  service_shop_id uuid;
begin
  select a.shop_id
    into appointment_shop_id
  from public.appointments as a
  where a.id = new.appointment_id;

  select s.shop_id
    into service_shop_id
  from public.services as s
  where s.id = new.service_id;

  if appointment_shop_id is null or service_shop_id is null then
    raise exception 'Appointment and service must both exist before linking them.';
  end if;

  if appointment_shop_id <> service_shop_id then
    raise exception 'Appointment services must belong to the same shop as the appointment.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_appointment_status_updates()
returns trigger
language plpgsql
as $$
declare
  owns_shop boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  select exists(
    select 1
    from public.shops as s
    where s.id = old.shop_id
      and s.owner_id = auth.uid()
  )
  into owns_shop;

  if owns_shop then
    if row(
      new.customer_id,
      new.barber_id,
      new.shop_id,
      new.appointment_date,
      new.appointment_time,
      new.end_time,
      new.notes,
      new.created_at
    ) is distinct from row(
      old.customer_id,
      old.barber_id,
      old.shop_id,
      old.appointment_date,
      old.appointment_time,
      old.end_time,
      old.notes,
      old.created_at
    ) then
      raise exception 'Shop owners can only update appointment status.';
    end if;

    return new;
  end if;

  if old.customer_id = auth.uid() then
    if new.status <> 'cancelled' then
      raise exception 'Customers can only cancel appointments.';
    end if;

    if row(
      new.customer_id,
      new.barber_id,
      new.shop_id,
      new.appointment_date,
      new.appointment_time,
      new.end_time,
      new.notes,
      new.created_at
    ) is distinct from row(
      old.customer_id,
      old.barber_id,
      old.shop_id,
      old.appointment_date,
      old.appointment_time,
      old.end_time,
      old.notes,
      old.created_at
    ) then
      raise exception 'Customers can only update appointment status.';
    end if;

    return new;
  end if;

  raise exception 'You do not have permission to update this appointment.';
end;
$$;
