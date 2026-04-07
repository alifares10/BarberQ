# BarberQ — Database Documentation

**Backend:** Supabase (PostgreSQL)
**Tables:** 12
**Auth:** Custom OTP via Edge Functions (not Supabase Phone Auth)

---

## 1. Entity Relationship Diagram

```
profiles (1)──────(N) shops
                       │
              ┌────────┼────────┐
              │        │     (N)│
           (N)│     (N)│  shop_closures
          barbers   services
              │        │
              └───(N:M)┘
           barber_services
              │
           (N)│
        working_hours
              │
           (N)│
   barber_unavailable_dates
              │
              └────────┬────────┘
                       │
profiles (1)────(N) appointments
                       │
                    (N:M)
               appointment_services
```

**Relationships:**

- A **profile** (shop owner) owns one **shop** (MVP; schema supports multiple for future expansion)
- A **shop** has many **barbers**, many **services**, and many **shop_closures**
- **Barbers** and **services** are linked N:M via **barber_services**
- Each **barber** has many **working_hours** entries (multiple per day allowed for breaks)
- Each **barber** has many **barber_unavailable_dates** (vacation, holidays, sick days)
- An **appointment** connects a **profile** (customer) to a **barber** + **shop**, with services linked via **appointment_services** (N:M)

---

## 2. Tables

### 2.1 profiles

Every app user — customer or shop owner. Created on first OTP verification. The `role` field determines which tab group they see. Links to Supabase Auth via `id` (same UUID as `auth.users.id`).

| Column     | Type        | Constraints              | Notes                          |
| ---------- | ----------- | ------------------------ | ------------------------------ |
| id         | UUID        | PK                       | From auth.users                |
| phone      | text        | UNIQUE, NOT NULL         | User's phone number            |
| full_name  | text        | NOT NULL                 | Display name                   |
| avatar_url | text        |                          | Nullable, profile photo URL    |
| role       | text        | NOT NULL                 | `'customer'` \| `'shop_owner'` |
| language   | text        | NOT NULL, DEFAULT `'en'` | `'en'` \| `'he'`               |
| created_at | timestamptz | NOT NULL, DEFAULT now()  |                                |
| updated_at | timestamptz | NOT NULL, DEFAULT now()  |                                |

---

### 2.2 shops

Each listed barber shop. `latitude` + `longitude` power the map view and distance sorting for customers. `is_active` lets the owner temporarily hide their shop from the Explore screen.

| Column                    | Type        | Constraints                   | Notes                                     |
| ------------------------- | ----------- | ----------------------------- | ----------------------------------------- |
| id                        | UUID        | PK, DEFAULT gen_random_uuid() |                                           |
| owner_id                  | UUID        | FK → profiles(id), NOT NULL   | Shop owner                                |
| name                      | text        | NOT NULL                      | Shop display name                         |
| description               | text        |                               | Nullable                                  |
| address                   | text        | NOT NULL                      | Full address string                       |
| latitude                  | float8      | NOT NULL                      | GPS latitude for map/distance             |
| longitude                 | float8      | NOT NULL                      | GPS longitude for map/distance            |
| phone                     | text        | NOT NULL                      | Shop contact number                       |
| cover_image_url           | text        |                               | Nullable, Supabase Storage URL            |
| is_active                 | boolean     | NOT NULL, DEFAULT true        | Hide/show shop                            |
| buffer_minutes            | integer     | NOT NULL, DEFAULT 0           | Cleanup time after each appointment (min) |
| cancellation_window_hours | integer     |                               | Nullable, NULL = no restriction           |
| created_at                | timestamptz | NOT NULL, DEFAULT now()       |                                           |
| updated_at                | timestamptz | NOT NULL, DEFAULT now()       |                                           |

---

### 2.3 barbers

Individual barbers working at a shop. These are NOT app users — they are entries managed by the shop owner (name, photo, bio). `is_active` enables soft-delete without losing appointment history.

| Column     | Type        | Constraints                   | Notes                             |
| ---------- | ----------- | ----------------------------- | --------------------------------- |
| id         | UUID        | PK, DEFAULT gen_random_uuid() |                                   |
| shop_id    | UUID        | FK → shops(id), NOT NULL      | Which shop this barber belongs to |
| name       | text        | NOT NULL                      | Barber's display name             |
| avatar_url | text        |                               | Nullable, photo URL               |
| bio        | text        |                               | Nullable, short description       |
| is_active  | boolean     | NOT NULL, DEFAULT true        | Soft-delete flag                  |
| created_at | timestamptz | NOT NULL, DEFAULT now()       |                                   |
| updated_at | timestamptz | NOT NULL, DEFAULT now()       |                                   |

---

### 2.4 services

What a shop offers (Haircut, Beard Trim, etc.). `duration` in minutes is used to calculate time slot length when generating availability. `price` is displayed to the customer during the booking flow.

| Column      | Type        | Constraints                   | Notes                  |
| ----------- | ----------- | ----------------------------- | ---------------------- |
| id          | UUID        | PK, DEFAULT gen_random_uuid() |                        |
| shop_id     | UUID        | FK → shops(id), NOT NULL      | Which shop offers this |
| name        | text        | NOT NULL                      | Service name           |
| description | text        |                               | Nullable               |
| duration    | integer     | NOT NULL                      | Duration in minutes    |
| price       | decimal     | NOT NULL                      | Price amount           |
| is_active   | boolean     | NOT NULL, DEFAULT true        | Soft-delete flag       |
| created_at  | timestamptz | NOT NULL, DEFAULT now()       |                        |
| updated_at  | timestamptz | NOT NULL, DEFAULT now()       |                        |

---

### 2.5 barber_services (join table)

Many-to-many relationship: which barbers can perform which services. When a customer picks a barber, they only see that barber's services.

Example: "Barber A does Haircuts + Beard Trims, Barber B only does Haircuts"

| Column     | Type | Constraints                 | Notes        |
| ---------- | ---- | --------------------------- | ------------ |
| barber_id  | UUID | FK → barbers(id), NOT NULL  | Composite PK |
| service_id | UUID | FK → services(id), NOT NULL | Composite PK |

**Primary Key:** `(barber_id, service_id)`

---

### 2.6 working_hours

Each barber's weekly schedule. Multiple rows per barber per day are allowed to support breaks (e.g., 09:00–13:00 morning + 14:00–17:00 afternoon = lunch break). `start_time` / `end_time` define each availability window. `is_available = false` means that time window is inactive.

| Column       | Type    | Constraints                   | Notes             |
| ------------ | ------- | ----------------------------- | ----------------- |
| id           | UUID    | PK, DEFAULT gen_random_uuid() |                   |
| barber_id    | UUID    | FK → barbers(id), NOT NULL    | Which barber      |
| day_of_week  | integer | NOT NULL                      | 0 (Sun) – 6 (Sat) |
| start_time   | time    | NOT NULL                      | Work day starts   |
| end_time     | time    | NOT NULL                      | Work day ends     |
| is_available | boolean | NOT NULL, DEFAULT true        | Open or closed    |

---

### 2.7 appointments

The core booking record. Links everything together: customer + barber + shop, with services linked via `appointment_services`. `appointment_date` and `appointment_time` are separate fields to make querying by date easier. `end_time` is computed at insert time as `appointment_time + SUM(service durations)` and used for overlap detection.

**Status lifecycle:** `pending` → `confirmed` → `completed` (or `cancelled` at any point)

| Column           | Type        | Constraints                   | Notes                                                          |
| ---------------- | ----------- | ----------------------------- | -------------------------------------------------------------- |
| id               | UUID        | PK, DEFAULT gen_random_uuid() |                                                                |
| customer_id      | UUID        | FK → profiles(id), NOT NULL   | Who booked                                                     |
| barber_id        | UUID        | FK → barbers(id), NOT NULL    | Which barber                                                   |
| shop_id          | UUID        | FK → shops(id), NOT NULL      | Which shop                                                     |
| appointment_date | date        | NOT NULL                      | Booking date                                                   |
| appointment_time | time        | NOT NULL                      | Booking start time                                             |
| end_time         | time        | NOT NULL                      | appointment_time + SUM(service durations), computed at insert  |
| status           | text        | NOT NULL, DEFAULT `'pending'` | `'pending'` \| `'confirmed'` \| `'completed'` \| `'cancelled'` |
| notes            | text        |                               | Nullable, customer notes                                       |
| created_at       | timestamptz | NOT NULL, DEFAULT now()       |                                                                |
| updated_at       | timestamptz | NOT NULL, DEFAULT now()       |                                                                |

---

### 2.8 otp_codes

Temporary authentication codes with 5-minute expiry. Accessed only by Supabase Edge Functions (`send-otp`, `verify-otp`), never directly by clients. Should be cleaned up periodically.

| Column     | Type        | Constraints                   | Notes                            |
| ---------- | ----------- | ----------------------------- | -------------------------------- |
| id         | UUID        | PK, DEFAULT gen_random_uuid() |                                  |
| phone      | text        | NOT NULL                      | Phone number the OTP was sent to |
| code       | text        | NOT NULL                      | 6-digit code                     |
| expires_at | timestamptz | NOT NULL                      | 5 minutes after creation         |
| verified   | boolean     | NOT NULL, DEFAULT false       | Marked true once used            |
| created_at | timestamptz | NOT NULL, DEFAULT now()       |                                  |

---

### 2.9 push_tokens

Expo push notification tokens for each user. One entry per device — a user could have multiple devices.

| Column          | Type        | Constraints                   | Notes                  |
| --------------- | ----------- | ----------------------------- | ---------------------- |
| id              | UUID        | PK, DEFAULT gen_random_uuid() |                        |
| user_id         | UUID        | FK → profiles(id), NOT NULL   | Token owner            |
| expo_push_token | text        | NOT NULL                      | Expo push token string |
| created_at      | timestamptz | NOT NULL, DEFAULT now()       |                        |

---

### 2.10 barber_unavailable_dates

Specific dates a barber is unavailable (vacation, holidays, sick days). The slot generation logic checks this table before generating time slots — if an entry exists for the barber on the selected date, no slots are shown.

| Column     | Type        | Constraints                   | Notes                                   |
| ---------- | ----------- | ----------------------------- | --------------------------------------- |
| id         | UUID        | PK, DEFAULT gen_random_uuid() |                                         |
| barber_id  | UUID        | FK → barbers(id), NOT NULL    | Which barber is unavailable             |
| date       | date        | NOT NULL                      | The specific date                       |
| reason     | text        |                               | Nullable: 'vacation', 'holiday', 'sick' |
| created_at | timestamptz | NOT NULL, DEFAULT now()       |                                         |

**Unique constraint:** `(barber_id, date)` — one entry per barber per date.

---

### 2.11 shop_closures

Specific dates the entire shop is closed (holidays, renovation, emergency). The slot generation logic checks this table before barber-level availability — if the shop is closed on the selected date, no barbers are available.

| Column     | Type        | Constraints                   | Notes                                          |
| ---------- | ----------- | ----------------------------- | ---------------------------------------------- |
| id         | UUID        | PK, DEFAULT gen_random_uuid() |                                                |
| shop_id    | UUID        | FK → shops(id), NOT NULL      | Which shop is closed                           |
| date       | date        | NOT NULL                      | The specific date                              |
| reason     | text        |                               | Nullable: 'holiday', 'renovation', 'emergency' |
| created_at | timestamptz | NOT NULL, DEFAULT now()       |                                                |

**Unique constraint:** `(shop_id, date)` — one entry per shop per date.

---

### 2.12 appointment_services (join table)

Many-to-many relationship: which services are included in an appointment. Supports multiple services per booking (e.g., Haircut + Beard Trim). Total duration and price are computed from the linked services.

| Column         | Type | Constraints                                       | Notes        |
| -------------- | ---- | ------------------------------------------------- | ------------ |
| appointment_id | UUID | FK → appointments(id) ON DELETE CASCADE, NOT NULL | Composite PK |
| service_id     | UUID | FK → services(id), NOT NULL                       | Composite PK |

**Primary Key:** `(appointment_id, service_id)`

---

## 3. Data Flow

### 3.1 Customer Booking Flow

```
Customer opens Explore
    → Query: shops WHERE is_active = true
    → Sort by distance using (latitude, longitude) vs user's GPS

Customer taps a shop
    → Query: barbers WHERE shop_id = X AND is_active = true

Customer picks a barber
    → Query: services JOIN barber_services WHERE barber_id = Y AND is_active = true

Customer picks services (multiple allowed, e.g., Haircut 30 min + Beard Trim 15 min = 45 min total)
    → Total duration = SUM(service.duration for each selected)

Customer picks a date
    → Query: shop_closures WHERE shop_id = X AND date = Z
    → If entry exists → show "Shop closed on this date"

    → Query: barber_unavailable_dates WHERE barber_id = Y AND date = Z
    → If entry exists → show "Barber unavailable on this date"

    → Query: working_hours WHERE barber_id = Y AND day_of_week = Z AND is_available = true
    → Get all time windows for that day (multiple rows = breaks supported)

    → Query: appointments WHERE barber_id = Y AND appointment_date = Z AND status != 'cancelled'
    → Get already-booked time ranges (appointment_time → end_time + shop.buffer_minutes)

    → Generate available slots:
        Time windows: [09:00–13:00, 14:00–17:00]  (lunch break built in)
        Total duration: 45 min (sum of selected services)
        Buffer: shop.buffer_minutes (e.g., 10 min)
        Slot step: 15 min

        For each time window:
          slot_start = window.start_time
          While slot_start + duration ≤ window.end_time:
            If [slot_start, slot_start + duration] doesn't overlap any [booking.start, booking.end + buffer]:
              Add slot_start to available list
            slot_start += 15 min

Customer confirms
    → INSERT into appointments (customer_id, barber_id, shop_id, date, time, end_time, status='pending')
    → INSERT into appointment_services (appointment_id, service_id) for each selected service
    → Trigger push notification to shop owner
```

### 3.2 Shop Owner Flow

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

### 3.3 OTP Authentication Flow

```
User enters phone number
    → Edge Function (send-otp):
        1. Generate random 6-digit code
        2. INSERT into otp_codes (phone, code, expires_at = now() + 5min)
        3. Call SMS4Free API to deliver SMS
        4. Return success/failure

User enters OTP code
    → Edge Function (verify-otp):
        1. SELECT from otp_codes WHERE phone = X AND code = Y AND verified = false AND expires_at > now()
        2. If found: UPDATE otp_codes SET verified = true
        3. Find or create user in auth.users + profiles
        4. Return session token
```

---

## 4. Row Level Security (RLS)

Every table has RLS enabled. Policies ensure users can only access data they should:

| Table                      | Customer                                                                                  | Shop Owner                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `profiles`                 | SELECT/UPDATE own row                                                                     | SELECT/UPDATE own row                                                  |
| `shops`                    | SELECT WHERE is_active = true                                                             | SELECT/INSERT/UPDATE/DELETE own shop (WHERE owner_id = auth.uid())     |
| `barbers`                  | SELECT WHERE is_active = true                                                             | Full CRUD on own shop's barbers (WHERE shop_id IN own shops)           |
| `services`                 | SELECT WHERE is_active = true                                                             | Full CRUD on own shop's services (WHERE shop_id IN own shops)          |
| `barber_services`          | SELECT all                                                                                | Full CRUD for own shop's barbers                                       |
| `working_hours`            | SELECT all                                                                                | Full CRUD for own shop's barbers                                       |
| `appointments`             | SELECT/INSERT own (WHERE customer_id = auth.uid()), UPDATE own status to 'cancelled' only | SELECT/UPDATE for own shop's appointments (WHERE shop_id IN own shops) |
| `appointment_services`     | SELECT own appointment's services                                                         | SELECT own shop's appointment services                                 |
| `barber_unavailable_dates` | SELECT all                                                                                | Full CRUD for own shop's barbers                                       |
| `shop_closures`            | SELECT all                                                                                | Full CRUD for own shop (WHERE shop_id IN own shops)                    |
| `push_tokens`              | SELECT/INSERT/DELETE own (WHERE user_id = auth.uid())                                     | SELECT/INSERT/DELETE own (WHERE user_id = auth.uid())                  |
| `otp_codes`                | No direct access                                                                          | No direct access                                                       |

**Note:** `otp_codes` has no RLS policies granting client access. Only Supabase Edge Functions (using the service role key) can read/write this table.

---

## 5. Indexes

### 5.1 SQL Definitions

```sql
-- ============================================
-- SHOP DISCOVERY (Explore screen)
-- ============================================
-- Filter to active shops only
CREATE INDEX idx_shops_active
  ON shops (is_active)
  WHERE is_active = true;

-- Fast lat/lng lookups for nearby shop sorting
CREATE INDEX idx_shops_location
  ON shops (latitude, longitude)
  WHERE is_active = true;

-- ============================================
-- BARBER & SERVICE LOOKUPS
-- ============================================
-- List barbers for a specific shop
CREATE INDEX idx_barbers_shop
  ON barbers (shop_id)
  WHERE is_active = true;

-- List services for a specific shop
CREATE INDEX idx_services_shop
  ON services (shop_id)
  WHERE is_active = true;

-- Fast join when filtering services by barber
CREATE INDEX idx_barber_services_barber
  ON barber_services (barber_id);

CREATE INDEX idx_barber_services_service
  ON barber_services (service_id);

-- ============================================
-- WORKING HOURS (Time slot generation)
-- ============================================
-- Barber's hours for a given day
CREATE INDEX idx_working_hours_barber_day
  ON working_hours (barber_id, day_of_week);

-- ============================================
-- APPOINTMENTS (Most queried table)
-- ============================================
-- Booked slots for a barber on a specific date (time slot availability)
CREATE INDEX idx_appointments_barber_date
  ON appointments (barber_id, appointment_date)
  WHERE status != 'cancelled';

-- Customer's appointments sorted by date (Bookings tab)
CREATE INDEX idx_appointments_customer
  ON appointments (customer_id, appointment_date DESC);

-- Shop owner's appointments by date (Dashboard + Calendar)
CREATE INDEX idx_appointments_shop_date
  ON appointments (shop_id, appointment_date)
  WHERE status != 'cancelled';

-- ============================================
-- DOUBLE-BOOKING PREVENTION (exclusion constraint)
-- ============================================
-- Requires: CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE appointments ADD CONSTRAINT no_overlapping_bookings
--   EXCLUDE USING gist (
--     barber_id WITH =,
--     appointment_date WITH =,
--     tsrange(appointment_date + appointment_time, appointment_date + end_time) WITH &&
--   ) WHERE (status != 'cancelled');

-- ============================================
-- BARBER UNAVAILABLE DATES
-- ============================================
CREATE UNIQUE INDEX idx_barber_unavailable
  ON barber_unavailable_dates (barber_id, date);

-- ============================================
-- SHOP CLOSURES
-- ============================================
CREATE UNIQUE INDEX idx_shop_closures
  ON shop_closures (shop_id, date);

-- ============================================
-- APPOINTMENT SERVICES
-- ============================================
CREATE INDEX idx_appointment_services_appointment
  ON appointment_services (appointment_id);

CREATE INDEX idx_appointment_services_service
  ON appointment_services (service_id);

-- ============================================
-- AUTH & PUSH
-- ============================================
-- Push token lookup when sending notifications
CREATE INDEX idx_push_tokens_user
  ON push_tokens (user_id);

-- OTP lookup during verification
CREATE INDEX idx_otp_phone
  ON otp_codes (phone, verified)
  WHERE verified = false;
```

### 5.2 Index Reference

| Index                          | Used by                | Purpose                                        |
| ------------------------------ | ---------------------- | ---------------------------------------------- |
| `idx_shops_active`             | Explore screen         | Only scan active shops                         |
| `idx_shops_location`           | Map + distance sort    | Fast lat/lng lookups for nearby shops          |
| `idx_barbers_shop`             | Shop Detail            | List barbers for a specific shop               |
| `idx_services_shop`            | Service Selection      | List services for a specific shop              |
| `idx_barber_services_barber`   | Service filtering      | Fast join: barber → services                   |
| `idx_barber_services_service`  | Service filtering      | Fast join: service → barbers                   |
| `idx_working_hours_barber_day` | Time slot generation   | Barber's hours for a given day                 |
| `idx_appointments_barber_date` | Time slot availability | Booked slots for a barber on a specific date   |
| `idx_appointments_customer`    | Bookings tab           | Customer's appointments sorted by date         |
| `idx_appointments_shop_date`   | Dashboard + Calendar   | Shop owner's appointments by date              |
| `no_overlapping_bookings`      | Booking confirmation   | Prevents overlapping bookings (GiST exclusion) |
| `idx_barber_unavailable`       | Time slot generation   | Check if barber is off on a specific date      |
| `idx_shop_closures`            | Time slot generation   | Check if shop is closed on a specific date     |
| `idx_appointment_services_*`   | Booking detail         | Services linked to an appointment              |
| `idx_push_tokens_user`         | Notifications          | Token lookup when sending a push               |
| `idx_otp_phone`                | Auth flow              | OTP lookup during verification                 |

---

## 6. Double-Booking Prevention

Two layers prevent booking the same barber at the same time:

### Layer 1: Application Level

Before showing time slots, the app queries existing appointments (with their `end_time`) and filters out any slots whose time range would overlap with an existing booking. Users never see an unavailable time.

### Layer 2: Database Level

A GiST exclusion constraint rejects overlapping inserts — not just exact same-time collisions, but any time range overlap. This handles variable-duration services correctly (e.g., a 60-min haircut at 09:00 blocks a 30-min trim at 09:30):

```sql
-- Required extension for exclusion constraints with non-GiST types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping bookings for the same barber on the same date
ALTER TABLE appointments ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    barber_id WITH =,
    appointment_date WITH =,
    tsrange(
      appointment_date + appointment_time,
      appointment_date + end_time
    ) WITH &&
  )
  WHERE (status != 'cancelled');
```

The second insert receives an exclusion constraint violation error. The app catches this and shows "This time slot was just booked — please pick another."

---

## 7. Supabase Edge Functions

| Function                 | Trigger                  | What it does                                                                               |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------ |
| `send-otp`               | User enters phone number | Generates 6-digit code, stores in `otp_codes` (5-min expiry), calls SMS4Free API           |
| `verify-otp`             | User enters OTP code     | Validates code against `otp_codes`, creates/finds user in auth + profiles, returns session |
| `send-push-notification` | Booking events           | Looks up user's Expo push token from `push_tokens`, sends push via Expo Push API           |

All Edge Functions use the **Supabase service role key** to bypass RLS for administrative operations.

---

## 8. Appointment Status Lifecycle

```
                    ┌─────────────┐
                    │   pending   │ ← Customer creates booking
                    └──────┬──────┘
                           │
                    Shop owner confirms
                           │
                    ┌──────▼──────┐
                    │  confirmed  │
                    └──────┬──────┘
                           │
                    Appointment completed
                           │
                    ┌──────▼──────┐
                    │  completed  │
                    └─────────────┘

    At any point:
                    ┌─────────────┐
            ───────►│  cancelled  │ ← Customer or shop owner cancels
                    └─────────────┘
```

| Status      | Set by                       | Meaning                          |
| ----------- | ---------------------------- | -------------------------------- |
| `pending`   | System (on booking creation) | Awaiting shop owner confirmation |
| `confirmed` | Shop owner                   | Appointment is confirmed         |
| `completed` | Shop owner                   | Service was delivered            |
| `cancelled` | Customer or shop owner       | Appointment was cancelled        |

---

## 9. Related Documents

- **Root Plan / Design Spec:** `plan.md`
- **Implementation Plan:** `IMPLEMENTATION-PLAN.md`
