alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.barber_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.barber_unavailable_dates enable row level security;
alter table public.shop_closures enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.otp_codes enable row level security;
alter table public.push_tokens enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "shops_select_active"
on public.shops
for select
to authenticated
using (is_active = true);

create policy "shops_select_own"
on public.shops
for select
to authenticated
using (owner_id = auth.uid());

create policy "shops_insert_own"
on public.shops
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "shops_update_own"
on public.shops
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "shops_delete_own"
on public.shops
for delete
to authenticated
using (owner_id = auth.uid());

create policy "barbers_select_active"
on public.barbers
for select
to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.is_active = true
  )
);

create policy "barbers_select_own"
on public.barbers
for select
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "barbers_insert_own"
on public.barbers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "barbers_update_own"
on public.barbers
for update
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "barbers_delete_own"
on public.barbers
for delete
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "services_select_active"
on public.services
for select
to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.is_active = true
  )
);

create policy "services_select_own"
on public.services
for select
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "services_insert_own"
on public.services
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "services_update_own"
on public.services
for update
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "services_delete_own"
on public.services
for delete
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_services_select_all"
on public.barber_services
for select
to authenticated
using (true);

create policy "barber_services_insert_own"
on public.barber_services
for insert
to authenticated
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.services as sv
    join public.shops as s on s.id = sv.shop_id
    where sv.id = service_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_services_update_own"
on public.barber_services
for update
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.services as sv
    join public.shops as s on s.id = sv.shop_id
    where sv.id = service_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_services_delete_own"
on public.barber_services
for delete
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "working_hours_select_all"
on public.working_hours
for select
to authenticated
using (true);

create policy "working_hours_insert_own"
on public.working_hours
for insert
to authenticated
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "working_hours_update_own"
on public.working_hours
for update
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "working_hours_delete_own"
on public.working_hours
for delete
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_unavailable_dates_select_all"
on public.barber_unavailable_dates
for select
to authenticated
using (true);

create policy "barber_unavailable_dates_insert_own"
on public.barber_unavailable_dates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_unavailable_dates_update_own"
on public.barber_unavailable_dates
for update
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "barber_unavailable_dates_delete_own"
on public.barber_unavailable_dates
for delete
to authenticated
using (
  exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.owner_id = auth.uid()
  )
);

create policy "shop_closures_select_all"
on public.shop_closures
for select
to authenticated
using (true);

create policy "shop_closures_insert_own"
on public.shop_closures
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "shop_closures_update_own"
on public.shop_closures
for update
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "shop_closures_delete_own"
on public.shop_closures
for delete
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "appointments_select_own_customer"
on public.appointments
for select
to authenticated
using (customer_id = auth.uid());

create policy "appointments_select_own_shop_owner"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "appointments_insert_own_customer"
on public.appointments
for insert
to authenticated
with check (
  customer_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.barbers as b
    join public.shops as s on s.id = b.shop_id
    where b.id = barber_id
      and s.id = shop_id
      and b.is_active = true
      and s.is_active = true
  )
);

create policy "appointments_update_cancel_own_customer"
on public.appointments
for update
to authenticated
using (customer_id = auth.uid())
with check (
  customer_id = auth.uid()
  and status = 'cancelled'
);

create policy "appointments_update_own_shop_owner"
on public.appointments
for update
to authenticated
using (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops as s
    where s.id = shop_id
      and s.owner_id = auth.uid()
  )
);

create policy "appointment_services_select_own_customer"
on public.appointment_services
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments as a
    where a.id = appointment_id
      and a.customer_id = auth.uid()
  )
);

create policy "appointment_services_select_own_shop_owner"
on public.appointment_services
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments as a
    join public.shops as s on s.id = a.shop_id
    where a.id = appointment_id
      and s.owner_id = auth.uid()
  )
);

create policy "appointment_services_insert_own_customer"
on public.appointment_services
for insert
to authenticated
with check (
  exists (
    select 1
    from public.appointments as a
    where a.id = appointment_id
      and a.customer_id = auth.uid()
  )
);

create policy "push_tokens_select_own"
on public.push_tokens
for select
to authenticated
using (user_id = auth.uid());

create policy "push_tokens_insert_own"
on public.push_tokens
for insert
to authenticated
with check (user_id = auth.uid());

create policy "push_tokens_delete_own"
on public.push_tokens
for delete
to authenticated
using (user_id = auth.uid());
