# Phase 5: Customer Flow — Implementation Plan

## Context

Phases 1-4 are complete. Customer tab screens (`app/(customer)/`) and booking flow (`app/booking/`) exist as placeholders. The booking store, DB schema (with GiST exclusion constraint), RLS policies, and all dependencies (react-native-maps, expo-location, flash-list, expo-image) are already in place. This phase builds the entire customer-facing experience: shop discovery, multi-step booking, and appointment management. Favorites tab is deferred.

Implement one sub-phase at a time. Verify (`npx expo lint && npx tsc --noEmit && npx jest && npx expo export`) after each. **Wait for user confirmation before proceeding to the next sub-phase.**

---

## Sub-Phase 5a: Customer API Layer + Slot Helpers + Tests

**Goal:** Data foundation — no screen changes yet.

### Files to Create

**`lib/customer/api.ts`** — All Supabase queries for customer side. Follow pattern from `lib/shop-owner/api.ts` (type aliases from `Database['public']['Tables']`, import `supabase` from `@/lib/supabase`, throw on error).

Functions:
- `fetchActiveShops()` — `shops` where `is_active = true`, include nested `services(id, name)` for filtering
- `fetchShopById(shopId)` — `.single()`
- `fetchActiveBarbersByShopId(shopId)` — `barbers` where `shop_id` + `is_active = true`
- `fetchServicesByBarberId(barberId)` — join `barber_services` → `services` where `is_active = true`
- `fetchWorkingHoursByBarberAndDay(barberId, dayOfWeek)` — `working_hours` where `is_available = true`, filtered by `day_of_week`
- `fetchShopClosureByDate(shopId, date)` — `.maybeSingle()`, returns `null` if open
- `fetchBarberUnavailableByDate(barberId, date)` — `.maybeSingle()`, returns `null` if available
- `fetchBarberBookingsByDate(barberId, date)` — non-cancelled bookings, select `appointment_time, end_time`
- `createAppointment(payload)` — INSERT into `appointments`, `.select().single()`
- `createAppointmentServices(appointmentId, serviceIds)` — INSERT array into `appointment_services`
- `fetchCustomerAppointments(customerId)` — SELECT with joins: `barber(id, name, avatar_url)`, `shop(id, name, address, cover_image_url, cancellation_window_hours)`, `appointment_services(service_id, service:services(id, name, duration, price))`. Order by `appointment_date DESC, appointment_time DESC`.
- `cancelAppointment(appointmentId)` — UPDATE status to `'cancelled'`

Export type `CustomerAppointment` for the joined shape (similar to `ShopAppointment` in `lib/shop-owner/api.ts`).

**`lib/customer/query-keys.ts`** — Query key factory (pattern from `lib/shop-owner/query-keys.ts`):

```ts
export const customerQueryKeys = {
  activeShops: () => ['customer', 'shops'] as const,
  shopById: (shopId: string) => ['customer', 'shop', shopId] as const,
  barbersByShop: (shopId: string) => ['customer', 'barbers', shopId] as const,
  servicesByBarber: (barberId: string) => ['customer', 'services', barberId] as const,
  workingHours: (barberId: string, dayOfWeek: number) => ['customer', 'working-hours', barberId, dayOfWeek] as const,
  shopClosure: (shopId: string, date: string) => ['customer', 'shop-closure', shopId, date] as const,
  barberUnavailable: (barberId: string, date: string) => ['customer', 'barber-unavailable', barberId, date] as const,
  barberBookings: (barberId: string, date: string) => ['customer', 'barber-bookings', barberId, date] as const,
  customerAppointments: (customerId: string) => ['customer', 'appointments', customerId] as const,
};
```

**`lib/customer/slot-helpers.ts`** — Pure functions for time slot generation (no Supabase, no I/O):

- `timeToMinutes(time: string): number` — "HH:MM" or "HH:MM:SS" → minutes since midnight
- `minutesToTime(minutes: number): string` — minutes → "HH:MM"
- `generateAvailableSlots(params): string[]` — core algorithm:
  - Params: `workingWindows: { startMinutes, endMinutes }[]`, `existingBookings: { startMinutes, endMinutes }[]`, `totalDurationMinutes`, `bufferMinutes`, `isToday`, `nowMinutes`
  - For each window: iterate `slot = window.start` to `window.end - totalDuration` in 15-min steps
  - Skip if `[slot, slot + duration)` overlaps any `[booking.start, booking.end + buffer)`
  - Skip if `isToday && slot <= nowMinutes`
  - Return sorted "HH:MM" array
- Overlap check: `slotStart < bookingEnd + buffer && slotEnd > bookingStart`

**`lib/customer/distance.ts`** — Haversine distance utility:
- `calculateDistanceKm(lat1, lng1, lat2, lng2): number`
- `formatDistance(km: number): string` — "0.5 km", "2.3 km"

**`__tests__/slot-helpers.test.ts`** — Unit tests for `generateAvailableSlots` + `timeToMinutes` + `minutesToTime`:
- Basic: single window, no bookings → correct 15-min slots
- Blocked: booking in middle of window → those slots skipped
- Buffer: booking end + buffer blocks adjacent slots
- Today: past slots filtered out
- Multiple windows: two windows (break) → slots from both
- No slots: fully booked → returns empty array
- Boundary: slot exactly fits at end of window → included
- Duration > window → returns empty

### Key Decisions
- `fetchServicesByBarberId` does two queries (barber_services → services) because the customer selects a barber first
- `fetchActiveShops` includes nested `services(id, name)` so Explore can filter by service type without extra queries
- Slot generation is pure — DB fetching in screens, mapped to `{ startMinutes, endMinutes }` before calling helper

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest
```
**Stop here — wait for user confirmation before proceeding to 5b.**

---

## Sub-Phase 5b: Explore Screen (Map + List + Location + Search)

**Goal:** Replace Explore placeholder with map view, shop list, location permission, and search/filter.

### Files to Create/Modify

**`app/(customer)/index.tsx`** — Full rewrite of placeholder:
- On mount: `expo-location` `requestForegroundPermissionsAsync()`, get position if granted
- Query: `fetchActiveShops()` with `customerQueryKeys.activeShops()`
- Derive `sortedShops` in `useMemo`: Haversine sort if location available, else unsorted
- Local state: `searchQuery` (string), `selectedServiceFilter` (string | null)
- Filter by name (case-insensitive substring) and optionally by service name
- Layout: `View` flex:1 → fixed-height `MapView` (react-native-maps, ~250px) → search `Input` → service filter chips (`View` with `flexDirection: 'row', flexWrap: 'wrap'`) → `FlashList` of `ShopCard`
- MapView: `Marker` for each shop at lat/lng, onPress navigates to shop detail
- If location denied: banner with manual search hint, center map on default (Tel Aviv 32.0853, 34.7818)
- `contentInsetAdjustmentBehavior="automatic"` on FlashList

**`components/customer/ShopCard.tsx`** — Memoized with primitive props:
- Props: `shopId`, `name`, `address`, `coverImageUrl`, `distance`, `onPress`
- `expo-image` cover with blurhash placeholder, `Pressable` wrapper
- Styling: `borderCurve: 'continuous'`, `gap`, `boxShadow`

**`components/index.ts`** — Add `ShopCard` export

**`i18n/en.json` + `i18n/he.json`** — Add explore keys: `searchPlaceholder`, `locationDenied`, `noShops`, `allServices`, `distanceAway`

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest && npx expo export
```
**Stop here — wait for user confirmation before proceeding to 5c.**

---

## Sub-Phase 5c: Shop Detail Screen

**Goal:** Shop info page with cover image and barber list — entry to booking flow.

### Files to Create/Modify

**`app/booking/[shopId].tsx`** — New dynamic route:
- `useLocalSearchParams<{ shopId: string }>()`
- Queries: `fetchShopById(shopId)`, `fetchActiveBarbersByShopId(shopId)`
- FlashList with `ListHeaderComponent`: large `expo-image` cover with blurhash, shop name, description, address (pressable → Maps), phone (pressable → call via `Linking`)
- Barber cards in list: avatar, name, bio. `Pressable` tap → set `selectedShopId` + `selectedBarberId` in booking store → navigate to `/booking/services`

**`app/booking/_layout.tsx`** — Add explicit `Stack.Screen` entries for `[shopId]`, `services`, `datetime`

**`app/(customer)/index.tsx`** — Update `ShopCard` onPress to navigate to `/booking/${shopId}`

**`i18n/en.json` + `i18n/he.json`** — Add shop detail keys

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest && npx expo export
```
**Stop here — wait for user confirmation before proceeding to 5d.**

---

## Sub-Phase 5d: Service Selection Screen

**Goal:** Pick one or more services offered by the selected barber.

### Files to Create/Modify

**`app/booking/services.tsx`** — New screen:
- Read `selectedBarberId` from booking store
- Query: `fetchServicesByBarberId(selectedBarberId)` with `customerQueryKeys.servicesByBarber()`
- FlashList of service cards: name, duration ("30 min"), price. Toggle select/deselect (multi-select)
- Compute totals in `useMemo`: `totalDuration = SUM(durations)`, `totalPrice = SUM(prices)`
- Bottom bar: total summary + "Next" button (disabled until >= 1 service selected)
- On Next: `setSelectedServiceIds(ids)` → navigate to `/booking/datetime`
- Reanimated press animation on cards: `transform: [{ scale: 0.97 }]` + `opacity: 0.8` via `GestureDetector` (GPU-only)

**`components/customer/ServiceItem.tsx`** — Memoized:
- Props: `serviceId`, `name`, `duration`, `price`, `isSelected`, `onToggle`

**`i18n/en.json` + `i18n/he.json`** — Add service selection keys

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest && npx expo export
```
**Stop here — wait for user confirmation before proceeding to 5e.**

---

## Sub-Phase 5e: Date/Time Picker + Confirmation + Create Booking

**Goal:** Date selection, slot generation, confirmation modal, and booking creation. Most complex sub-phase.

### Files to Create/Modify

**`app/booking/datetime.tsx`** — New screen:
- Read `selectedBarberId`, `selectedShopId`, `selectedServiceIds` from booking store
- Query services → compute `totalDurationMinutes` (SUM of selected service durations)
- Query `fetchShopById` → get `buffer_minutes`

**Date picker section:**
- Horizontal scrollable list of next 14 days (use `addDays` + `toIsoDate` from `lib/shop-owner/appointments-helpers.ts`)
- Each date chip: day name + date number. `Pressable`. Selected = accent background.
- Set `selectedDate` in booking store on tap

**Time slots section (shown when date selected):**
- Check `fetchShopClosureByDate` → if closed, show "Shop closed" message
- Check `fetchBarberUnavailableByDate` → if unavailable, show "Barber unavailable"
- Otherwise: fetch `fetchWorkingHoursByBarberAndDay` + `fetchBarberBookingsByDate`
- Map results to `{ startMinutes, endMinutes }` → call `generateAvailableSlots()` from `slot-helpers.ts`
- Display slots in FlashList. Each slot `Pressable` showing "HH:MM". Selected = accent.
- Empty state if no slots

**Confirmation modal (same file):**
- Native `Modal` with `presentationStyle="formSheet"`, `animationType="slide"`
- Triggered by "Review Booking" button (enabled when date + time selected)
- Shows: shop name, barber name, services list with duration/price, total, date, time
- Notes `Input` (multiline, optional)
- "Confirm Booking" button → `useMutation`:
  1. Compute `end_time = minutesToTime(timeToMinutes(selectedTime) + totalDuration)`
  2. `createAppointment({ customer_id, barber_id, shop_id, appointment_date, appointment_time, end_time, status: 'pending', notes })`
  3. `createAppointmentServices(appointment.id, selectedServiceIds)`
- `onSuccess`: invalidate `customerAppointments`, `bookingStore.reset()`, navigate to `/(customer)/bookings`
- `onError`: check for GiST violation (Postgres code `23P01`) → "This slot was just booked" error. Otherwise generic error.

**`components/customer/DateChip.tsx`** — Memoized: `date`, `dayLabel`, `dateLabel`, `isSelected`, `isDisabled`, `onSelect`

**`components/customer/TimeSlotChip.tsx`** — Memoized: `time`, `isSelected`, `onSelect`

**`i18n/en.json` + `i18n/he.json`** — Add datetime + confirmation keys

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest && npx expo export
```
**Stop here — wait for user confirmation before proceeding to 5f.**

---

## Sub-Phase 5f: Bookings Tab (Upcoming + Past + Cancel)

**Goal:** Replace Bookings placeholder with real appointment list.

### Files to Create/Modify

**`app/(customer)/bookings.tsx`** — Full rewrite:
- Get `customerId` from auth store session
- Query: `fetchCustomerAppointments(customerId)` with `customerQueryKeys.customerAppointments()`
- Derive in `useMemo`: split into `upcoming` (pending/confirmed + date >= today) and `past` (completed, cancelled, or past dates)
- Single FlashList with heterogeneous items: section headers + appointment cards (use `getItemType`)
- Each appointment card: shop name, barber name, date, time range, status badge, services summary

**Cancel logic:**
- Show "Cancel" button on upcoming appointments
- Compute `hoursUntil = (appointmentDateTime - now) / 3600000`
- If `cancellation_window_hours != null && hoursUntil < cancellation_window_hours` → disable button
- Cancel mutation: `cancelAppointment(id)`, invalidate `customerAppointments` query

**`components/customer/AppointmentCard.tsx`** — Memoized:
- Props: `appointmentId`, `shopName`, `barberName`, `date`, `startTime`, `endTime`, `status`, `servicesSummary`, `canCancel`, `onCancel`

**`i18n/en.json` + `i18n/he.json`** — Add bookings tab keys (upcoming, past, empty, cancel, status labels)

### Verify
```
npx expo lint && npx tsc --noEmit && npx jest && npx expo export
```
**Stop here — wait for user confirmation before proceeding to 5g.**

---

## Sub-Phase 5g: Final Verification

1. Run full check: `npx expo lint && npx tsc --noEmit && npx jest && npx expo export`
2. End-to-end test:
   - Explore: shops on map + list, sorted by distance. Search/filter works.
   - Tap shop → detail with cover image, info, barbers
   - Tap barber → services filtered to barber, multi-select, totals update
   - Next → date picker (14 days), tap date → slots appear (or closed/unavailable)
   - Tap slot → "Review Booking" → modal shows correct summary
   - Confirm → appointment in DB with correct `end_time` → Bookings tab
   - Bookings shows appointment under "Upcoming" with cancel option
   - Cancel within window → works. Outside window → blocked.
   - Book same slot again → GiST constraint error handled
   - Deny location → manual search fallback works
3. Mark all Phase 5 items as `[x]` in `IMPLEMENTATION-PLAN.md`

---

## File Summary

| Sub-phase | New files | Modified files |
|-----------|-----------|----------------|
| **5a** | `lib/customer/api.ts`, `lib/customer/query-keys.ts`, `lib/customer/slot-helpers.ts`, `lib/customer/distance.ts`, `__tests__/slot-helpers.test.ts` | — |
| **5b** | `components/customer/ShopCard.tsx` | `app/(customer)/index.tsx`, `components/index.ts`, i18n files |
| **5c** | `app/booking/[shopId].tsx` | `app/booking/_layout.tsx`, `app/(customer)/index.tsx`, i18n files |
| **5d** | `app/booking/services.tsx`, `components/customer/ServiceItem.tsx` | i18n files |
| **5e** | `app/booking/datetime.tsx`, `components/customer/DateChip.tsx`, `components/customer/TimeSlotChip.tsx` | i18n files |
| **5f** | `components/customer/AppointmentCard.tsx` | `app/(customer)/bookings.tsx`, i18n files |

## Key Reuse

| What | Where |
|------|-------|
| API pattern | `lib/shop-owner/api.ts` — type aliases, error handling, query structure |
| Query keys pattern | `lib/shop-owner/query-keys.ts` — hierarchical factory |
| Date helpers | `lib/shop-owner/appointments-helpers.ts` — `toIsoDate`, `parseIsoDate`, `addDays`, `normalizeTime`, `startOfDay` |
| Booking state | `stores/booking-store.ts` — already has shopId, barberId, serviceIds, date, time, notes, reset |
| DB types | `types/database.ts` — all table types already generated |
| Design system | `components/` — Button, ButtonText, Card, Text, Input, LoadingScreen |
