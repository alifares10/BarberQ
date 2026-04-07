# BarberQ

Barber appointment scheduling mobile app (iOS & Android). Two roles: customers book appointments, shop owners manage their shop. English + Hebrew (RTL).

## Docs

- `plan.md` — Design spec (schema, flows, navigation, tech stack, project structure)
- `DATABASE.md` — Database docs (tables, indexes, RLS, ERD)
- `IMPLEMENTATION-PLAN.md` — 7-phase build plan

## Tech Stack

React Native + Expo SDK 52 (managed), TypeScript, Expo Router, Tamagui, TanStack Query v5, Zustand, Supabase, i18next. Full list in `plan.md`.

## Code Conventions

- **Imports:** All UI from `@/components` — never import `tamagui` directly
- **Components:** Compound pattern — `<Button><ButtonText>Label</ButtonText></Button>`
- **Pressables:** `Pressable` only — never `TouchableOpacity`/`TouchableHighlight`
- **Lists:** Always virtualized (FlashList/LegendList) — never `ScrollView` + `.map()`
- **List items:** `memo()` with primitive props, hoist callbacks
- **Images:** `expo-image` only — blurhash placeholders, compressed thumbnails in lists
- **Animations:** GPU-only (`transform`, `opacity`) via reanimated, `GestureDetector` for press
- **Styling:** `borderCurve: 'continuous'`, `gap` for spacing, CSS `boxShadow`
- **Safe areas:** `contentInsetAdjustmentBehavior="automatic"` — no SafeAreaView wrappers
- **State:** Minimize state, derive during render, store ground truth only
- **Conditional rendering:** Ternary with `null` — never `{condition && <Component>}`
- **Modals:** Native `Modal` with `presentationStyle="formSheet"`

## Key Design Decisions

- `appointments` stores `end_time` (= start + service duration) for overlap detection
- Double-booking: GiST exclusion constraint on time ranges, not just exact time match
- `working_hours`: multiple rows per barber per day (supports breaks)
- `barber_unavailable_dates` table for vacation/holidays/sick
- Slot generation: 15-min steps, variable duration, multi-window, checks unavailable dates first
- `shops.buffer_minutes` adds cleanup time between appointments (app-level, not DB constraint)
- `shops.cancellation_window_hours` sets minimum notice for cancellations (app-level enforcement)
- Multiple services per booking via `appointment_services` join table; duration = SUM of services
- `shop_closures` table for shop-wide closure dates; checked before barber-level availability
- Auth: custom OTP via SMS4Free Edge Functions (not Supabase Phone Auth)
- Appointment lifecycle: `pending` → `confirmed` → `completed` (or `cancelled` at any point)

## Workflow

After each implementation phase, run the full check before moving on:

1. **Lint:** `npx expo lint`
2. **Type check:** `npx tsc --noEmit`
3. **Tests:** `npx jest`
4. **Build:** `npx expo export`

Do not proceed to the next phase if any of these fail.

When all checks pass, update `IMPLEMENTATION-PLAN.md` — mark the completed phase and its sub-items with `[x]` checkboxes.
