# Phase 6: Push Notifications

## Context

Phases 1–5 are complete; the app can authenticate users, manage shops, and book appointments end-to-end. Phase 6 adds Expo push notifications so:

- Shop owners are notified when a customer books a new appointment.
- Customers are notified when their booking is confirmed or cancelled (and shop owners are notified when a customer cancels).
- Both parties receive a 1-hour-before reminder for upcoming confirmed appointments.

The `push_tokens` table, RLS policies, and `expo-notifications` dependency already exist; the wiring is missing. Note: a shop-owner "confirm appointment" UI/API does not yet exist and is required to fire the "booking confirmed" trigger.

---

## Approach

Use the **client-side trigger pattern** that matches the existing `send-otp`/`verify-otp` style: after a TanStack Query mutation succeeds, invoke a single `send-push-notification` Edge Function (admin client). This avoids introducing pg_net for event-driven pushes, keeps secrets in one place (Supabase function config), and stays consistent with how the app already calls Edge Functions today.

For 1-hour reminders, use **pg_cron** to run a SQL function every 5 minutes that finds confirmed appointments starting in ~60 minutes (with a `reminder_sent_at` column to prevent duplicates) and calls the same Edge Function via `pg_net`.

---

## Execution Order

Implement one chunk at a time. **After each chunk:**

1. Run the full check: `npx expo lint && npx tsc --noEmit && npx jest && npx expo export`.
2. Report results to the user (pass/fail summary, any new files, manual test steps for that chunk).
3. **Stop and wait for explicit user approval before starting the next chunk.** Do not chain chunks.

Chunks:

1. **Config + token registration** (steps 1–2): verify a row lands in `push_tokens` after sign-in on a real device. → run checks → wait.
2. **Edge Function** (step 3): deploy and invoke manually with a known `user_id` — confirm a push arrives. → run checks → wait.
3. **Event triggers + confirm/cancel UI** (steps 4–5): wire each booking event one at a time. → run checks → wait.
4. **Reminders** (step 6): migration + cron, test with a manually-inserted near-future appointment. → run checks → wait.
5. **i18n + final verification** (step 7): run checks one final time, then mark Phase 6 `[x]` in `IMPLEMENTATION-PLAN.md`.

---

## Implementation Steps

### 1. Expo / app configuration

- **`app.config.ts`** — add `expo-notifications` plugin entry with iOS and Android config (icon, color, sound).
- **`app.config.ts`** — add `extra.eas.projectId` (required by `Notifications.getExpoPushTokenAsync({ projectId })`). Read it from `process.env.EAS_PROJECT_ID` so it can be configured per-environment. Not currently set in `app.config.ts`.

### 2. Push token registration (client)

- **New file `lib/push/register-push-token.ts`** — encapsulates: request permissions (`Notifications.requestPermissionsAsync`), set Android channel (`Notifications.setNotificationChannelAsync`), get Expo token (`Notifications.getExpoPushTokenAsync`), upsert into `public.push_tokens` (insert if not present for this user). Use `Constants.expoConfig?.extra?.eas?.projectId`. Handle `Device.isDevice` guard and silent return if denied.
- **`providers/AuthProvider.tsx`** — after `setAuthState` is called with a valid `authUser`, fire `registerPushToken(authUser.id)` (fire-and-forget, swallow errors). This ensures registration happens once per session.
- **DB constraint** — add a unique constraint `(user_id, expo_push_token)` so re-registrations are idempotent (new migration). Update `register-push-token.ts` to use `.upsert(..., { onConflict: 'user_id,expo_push_token' })`.
- **Sign-out cleanup** — in the auth sign-out path (`stores/auth-store.ts` or `providers/AuthProvider.tsx`, whichever owns sign-out), delete the current device's row from `push_tokens` (`.delete().eq('user_id', userId).eq('expo_push_token', token)`) before clearing the session. Prevents a shared device from continuing to receive the previous user's notifications.

### 3. `send-push-notification` Edge Function

- **New folder `supabase/functions/send-push-notification/`** mirroring `send-otp`:
  - `index.ts` — `Deno.serve` handler, CORS via `_shared/http.ts`, admin client via `_shared/supabase.ts`.
  - Request body: `{ user_id: string, title: string, body: string, data?: Record<string, unknown> }`.
  - Look up `expo_push_token`s for the user (one user can have multiple devices).
  - POST batch to `https://exp.host/--/api/v2/push/send` with `[{ to, title, body, data, sound: 'default' }]`.
  - Inspect response — on `DeviceNotRegistered` errors, delete the offending token from `push_tokens`.
  - Return `{ sent: number, removed: number }`.

### 4. Wire mutation triggers (client)

After each mutation succeeds, call `supabase.functions.invoke('send-push-notification', { body: { user_id, title, body, data } })` (await, but don't fail the mutation if it errors — log only).

| Event | Recipient | File:line |
|---|---|---|
| New booking created | shop owner (`shops.owner_id`) | `app/booking/datetime.tsx:309` (in `onSuccess`) |
| Booking cancelled by customer | shop owner | `app/(customer)/bookings.tsx:63` (in `onSuccess`) |
| Booking confirmed by shop owner | customer | new shop-owner mutation (see step 5) |
| Booking cancelled by shop owner | customer | new shop-owner mutation (see step 5) |

A small helper `lib/push/notify-booking.ts` should expose `notifyNewBooking(appointmentId)`, `notifyBookingConfirmed(appointmentId)`, `notifyBookingCancelled(appointmentId, by: 'customer'|'shop')` — each looks up the recipient's `user_id` (shop owner via `shops.owner_id`, customer via `appointments.customer_id`) and the appointment time, formats the i18n message, and invokes the Edge Function.

### 5. Add booking confirmation flow (currently missing)

Phase 6 requires this trigger to fire, so confirm the appointment first.

- **`lib/shop-owner/api.ts`** — add `updateAppointmentStatus(appointmentId, status: 'confirmed' | 'completed' | 'cancelled')`. The existing `enforce_appointment_status_updates()` DB trigger already authorizes this for shop owners.
- **`app/(shop-owner)/calendar.tsx`** and/or **`app/(shop-owner)/index.tsx`** — when an appointment row is tapped, present a native `Modal` (`presentationStyle="formSheet"`) with Confirm / Cancel actions for `pending`/`confirmed` rows. Wrap the calls in `useMutation` with `onSuccess` invalidating the relevant query keys and firing the notification helper.

### 6. 1-hour reminders (pg_cron)

- **New migration** — enable `pg_cron` and `pg_net` extensions. Currently only `pgcrypto` and `btree_gist` are enabled in `supabase/migrations/20260407150000_extensions_and_helpers.sql`; add a new migration rather than editing the old one. Must run before the reminder function migration.
- **New migration** — add `reminder_sent_at timestamptz` column to `appointments`.
- **New migration** — create SQL function `send_appointment_reminders()` that atomically claims rows in a single statement to avoid double-send races:
  ```sql
  UPDATE appointments
     SET reminder_sent_at = now()
   WHERE status = 'confirmed'
     AND reminder_sent_at IS NULL
     AND (appointment_date + appointment_time) BETWEEN now() + interval '55 minutes'
                                                   AND now() + interval '65 minutes'
  RETURNING id, customer_id, shop_id, appointment_date, appointment_time;
  ```
  For each returned row, call the Edge Function via `net.http_post` (pg_net) with both customer and shop-owner notifications.
- Schedule via `cron.schedule('appointment-reminders', '*/5 * * * *', $$ select send_appointment_reminders() $$);`

### 7. i18n strings

Add a `notifications` namespace to **`i18n/en.json`** and **`i18n/he.json`**:

```json
"notifications": {
  "new_booking_title": "New booking",
  "new_booking_body": "{{customerName}} booked for {{date}} at {{time}}",
  "booking_confirmed_title": "Booking confirmed",
  "booking_confirmed_body": "Your appointment on {{date}} at {{time}} is confirmed",
  "booking_cancelled_by_customer_title": "Booking cancelled",
  "booking_cancelled_by_customer_body": "{{customerName}} cancelled their appointment on {{date}}",
  "booking_cancelled_by_shop_title": "Booking cancelled",
  "booking_cancelled_by_shop_body": "Your appointment on {{date}} at {{time}} was cancelled",
  "reminder_title": "Upcoming appointment",
  "reminder_body": "Your appointment is in 1 hour"
}
```

**Decision: localize on the trigger device.** The client formats `title` and `body` using `i18next.t(...)` before invoking the Edge Function, and passes the final strings. Acceptable that the recipient may see a language different from their app — revisit in a later polish pass if needed.

---

## Critical Files

| File | Change |
|---|---|
| `app.config.ts` | Add `expo-notifications` plugin |
| `providers/AuthProvider.tsx` | Call `registerPushToken` after auth state set |
| `lib/push/register-push-token.ts` | New — token registration helper |
| `lib/push/notify-booking.ts` | New — invoke edge function for each event |
| `supabase/functions/send-push-notification/index.ts` | New — Expo Push API caller |
| `supabase/migrations/2026XXXX_push_tokens_unique.sql` | New — `(user_id, expo_push_token)` unique |
| `supabase/migrations/2026XXXX_enable_pg_cron_pg_net.sql` | New — enable `pg_cron` and `pg_net` extensions |
| `supabase/migrations/2026XXXX_appointment_reminders.sql` | New — `reminder_sent_at` column + cron job |
| `stores/auth-store.ts` / `providers/AuthProvider.tsx` | Delete current device's `push_tokens` row on sign-out |
| `lib/shop-owner/api.ts` | New `updateAppointmentStatus` |
| `app/(shop-owner)/calendar.tsx` / `index.tsx` | Confirm/cancel UI + mutation |
| `app/booking/datetime.tsx` | Notify shop owner in `onSuccess` |
| `app/(customer)/bookings.tsx` | Notify shop owner in cancel `onSuccess` |
| `i18n/en.json` / `i18n/he.json` | Add `notifications` namespace |
| `types/database.ts` | Regenerate after migrations |

---

## Verification

1. **Token registration**: Sign in on a physical device → check `push_tokens` table contains a row with the Expo token.
2. **New booking**: Customer device A books an appointment → shop owner device B receives a push within seconds.
3. **Confirmation**: Shop owner taps "Confirm" on a pending appointment → customer device receives "Booking confirmed" push; row status updates to `confirmed`.
4. **Cancellation (both directions)**: Customer cancels → shop owner notified. Shop owner cancels → customer notified.
5. **Reminder**: Insert a confirmed appointment 60 min in the future, manually run `select send_appointment_reminders();` → both parties receive reminder, `reminder_sent_at` is set. Run it a second time immediately → zero new notifications (atomic claim prevents double-send).
5b. **Sign-out cleanup**: Sign out on a device → the corresponding `push_tokens` row is deleted, and a subsequent push to that user does not arrive on the signed-out device.
6. **Stale token cleanup**: Uninstall app on device, trigger a notification for that user → `push_tokens` row is deleted on `DeviceNotRegistered` response.
7. **Run full check**: `npx expo lint && npx tsc --noEmit && npx jest && npx expo export`.
8. **Update `IMPLEMENTATION-PLAN.md`** — mark Phase 6 items `[x]`.
