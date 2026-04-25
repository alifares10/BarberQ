alter table public.appointments
  add column if not exists reminder_sent_at timestamptz;

create index if not exists idx_appointments_due_reminders
  on public.appointments (appointment_date, appointment_time)
  where status = 'confirmed'
    and reminder_sent_at is null;

create or replace function public.claim_due_appointment_reminders()
returns table (
  appointment_id uuid,
  appointment_date date,
  appointment_time time,
  customer_id uuid,
  customer_name text,
  shop_id uuid,
  shop_name text,
  shop_owner_id uuid
)
language sql
security definer
set search_path = public
as $$
  with due_appointments as (
    select a.id
    from public.appointments as a
    where a.status = 'confirmed'
      and a.reminder_sent_at is null
      and timezone(
        'Asia/Jerusalem',
        (a.appointment_date + a.appointment_time) at time zone 'Asia/Jerusalem'
      ) between timezone('Asia/Jerusalem', now() + interval '55 minutes')
        and timezone('Asia/Jerusalem', now() + interval '65 minutes')
    order by a.appointment_date, a.appointment_time
    for update skip locked
  ),
  claimed_appointments as (
    update public.appointments as a
    set reminder_sent_at = now()
    from due_appointments as due
    where a.id = due.id
    returning
      a.id,
      a.appointment_date,
      a.appointment_time,
      a.customer_id,
      a.shop_id
  )
  select
    claimed.id as appointment_id,
    claimed.appointment_date,
    claimed.appointment_time,
    claimed.customer_id,
    customer.full_name as customer_name,
    claimed.shop_id,
    shop.name as shop_name,
    shop.owner_id as shop_owner_id
  from claimed_appointments as claimed
  join public.profiles as customer
    on customer.id = claimed.customer_id
  join public.shops as shop
    on shop.id = claimed.shop_id;
$$;

create or replace function public.invoke_appointment_reminders()
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  functions_base_url text;
  reminder_worker_secret text;
  request_id bigint;
begin
  functions_base_url := current_setting('app.settings.functions_base_url', true);
  reminder_worker_secret := current_setting('app.settings.reminder_worker_secret', true);

  if functions_base_url is null or btrim(functions_base_url) = '' then
    raise exception 'Missing database setting app.settings.functions_base_url.';
  end if;

  if reminder_worker_secret is null or btrim(reminder_worker_secret) = '' then
    raise exception 'Missing database setting app.settings.reminder_worker_secret.';
  end if;

  select net.http_post(
    url := rtrim(functions_base_url, '/') || '/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'x-reminder-secret',
      reminder_worker_secret
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 10000
  )
  into request_id;

  return request_id;
end;
$$;

do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname = 'appointment-reminders'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'appointment-reminders',
  '*/5 * * * *',
  $$ select public.invoke_appointment_reminders(); $$
);
