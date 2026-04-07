# BarberQ — Design Spec

## Overview

BarberQ is a mobile app for barber appointment scheduling. Customers discover nearby barber shops, choose a barber, pick a service, and book a time slot. Shop owners manage their shop, barbers, services, and appointments from the same app.

**Target platforms:** iOS & Android
**Languages:** English + Hebrew (RTL support)

---

## Users & Roles

| Role           | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| **Customer**   | Browses shops, books appointments, manages bookings                               |
| **Shop Owner** | Manages shop profile, barbers, services, working hours, and incoming appointments |

Role is selected during onboarding and stored in the `profiles` table.

---

## Tech Stack

| Layer              | Technology                                                                         |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | React Native + Expo SDK 52 (managed workflow)                                      |
| Language           | TypeScript                                                                         |
| Navigation         | Expo Router (file-based) with native navigators                                    |
| Tabs               | `react-native-bottom-tabs` / Expo Router `NativeTabs`                              |
| Server state       | TanStack Query v5                                                                  |
| Local state        | Zustand                                                                            |
| UI foundation      | Tamagui (build-time style compilation, theming, RTL support)                       |
| UI components      | Compound component wrappers over Tamagui, re-exported from `@/components`          |
| Images             | `expo-image` (not RN Image) — caching, blurhash placeholders                       |
| Lists              | `LegendList` or `@shopify/flash-list` — all lists must be virtualized              |
| Pressables         | `Pressable` only (no TouchableOpacity/TouchableHighlight)                          |
| Menus              | `zeego` — native context menus and dropdowns                                       |
| Modals             | Native `Modal` with `presentationStyle="formSheet"`                                |
| Maps               | react-native-maps                                                                  |
| Location           | expo-location                                                                      |
| Push notifications | expo-notifications                                                                 |
| Animations         | react-native-reanimated + react-native-gesture-handler (GestureDetector for press) |
| Backend            | Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)                     |
| OTP / SMS          | Custom OTP via SMS4Free API (not Twilio)                                           |
| i18n               | expo-localization + i18next + react-i18next                                        |
| RTL                | `I18nManager` for layout flipping                                                  |
| Forms              | react-hook-form + zod                                                              |

### UI & Performance Guidelines (from vercel-react-native-skills)

- **Tamagui as foundation** — build-time style compilation, theming, RTL support out of the box
- **Compound component wrappers** — wrap Tamagui primitives as `<Button>`, `<ButtonText>`, `<ButtonIcon>`, re-export from `@/components/index.ts`
- **Design system folder** — app code imports from `@/components`, never directly from `tamagui`
- **Virtualize all lists** — never use ScrollView with `.map()` for dynamic data
- **GPU-only animations** — only animate `transform` and `opacity`, never layout props
- **Safe areas** — use `contentInsetAdjustmentBehavior="automatic"` on ScrollViews, no SafeAreaView wrappers
- **Styling** — `borderCurve: 'continuous'` for rounded corners, `gap` for spacing, CSS `boxShadow` syntax
- **State** — minimize state, derive values during render, store ground truth only
- **Images** — always use `expo-image` with blurhash placeholders, compressed thumbnails in lists

---

## Authentication Flow

Custom OTP flow using SMS4Free (Supabase's built-in phone auth is bypassed):

1. User enters phone number
2. Supabase Edge Function generates a 6-digit OTP, stores it in `otp_codes` table (with 5-minute expiry)
3. Edge Function calls SMS4Free API to deliver the SMS
4. User enters the OTP code
5. Edge Function verifies the code, creates/finds the user in Supabase Auth, returns a session token
6. First-time users proceed to role selection (Customer / Shop Owner) and profile setup

---

## Navigation & Screens

### Auth Flow (unauthenticated)

- **Welcome** — App intro / onboarding
- **Phone Input** — Enter phone number
- **OTP Verification** — Enter 6-digit code
- **Role Selection** — Customer or Shop Owner
- **Profile Setup** — Name, avatar

### Customer (bottom tabs)

1. **Explore** — Map view with nearby shops + list view with search/filter
2. **Bookings** — Upcoming and past appointments
3. **Favorites** — Saved shops (stretch goal)
4. **Profile** — Account settings, language toggle (EN/HE)

### Customer Booking Stack (from Explore)

- **Shop Detail** — Shop info, photos, barbers list
- **Barber Selection** — Pick a barber
- **Service Selection** — Pick a service (filtered by barber)
- **Date/Time Picker** — Pick date, then available time slot
- **Confirmation** — Review and confirm booking

### Shop Owner (bottom tabs)

1. **Dashboard** — Today's appointments, quick stats (total bookings, cancellations)
2. **Calendar** — Full calendar view of all bookings across barbers
3. **Shop Management** — Edit shop info, address, photos, working hours
4. **Barbers** — Add/remove barbers, set individual schedules and services
5. **Profile** — Account settings, language toggle

---

## Database Schema (Supabase / PostgreSQL)

### profiles

| Column     | Type        | Notes                      |
| ---------- | ----------- | -------------------------- |
| id         | UUID (PK)   | From auth.users            |
| phone      | text        | Unique                     |
| full_name  | text        |                            |
| avatar_url | text        | Nullable                   |
| role       | text        | 'customer' \| 'shop_owner' |
| language   | text        | 'en' \| 'he'               |
| created_at | timestamptz |                            |
| updated_at | timestamptz |                            |

### shops

| Column          | Type                 | Notes               |
| --------------- | -------------------- | ------------------- |
| id              | UUID (PK)            |                     |
| owner_id        | UUID (FK → profiles) |                     |
| name            | text                 |                     |
| description     | text                 | Nullable            |
| address         | text                 |                     |
| latitude        | float8               | For map/distance    |
| longitude       | float8               | For map/distance    |
| phone           | text                 | Shop contact number |
| cover_image_url | text                 | Nullable            |
| is_active       | boolean              | Default true        |
| created_at      | timestamptz          |                     |
| updated_at      | timestamptz          |                     |

### barbers

| Column     | Type              | Notes        |
| ---------- | ----------------- | ------------ |
| id         | UUID (PK)         |              |
| shop_id    | UUID (FK → shops) |              |
| name       | text              |              |
| avatar_url | text              | Nullable     |
| bio        | text              | Nullable     |
| is_active  | boolean           | Default true |
| created_at | timestamptz       |              |
| updated_at | timestamptz       |              |

### services

| Column      | Type              | Notes        |
| ----------- | ----------------- | ------------ |
| id          | UUID (PK)         |              |
| shop_id     | UUID (FK → shops) |              |
| name        | text              |              |
| description | text              | Nullable     |
| duration    | integer           | In minutes   |
| price       | decimal           |              |
| is_active   | boolean           | Default true |
| created_at  | timestamptz       |              |
| updated_at  | timestamptz       |              |

### barber_services (join table)

| Column     | Type                 | Notes        |
| ---------- | -------------------- | ------------ |
| barber_id  | UUID (FK → barbers)  | Composite PK |
| service_id | UUID (FK → services) | Composite PK |

### working_hours

| Column       | Type                | Notes             |
| ------------ | ------------------- | ----------------- |
| id           | UUID (PK)           |                   |
| barber_id    | UUID (FK → barbers) |                   |
| day_of_week  | integer             | 0 (Sun) – 6 (Sat) |
| start_time   | time                |                   |
| end_time     | time                |                   |
| is_available | boolean             |                   |

### appointments

| Column           | Type                 | Notes                                                  |
| ---------------- | -------------------- | ------------------------------------------------------ |
| id               | UUID (PK)            |                                                        |
| customer_id      | UUID (FK → profiles) |                                                        |
| barber_id        | UUID (FK → barbers)  |                                                        |
| service_id       | UUID (FK → services) |                                                        |
| shop_id          | UUID (FK → shops)    |                                                        |
| appointment_date | date                 |                                                        |
| appointment_time | time                 |                                                        |
| status           | text                 | 'pending' \| 'confirmed' \| 'completed' \| 'cancelled' |
| notes            | text                 | Nullable, customer notes                               |
| created_at       | timestamptz          |                                                        |
| updated_at       | timestamptz          |                                                        |

### otp_codes

| Column     | Type        | Notes           |
| ---------- | ----------- | --------------- |
| id         | UUID (PK)   |                 |
| phone      | text        |                 |
| code       | text        | 6-digit code    |
| expires_at | timestamptz | 5-minute expiry |
| verified   | boolean     | Default false   |
| created_at | timestamptz |                 |

### push_tokens

| Column          | Type                 | Notes |
| --------------- | -------------------- | ----- |
| id              | UUID (PK)            |       |
| user_id         | UUID (FK → profiles) |       |
| expo_push_token | text                 |       |
| created_at      | timestamptz          |       |

### Key relationships

- A shop owner owns one shop (MVP; schema supports multiple for future expansion)
- A shop has many barbers and many services
- Barbers offer specific services (via barber_services)
- Each barber has their own working_hours schedule
- Appointments link: customer → barber → service → shop

### Entity Relationship Diagram

```
profiles (1)──────(N) shops
                       │
              ┌────────┼────────┐
              │        │        │
           (N)│     (N)│     (N)│
          barbers   services    │
              │        │        │
              └───(N:M)┘        │
           barber_services      │
              │                 │
           (N)│                 │
        working_hours           │
              │                 │
              └────────┬────────┘
                       │
profiles (1)────(N) appointments
```

- A **profile** (shop owner) has many **shops** (1 for MVP)
- A **shop** has many **barbers** and many **services**
- **Barbers** and **services** are linked N:M via **barber_services**
- Each **barber** has many **working_hours** entries (one per day)
- An **appointment** connects a **profile** (customer) to a **barber** + **service** + **shop**

### Table Purposes

| Table             | Purpose                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`        | Every app user (customer or shop owner). Created on first OTP verification. `role` determines which tab group they see. Links to Supabase Auth via `id`.   |
| `shops`           | Each listed barber shop. `latitude` + `longitude` power map view & distance sorting. `is_active` lets owner hide their shop temporarily.                   |
| `barbers`         | Individual barbers at a shop. NOT app users — managed entries (name, photo, bio). `is_active` enables soft-delete without losing history.                  |
| `services`        | What a shop offers (Haircut, Beard Trim, etc.). `duration` (minutes) calculates time slot length. `price` displayed during booking.                        |
| `barber_services` | Join table: which barbers can do which services. When customer picks a barber, they only see that barber's services.                                       |
| `working_hours`   | Each barber's weekly schedule. One row per barber per day (up to 7 rows). `start_time`/`end_time` define the availability window.                          |
| `appointments`    | The core booking record linking customer + barber + service + shop. Status lifecycle: `pending` → `confirmed` → `completed` (or `cancelled` at any point). |
| `otp_codes`       | Temporary auth codes (5-min expiry). Accessed only by Edge Functions, never directly by clients.                                                           |
| `push_tokens`     | Expo push notification tokens. One per device per user.                                                                                                    |

---

## Data Flow

### Customer Booking Flow

```
Customer opens Explore
    → Query: shops WHERE is_active = true
    → Sort by distance using (latitude, longitude) vs user's GPS

Customer taps a shop
    → Query: barbers WHERE shop_id = X AND is_active = true

Customer picks a barber
    → Query: services JOIN barber_services WHERE barber_id = Y AND is_active = true

Customer picks a service (e.g., Haircut, 30 min)
    → Query: working_hours WHERE barber_id = Y AND day_of_week = Z
    → Get start_time & end_time for that day

    → Query: appointments WHERE barber_id = Y AND appointment_date = Z
    → Get already-booked time slots

    → Generate available slots:
        Working hours: 09:00–17:00
        Service duration: 30 min
        Already booked: [09:00, 10:30, 14:00]
        Available: [09:30, 10:00, 11:00, 11:30, 12:00, ... ]

Customer confirms
    → INSERT into appointments (customer_id, barber_id, service_id, shop_id, date, time, status='pending')
    → Trigger push notification to shop owner
```

### Shop Owner Flow

```
Dashboard
    → Query: appointments JOIN barbers JOIN services
      WHERE shop_id = MY_SHOP AND appointment_date = TODAY
    → Show today's appointments with barber name, service, time, status

Calendar
    → Query: appointments WHERE shop_id = MY_SHOP
      AND appointment_date BETWEEN month_start AND month_end
    → Render on calendar grouped by date

Managing a booking
    → UPDATE appointments SET status = 'confirmed' WHERE id = X
    → Trigger push notification to customer
```

---

## Row Level Security (RLS)

Supabase RLS policies ensure users can only access what they should:

| Table             | Customer can...                        | Shop Owner can...                              |
| ----------------- | -------------------------------------- | ---------------------------------------------- |
| `profiles`        | Read/update own profile                | Read/update own profile                        |
| `shops`           | Read all active shops                  | CRUD own shop                                  |
| `barbers`         | Read active barbers of any shop        | CRUD barbers of own shop                       |
| `services`        | Read active services of any shop       | CRUD services of own shop                      |
| `barber_services` | Read all                               | CRUD for own shop's barbers                    |
| `working_hours`   | Read all                               | CRUD for own shop's barbers                    |
| `appointments`    | Read/create/cancel own appointments    | Read/update status for own shop's appointments |
| `push_tokens`     | Own tokens only                        | Own tokens only                                |
| `otp_codes`       | No direct access (Edge Functions only) | No direct access (Edge Functions only)         |

---

## Time Slot Collision Prevention

Two layers prevent double-booking the same barber:

**1. Application level:** Before showing time slots, the app queries existing appointments and filters them out.

**2. Database level:** A partial unique index rejects conflicting inserts:

```sql
-- Prevent double-booking: no two non-cancelled appointments
-- for the same barber at the same date + time
CREATE UNIQUE INDEX idx_unique_booking
ON appointments (barber_id, appointment_date, appointment_time)
WHERE status != 'cancelled';
```

If two customers tap "confirm" at the exact same moment, the database rejects the second insert.

---

## Database Indexes

```sql
-- Shop discovery (Explore screen)
CREATE INDEX idx_shops_active ON shops (is_active) WHERE is_active = true;
CREATE INDEX idx_shops_location ON shops (latitude, longitude) WHERE is_active = true;

-- Barbers by shop (Shop Detail screen)
CREATE INDEX idx_barbers_shop ON barbers (shop_id) WHERE is_active = true;

-- Services by shop (Service Selection)
CREATE INDEX idx_services_shop ON services (shop_id) WHERE is_active = true;

-- Barber-service lookup (filtered services after picking barber)
CREATE INDEX idx_barber_services_barber ON barber_services (barber_id);
CREATE INDEX idx_barber_services_service ON barber_services (service_id);

-- Working hours lookup (time slot generation)
CREATE INDEX idx_working_hours_barber_day ON working_hours (barber_id, day_of_week);

-- Appointment queries (the most queried table)
CREATE INDEX idx_appointments_barber_date ON appointments (barber_id, appointment_date)
  WHERE status != 'cancelled';
CREATE INDEX idx_appointments_customer ON appointments (customer_id, appointment_date DESC);
CREATE INDEX idx_appointments_shop_date ON appointments (shop_id, appointment_date)
  WHERE status != 'cancelled';

-- Double-booking prevention (unique constraint)
CREATE UNIQUE INDEX idx_unique_booking
  ON appointments (barber_id, appointment_date, appointment_time)
  WHERE status != 'cancelled';

-- Push token lookup
CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);

-- OTP lookup (auth flow)
CREATE INDEX idx_otp_phone ON otp_codes (phone, verified) WHERE verified = false;
```

| Index                          | Used by                | Purpose                                      |
| ------------------------------ | ---------------------- | -------------------------------------------- |
| `idx_shops_active`             | Explore screen         | Only scan active shops                       |
| `idx_shops_location`           | Map + distance sort    | Fast lat/lng lookups for nearby shops        |
| `idx_barbers_shop`             | Shop Detail            | List barbers for a specific shop             |
| `idx_services_shop`            | Service Selection      | List services for a specific shop            |
| `idx_barber_services_*`        | Service filtering      | Fast join when filtering services by barber  |
| `idx_working_hours_barber_day` | Time slot generation   | Barber's hours for a given day               |
| `idx_appointments_barber_date` | Time slot availability | Booked slots for a barber on a specific date |
| `idx_appointments_customer`    | Bookings tab           | Customer's appointments sorted by date       |
| `idx_appointments_shop_date`   | Dashboard + Calendar   | Shop owner's appointments by date            |
| `idx_unique_booking`           | Booking confirmation   | Prevents double-booking at database level    |
| `idx_push_tokens_user`         | Notifications          | Token lookup when sending a push             |
| `idx_otp_phone`                | Auth flow              | OTP lookup during verification               |

---

## Project Structure

```
barber-mobile/
├── app/                        # Expo Router (file-based routing)
│   ├── (auth)/                 # Auth screens
│   │   ├── welcome.tsx
│   │   ├── phone.tsx
│   │   ├── otp.tsx
│   │   ├── role-select.tsx
│   │   └── profile-setup.tsx
│   ├── (customer)/             # Customer tab group (NativeTabs)
│   │   ├── explore/
│   │   ├── bookings/
│   │   ├── favorites/
│   │   └── profile/
│   ├── (shop-owner)/           # Shop owner tab group (NativeTabs)
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── shop/
│   │   ├── barbers/
│   │   └── profile/
│   ├── booking/                # Booking flow stack (native-stack)
│   │   ├── [shopId]/
│   │   ├── barber/
│   │   ├── service/
│   │   ├── datetime/
│   │   └── confirm/
│   └── _layout.tsx             # Root layout
├── components/                 # Design system (Tamagui-based compound wrappers)
│   ├── index.ts                # Re-exports all components (@/components)
│   ├── Button/
│   │   ├── Button.tsx          # Wraps Tamagui → <Button>, <ButtonText>, <ButtonIcon>
│   │   └── index.ts
│   ├── Card/
│   │   ├── Card.tsx            # Wraps Tamagui Card primitives
│   │   └── index.ts
│   ├── Text/
│   │   ├── Text.tsx            # Wraps Tamagui Text with app typography
│   │   └── index.ts
│   ├── Input/
│   │   ├── Input.tsx           # Wraps Tamagui Input with validation styling
│   │   └── index.ts
│   └── ...                     # Other compound components
├── tamagui.config.ts           # Tamagui theme, tokens, fonts, media queries
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand stores
├── lib/                        # Supabase client, API helpers, utils
├── types/                      # TypeScript types
├── schemas/                    # Zod validation schemas
├── i18n/                       # Translations (en.json, he.json)
├── constants/                  # Colors, config
├── assets/                     # Images, fonts
└── supabase/
    ├── migrations/             # SQL schema migrations
    └── functions/              # Edge Functions (OTP, push notifications)
```

---

## Supabase Edge Functions

1. **send-otp** — Generates OTP, stores in `otp_codes`, calls SMS4Free API
2. **verify-otp** — Validates code, creates/finds user, returns session
3. **send-push-notification** — Sends push via Expo Push API (booking confirmations, reminders)

---

## Push Notifications

- **Expo Notifications** for cross-platform push
- Tokens stored in `push_tokens` table
- Notification triggers:
  - Booking confirmed (to customer)
  - Booking cancelled (to customer or shop owner)
  - Appointment reminder (e.g., 1 hour before)
  - New booking received (to shop owner)

---

## i18n & RTL

- **Languages:** English (LTR, default) + Hebrew (RTL)
- **Implementation:** i18next with `expo-localization` for device locale detection
- **RTL:** `I18nManager.forceRTL(true)` when Hebrew is selected
- **Translation files:** `i18n/en.json` and `i18n/he.json`
- Language toggle available in Profile screen for both roles

---

## Out of Scope (MVP)

- In-app payments (customers pay at the shop)
- Ratings and reviews
- Chat between customer and barber
- Multi-shop owner accounts (one owner = one shop for MVP)
- Social login (Google/Apple)
- Barber-specific app role (barbers are managed by shop owner)

---

## Verification Plan

1. **Auth flow:** Register with phone, receive OTP via SMS4Free, verify, select role, complete profile
2. **Customer flow:** Open Explore tab, see shops on map and in list, tap a shop, select barber → service → date/time → confirm booking. Check booking appears in Bookings tab.
3. **Shop owner flow:** Create shop with address, add barbers with schedules, add services, link services to barbers. Verify incoming booking appears in Dashboard and Calendar.
4. **Push notifications:** Book an appointment, verify shop owner receives "new booking" push. Verify customer receives confirmation push.
5. **RTL:** Switch language to Hebrew, verify entire app layout flips correctly.
6. **Edge cases:** Try booking an already-taken time slot (should be blocked). Try booking in the past (should be blocked).
7. **Cancel:** Cancel a booking and verify status updates for both sides, other party is notified.
8. **GPS fallback:** Deny location permission, verify manual city/area search still works.

---

## Related Documents

- **Implementation Plan:** `IMPLEMENTATION-PLAN.md`
- **Database Documentation:** `DATABASE.md`
