# BarberQ — Implementation Plan

## Context

Building BarberQ, a standalone barber appointment scheduling mobile app from scratch. Customers discover nearby shops on a map, pick a barber, choose a service, and book a time slot. Shop owners manage their shop, barbers, services, and appointments. Auth is phone-based OTP via SMS4Free. The app supports English + Hebrew (RTL).

Full design spec & root plan: `plan.md`

---

## Phase 1: Project Scaffolding & Core Setup

- [x] 1. **Initialize Expo project** with TypeScript template in the repo root
- [x] 2. **Install core dependencies:**
  - Navigation: expo-router, react-native-bottom-tabs
  - State: zustand, @tanstack/react-query
  - Forms: react-hook-form, zod
  - i18n: i18next, react-i18next, expo-localization
  - UI: tamagui, @tamagui/config, expo-image, legendlist (or @shopify/flash-list), zeego, react-native-reanimated, react-native-gesture-handler
  - Backend: @supabase/supabase-js, @react-native-async-storage/async-storage
  - Maps: react-native-maps, expo-location
  - Push: expo-notifications
  - Testing: jest-expo, @testing-library/react-native
- [x] 3. **Set up Expo Router** file-based navigation with root layout (`app/_layout.tsx`), using stack navigators and tab groups
- [x] 4. **Set up Tamagui** — `tamagui.config.ts` with theme tokens (colors, spacing, fonts, media queries) and Expo integration via Tamagui tooling
- [x] 5. **Set up design system** — `components/` folder with compound component wrappers over Tamagui and `index.ts` re-exports (all app code imports from `@/components`, never directly from `tamagui`)
- [x] 6. **Build base components** — Button (Button/ButtonText/ButtonIcon), Card, Text, Input as compound wrappers over Tamagui primitives
- [x] 7. **Set up i18n** with i18next — `i18n/en.json`, `i18n/he.json`, RTL toggle via `I18nManager`
- [x] 8. **Set up Supabase client** in `lib/supabase.ts` (using `@supabase/supabase-js` with AsyncStorage for session persistence)
- [x] 9. **Set up TanStack Query provider** and **Zustand stores** (auth store, booking store)
- [x] 10. **Set up constants** — colors, config values
- [x] **Phase 1 verified** (lint, type check, tests, build)

## Phase 2: Database & Migrations

- [x] 1. **Create SQL migrations** for all tables: `profiles`, `shops` (with `buffer_minutes` and `cancellation_window_hours`), `barbers`, `services`, `barber_services`, `working_hours`, `barber_unavailable_dates`, `shop_closures`, `appointments` (with `end_time` column), `appointment_services`, `otp_codes`, `push_tokens`
- [x] 2. **Create database indexes** for performance:
  - Shop discovery: `idx_shops_active`, `idx_shops_location`
  - Barber/service lookups: `idx_barbers_shop`, `idx_services_shop`, `idx_barber_services_barber`, `idx_barber_services_service`
  - Working hours: `idx_working_hours_barber_day`
  - Appointment queries: `idx_appointments_barber_date`, `idx_appointments_customer`, `idx_appointments_shop_date`
  - Double-booking prevention: `no_overlapping_bookings` (GiST exclusion constraint, requires `btree_gist` extension)
  - Barber unavailable dates: `idx_barber_unavailable`
  - Shop closures: `idx_shop_closures`
  - Appointment services: `idx_appointment_services_appointment`, `idx_appointment_services_service`
  - Auth & push: `idx_otp_phone`, `idx_push_tokens_user`
- [x] 3. **Set up Row Level Security (RLS)** policies:
  - Customers can read shops/barbers/services/shop_closures, create/read/cancel own appointments, read own appointment_services
  - Shop owners can CRUD their own shop, barbers, services, working hours, shop_closures; read appointments and appointment_services for their shop
- [x] 4. **Generate TypeScript types** from Supabase schema
- [x] **Phase 2 verified** (lint, type check, tests, build)

## Phase 3: Authentication

- [ ] 1. **Create auth screens:** Welcome, Phone Input, OTP Verification, Role Selection, Profile Setup
- [ ] 2. **Create Supabase Edge Function: `send-otp`** — generates 6-digit code, stores in `otp_codes` table, calls SMS4Free API
- [ ] 3. **Create Supabase Edge Function: `verify-otp`** — validates code, creates/finds user via Supabase Admin Auth, returns session
- [ ] 4. **Wire up auth flow** — phone → OTP → role select → profile setup → redirect to correct tab group
- [ ] 5. **Auth guard** — redirect unauthenticated users to (auth) group, redirect based on role
- [ ] **Phase 3 verified** (lint, type check, tests, build)

## Phase 4: Shop Owner Flow

- [ ] 1. **Shop Management screen** — create/edit shop (name, address, phone, description, cover image via `expo-image` + Supabase Storage, geocode address for lat/lng). Includes settings for `buffer_minutes` (cleanup time between appointments) and `cancellation_window_hours` (minimum notice for cancellations)
- [ ] 2. **Barbers screen** — add/edit/deactivate barbers, set avatar (`expo-image`) and bio. Use FlashList/LegendList for barber list.
- [ ] 3. **Services screen** — add/edit/deactivate services with name, duration, price. Use FlashList/LegendList for service list.
- [ ] 4. **Barber-Services linking** — assign which services each barber offers
- [ ] 5. **Working Hours screen** — set per-barber schedule (day of week, start/end time, available toggle). Support multiple time windows per day for breaks (e.g., morning 09:00–13:00 + afternoon 14:00–17:00)
- [ ] 6. **Time-Off screen** — manage barber unavailable dates (vacation, holidays, sick days) via `barber_unavailable_dates` table
- [ ] 7. **Shop Closures screen** — manage shop-wide closure dates (holidays, renovation) via `shop_closures` table
- [ ] 8. **Dashboard screen** — today's appointments in a virtualized list, quick stats (total bookings, upcoming, cancellations)
- [ ] 9. **Calendar screen** — month/week view of all appointments across barbers
- [ ] **Phase 4 verified** (lint, type check, tests, build)

## Phase 5: Customer Flow

- [ ] 1. **Explore screen** — map view (react-native-maps) showing nearby shops + FlashList/LegendList below (virtualized, memoized items, primitive props only)
- [ ] 2. **Location permission** — request GPS via expo-location, sort shops by distance. **Fallback:** if GPS is denied, allow manual city/area search
- [ ] 3. **Search & filter** — search by shop name, filter by service type
- [ ] 4. **Shop Detail screen** — shop info, cover image via `expo-image` with blurhash placeholder, list of barbers
- [ ] 5. **Booking flow screens:**
  - [ ] Barber Selection — cards with `expo-image` avatar, name, bio. Use `Pressable` with `GestureDetector` for press animations (GPU-only: transform + opacity)
  - [ ] Service Selection — virtualized list filtered by selected barber (via barber_services), show duration + price. **Multiple services allowed** — total duration = SUM of selected service durations
  - [ ] Date/Time Picker — calendar for date (check `shop_closures` first, then `barber_unavailable_dates`), then generate available time slots using multi-window working hours and total service duration (15-min step), applying `shop.buffer_minutes` to extend occupied ranges, checking for overlaps with existing bookings via `end_time`. Display in a virtualized list.
  - [ ] Confirmation — review summary via native `Modal` with `presentationStyle="formSheet"`, optional notes, confirm button
- [ ] 6. **Create booking** — insert into `appointments` table with `end_time` (= `appointment_time` + SUM of service durations) and status 'pending', then insert into `appointment_services` for each selected service. Database exclusion constraint prevents overlapping bookings.
- [ ] 7. **Bookings tab** — virtualized list of upcoming appointments (with cancel option, respecting `shop.cancellation_window_hours`) + past appointments
- [ ] 8. **Favorites tab** (stretch) — save/unsave shops
- [ ] **Phase 5 verified** (lint, type check, tests, build)

## Phase 6: Push Notifications

- [ ] 1. **Register push tokens** — on app launch, get Expo push token, store in `push_tokens`
- [ ] 2. **Create Edge Function: `send-push-notification`** — accepts user_id + message, looks up token, calls Expo Push API
- [ ] 3. **Trigger notifications:**
  - New booking → notify shop owner
  - Booking confirmed → notify customer
  - Booking cancelled → notify the other party
- [ ] 4. **Appointment reminders** — Supabase cron job or pg_cron to trigger 1-hour-before reminders
- [ ] **Phase 6 verified** (lint, type check, tests, build)

## Phase 7: Polish & RTL

- [ ] 1. **RTL testing** — verify all screens render correctly in Hebrew
- [ ] 2. **Language toggle** — in Profile screen, switch language and flip RTL
- [ ] 3. **Loading states** — skeleton screens for lists and maps
- [ ] 4. **Error handling** — toast notifications for failures (booking conflicts, network errors)
- [ ] 5. **Empty states** — friendly messages when no shops nearby, no bookings, etc.
- [ ] 6. **Safe areas** — use `contentInsetAdjustmentBehavior="automatic"` on all ScrollViews, no SafeAreaView wrappers
- [ ] 7. **Styling audit** — ensure `borderCurve: 'continuous'` on all rounded corners, `gap` for spacing, CSS `boxShadow` syntax
- [ ] **Phase 7 verified** (lint, type check, tests, build)

---

## Critical Files

| File/Path                        | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `app/_layout.tsx`                | Root layout, providers, auth guard                        |
| `app/(auth)/`                    | All auth screens                                          |
| `app/(customer)/`                | Customer tab screens (NativeTabs)                         |
| `app/(shop-owner)/`              | Shop owner tab screens (NativeTabs)                       |
| `app/booking/`                   | Booking flow stack (native-stack)                         |
| `tamagui.config.ts`              | Tamagui theme, tokens, fonts, media queries               |
| `components/index.ts`            | Design system re-exports (all imports via `@/components`) |
| `components/Button/Button.tsx`   | Compound wrapper over Tamagui Button                      |
| `components/Card/Card.tsx`       | Compound wrapper over Tamagui Card                        |
| `components/Text/Text.tsx`       | Wrapper over Tamagui Text with app typography             |
| `lib/supabase.ts`                | Supabase client setup                                     |
| `stores/auth-store.ts`           | Auth state (user, role, session)                          |
| `stores/booking-store.ts`        | Booking flow state                                        |
| `i18n/en.json`, `i18n/he.json`   | Translation files                                         |
| `supabase/migrations/`           | All SQL migrations                                        |
| `supabase/functions/send-otp/`   | OTP generation + SMS4Free                                 |
| `supabase/functions/verify-otp/` | OTP verification + session                                |
| `supabase/functions/send-push/`  | Push notification sender                                  |

---

## Tech Stack Summary

| Layer         | Technology                                                          |
| ------------- | ------------------------------------------------------------------- |
| Framework     | React Native + Expo SDK 52 (managed)                                |
| Language      | TypeScript                                                          |
| Navigation    | Expo Router with native-stack navigators                            |
| Tabs          | react-native-bottom-tabs / Expo Router NativeTabs                   |
| Server state  | TanStack Query v5                                                   |
| Local state   | Zustand                                                             |
| UI foundation | Tamagui (build-time style compilation, theming, RTL)                |
| UI components | Compound wrappers over Tamagui, re-exported from `@/components`     |
| Images        | expo-image (caching, blurhash placeholders)                         |
| Lists         | LegendList or @shopify/flash-list (all lists virtualized)           |
| Pressables    | Pressable only (no TouchableOpacity)                                |
| Menus         | zeego (native context menus)                                        |
| Modals        | Native Modal with presentationStyle="formSheet"                     |
| Maps          | react-native-maps                                                   |
| Location      | expo-location                                                       |
| Push          | expo-notifications                                                  |
| Animations    | react-native-reanimated (GPU-accelerated, 60fps)                    |
| Gestures      | react-native-gesture-handler (GestureDetector for press animations) |
| Backend       | Supabase (PostgreSQL, Auth, Storage, Edge Functions)                |
| OTP/SMS       | Custom OTP via SMS4Free API                                         |
| i18n          | expo-localization + i18next + react-i18next                         |
| RTL           | I18nManager                                                         |
| Forms         | react-hook-form + zod                                               |

## Performance Rules (vercel-react-native-skills)

- **Virtualize all lists** — never ScrollView with `.map()` for dynamic data
- **Memoize list items** — `memo()` with primitive props, hoist callbacks
- **GPU-only animations** — only `transform` and `opacity`, use GestureDetector for press
- **Compound components** — wrap Tamagui as `<Button><ButtonText>`, import from `@/components` only (never `tamagui` directly)
- **expo-image everywhere** — compressed thumbnails in lists, blurhash placeholders
- **Pressable only** — no TouchableOpacity/TouchableHighlight
- **Safe areas via contentInsetAdjustmentBehavior** — no SafeAreaView wrappers
- **Styling** — `borderCurve: 'continuous'`, `gap` for spacing, CSS `boxShadow`
- **State = ground truth** — derive visuals during render, minimize stored state
- **No falsy && rendering** — use ternary with null to avoid crashes

---

## Verification

1. **Auth:** Register with phone → receive OTP → verify → select role → complete profile → land on correct tab group
2. **Shop owner:** Create shop → add barbers → add services → link services to barbers → set working hours → verify dashboard shows data
3. **Customer:** See shops on map → tap shop → select barber → select multiple services → pick date/time (with buffer applied) → confirm → booking appears in Bookings tab
4. **Time slot conflicts:** Book a slot, then try booking the same slot → should be rejected
   4b. **Booking in the past:** Try booking a date/time in the past → should be blocked
   4c. **Shop closures:** Mark shop as closed on a date → customer should see "Shop closed" instead of time slots
   4d. **Cancellation window:** Set cancellation window → try cancelling within the window → should be blocked
5. **Push:** Book an appointment → shop owner gets push notification
6. **RTL:** Switch to Hebrew → all layouts flip, text is right-aligned, navigation is mirrored
7. **Cancel:** Cancel a booking → status updates, other party is notified
8. **GPS fallback:** Deny location permission → manual city/area search still works

---

## Success Metrics

| Metric                     | Target                                                  |
| -------------------------- | ------------------------------------------------------- |
| Booking completion rate    | > 70% of users who start the flow complete it           |
| Time to book               | < 60 seconds from opening the app                       |
| Shop owner setup time      | < 5 minutes to create shop + add first barber + service |
| App crash rate             | < 1%                                                    |
| Push notification delivery | > 95%                                                   |

---

## Risks & Mitigations

| Risk                       | Impact                   | Mitigation                                                    |
| -------------------------- | ------------------------ | ------------------------------------------------------------- |
| SMS4Free delivery failures | Users can't sign in      | Implement retry logic, consider fallback SMS provider         |
| GPS permission denied      | Can't show nearby shops  | Fallback to manual city/area search                           |
| Simultaneous bookings      | Double-booked barber     | Database unique index + app-level slot filtering              |
| RTL layout bugs            | Poor Hebrew UX           | Dedicated RTL testing phase, Tamagui's built-in RTL support   |
| Expo SDK limitations       | Can't access native APIs | Managed workflow covers all our needs; can eject if necessary |
