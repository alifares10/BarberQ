# Product Requirements Document (PRD)
# BarberQ — Mobile Appointment Scheduling App

**Date:** April 3, 2026
**Status:** Pre-Development
**Platforms:** iOS & Android
**Languages:** English + Hebrew (RTL)

---

## 1. Product Overview

BarberQ is a mobile app that connects customers with barber shops. Customers discover nearby shops, choose a barber, pick a service, and book a time slot — all in under a minute. Shop owners manage their business from the same app: barbers, services, schedules, and incoming appointments.

One app. Two experiences. No phone calls needed.

---

## 2. Problem Statement

Booking a barber appointment today is friction-heavy:
- **Customers** call or walk in, hoping their preferred barber is available
- **Shop owners** manage schedules on paper, WhatsApp, or in their heads — leading to double-bookings and no-shows
- No visibility into availability before showing up

BarberQ eliminates this by giving customers real-time availability and shop owners a digital booking system.

---

## 3. Target Users

| Role | Who they are | What they need |
|------|-------------|----------------|
| **Customer** | Anyone looking for a haircut or grooming service | Find nearby shops, see availability, book instantly |
| **Shop Owner** | Barber shop owner/manager | Manage their shop, barbers, services, and appointments digitally |

Both roles exist in the same app. Role is selected during onboarding.

---

## 4. User Journeys

### 4.1 Customer Journey

```
Open App → Sign in with phone (OTP) → Select "Customer" role → Set up profile
    ↓
Explore Tab → See nearby shops on map + searchable list
    ↓
Tap a shop → View shop details, photos, barbers
    ↓
Pick a barber → See their available services
    ↓
Pick a service → See available dates & time slots
    ↓
Confirm booking → Receive push notification confirmation
    ↓
Bookings Tab → View upcoming & past appointments, cancel if needed
```

### 4.2 Shop Owner Journey

```
Open App → Sign in with phone (OTP) → Select "Shop Owner" role → Set up profile
    ↓
Create Shop → Name, address, phone, cover photo
    ↓
Add Barbers → Name, photo, bio for each barber
    ↓
Add Services → Haircut ($30, 30min), Beard Trim ($15, 15min), etc.
    ↓
Link Services to Barbers → "Barber A does Haircuts + Beard Trims"
    ↓
Set Working Hours → Per-barber weekly schedule
    ↓
Dashboard → See today's appointments, stats
    ↓
Calendar → Full month/week view of all bookings
    ↓
Manage Bookings → Confirm, complete, or cancel appointments
```

---

## 5. Features (MVP)

### 5.1 Authentication
- Phone number + SMS OTP verification (via SMS4Free)
- Role selection on first login (Customer / Shop Owner)
- Profile setup (name, avatar)

### 5.2 Customer Features

| Feature | Description |
|---------|-------------|
| **Shop Discovery** | Interactive map showing nearby shops + list view with search and filters |
| **Shop Details** | Shop info, cover photo, address, list of barbers |
| **Booking Flow** | Select barber → service → date → time slot → confirm |
| **My Bookings** | View upcoming appointments, past history, cancel bookings |
| **Favorites** | Save preferred shops for quick access *(stretch goal)* |
| **Language Toggle** | Switch between English and Hebrew (with full RTL support) |
| **Push Notifications** | Booking confirmations, reminders (1hr before), cancellation alerts |

### 5.3 Shop Owner Features

| Feature | Description |
|---------|-------------|
| **Shop Management** | Create/edit shop profile, address, photos, contact info |
| **Barber Management** | Add/edit/deactivate barbers with photos and bios |
| **Service Management** | Define services with name, description, duration, and price |
| **Barber-Service Linking** | Assign which services each barber can perform |
| **Working Hours** | Set per-barber weekly schedules (day, start/end time) |
| **Dashboard** | Today's appointments at a glance, quick stats |
| **Calendar View** | Full calendar of all bookings across all barbers |
| **Booking Management** | Confirm, complete, or cancel appointments |
| **Push Notifications** | Alerts for new bookings and cancellations |

---

## 6. Screens

### Auth Flow (5 screens)
1. **Welcome** — App intro / onboarding
2. **Phone Input** — Enter phone number
3. **OTP Verification** — Enter 6-digit code
4. **Role Selection** — Customer or Shop Owner
5. **Profile Setup** — Name, avatar

### Customer (4 tabs + booking stack)

**Bottom Tabs:**
1. **Explore** — Map + shop list with search/filter
2. **Bookings** — Upcoming and past appointments
3. **Favorites** — Saved shops *(stretch)*
4. **Profile** — Settings, language toggle

**Booking Stack (5 screens):**
1. Shop Detail → 2. Barber Selection → 3. Service Selection → 4. Date/Time Picker → 5. Confirmation

### Shop Owner (5 tabs)
1. **Dashboard** — Today's appointments, quick stats
2. **Calendar** — Month/week view of all bookings
3. **Shop Management** — Edit shop info, photos, address
4. **Barbers** — Manage barbers, schedules, services
5. **Profile** — Settings, language toggle

**Total: ~19 unique screens**

---

## 7. Data Model

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

### Tables

| Table | Purpose |
|-------|---------|
| **profiles** | Every app user. Links to auth system. Stores role (customer/shop_owner), language preference. |
| **shops** | Barber shop listings. Includes name, address, GPS coordinates (lat/lng), cover photo, active status. |
| **barbers** | Individual barbers at a shop. Name, photo, bio. NOT app users — managed by shop owner. |
| **services** | What a shop offers: Haircut, Beard Trim, etc. Includes duration (minutes) and price. |
| **barber_services** | Many-to-many: which barbers perform which services. |
| **working_hours** | Per-barber weekly schedule. One entry per day per barber (start time, end time, available flag). |
| **appointments** | The core booking record. Links customer + barber + service + shop + date/time. Status: pending → confirmed → completed (or cancelled). |
| **otp_codes** | Temporary auth codes with 5-minute expiry. |
| **push_tokens** | Device push notification tokens for each user. |

### Booking Data Flow

```
Customer opens Explore
    → Fetch active shops, sort by distance from GPS

Customer taps a shop
    → Fetch active barbers for that shop

Customer picks a barber
    → Fetch services linked to that barber (via barber_services)

Customer picks a service (e.g., Haircut, 30 min)
    → Fetch barber's working hours for selected date
    → Fetch existing appointments for that barber on that date
    → Generate available time slots (working hours minus booked slots, divided by service duration)

Customer confirms
    → Create appointment record (status: pending)
    → Send push notification to shop owner
```

### Double-Booking Prevention

Two layers of protection:
1. **App level** — already-booked slots are filtered out before display
2. **Database level** — a unique index rejects duplicate bookings at the same barber + date + time, even if two customers tap "confirm" simultaneously

---

## 8. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React Native + Expo SDK 52 | Cross-platform (iOS + Android), managed workflow, rich ecosystem |
| **Language** | TypeScript | Type safety, better developer experience |
| **Navigation** | Expo Router + NativeTabs | File-based routing, native performance |
| **UI Foundation** | Tamagui | Build-time style compilation, theming, RTL support |
| **UI Pattern** | Compound components | `<Button><ButtonText>` pattern, re-exported from `@/components` |
| **Server State** | TanStack Query v5 | Caching, background refetch, optimistic updates |
| **Local State** | Zustand | Lightweight store for booking flow and auth |
| **Backend** | Supabase | PostgreSQL + Auth + Storage + Edge Functions + Realtime |
| **SMS / OTP** | SMS4Free | Cost-effective SMS delivery for OTP |
| **Maps** | react-native-maps | Native map view for shop discovery |
| **Location** | expo-location | GPS for nearby shop sorting |
| **Images** | expo-image | Optimized caching, blurhash placeholders |
| **Lists** | FlashList / LegendList | Virtualized lists for smooth scrolling |
| **Push** | expo-notifications | Cross-platform push notifications |
| **Animations** | react-native-reanimated | GPU-accelerated, 60fps animations |
| **i18n** | i18next + expo-localization | English + Hebrew with RTL layout flipping |
| **Forms** | react-hook-form + zod | Validation with great performance |

---

## 9. Authentication

| Step | What happens |
|------|-------------|
| 1 | User enters phone number |
| 2 | Backend generates 6-digit OTP, stores it (5-min expiry), sends via SMS4Free |
| 3 | User enters OTP code |
| 4 | Backend verifies code, creates or finds user account, returns session |
| 5 | First-time users choose role (Customer / Shop Owner) and complete profile |
| 6 | App redirects to the correct tab group based on role |

No passwords. No email. Just phone + OTP.

---

## 10. Notifications

| Event | Who gets notified | Channel |
|-------|-------------------|---------|
| New booking created | Shop owner | Push |
| Booking confirmed | Customer | Push |
| Booking cancelled | The other party | Push |
| Appointment in 1 hour | Customer | Push |

---

## 11. Internationalization

| Language | Direction | Status |
|----------|-----------|--------|
| English | LTR | Default |
| Hebrew | RTL | Full support |

- Language toggle available in Profile screen
- Entire app layout flips when switching to Hebrew (RTL)
- Device locale auto-detected on first launch

---

## 12. Security

| Measure | Implementation |
|---------|---------------|
| **Row Level Security** | Supabase RLS policies on every table — users only access their own data |
| **OTP expiry** | Codes expire after 5 minutes |
| **No direct DB access** | OTP table accessed only by Edge Functions, never by client |
| **Session management** | Supabase Auth with secure token storage via AsyncStorage |
| **Double-booking** | Database-level unique index prevents concurrent conflicting bookings |

---

## 13. Out of Scope (MVP)

These features are intentionally excluded from v1 to keep scope manageable:

- In-app payments (customers pay at the shop)
- Ratings and reviews
- Chat between customer and barber
- Multiple shops per owner (one owner = one shop for MVP)
- Social login (Google/Apple)
- Barber-specific app login (barbers are managed entries, not users)

---

## 14. Implementation Phases

| Phase | What | Key Deliverables |
|-------|------|-----------------|
| **1. Scaffolding** | Project setup, dependencies, design system, i18n, Supabase client | Runnable Expo app with navigation and Tamagui |
| **2. Database** | All migrations, RLS policies, indexes, TypeScript types | Complete database ready for data |
| **3. Authentication** | OTP flow, Edge Functions, role selection, auth guards | Users can sign in and land on their role's tab group |
| **4. Shop Owner** | Shop/barber/service management, dashboard, calendar | Shop owners can set up and manage their business |
| **5. Customer** | Map discovery, search, booking flow, bookings history | Customers can find shops and book appointments |
| **6. Notifications** | Push token registration, Edge Function, triggers, reminders | Both sides receive real-time updates |
| **7. Polish** | RTL testing, loading/error/empty states, styling audit | Production-quality UX in both languages |

---

## 15. Success Metrics

| Metric | Target |
|--------|--------|
| Booking completion rate | > 70% of users who start the flow complete it |
| Time to book | < 60 seconds from opening the app |
| Shop owner setup time | < 5 minutes to create shop + add first barber + service |
| App crash rate | < 1% |
| Push notification delivery | > 95% |

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SMS4Free delivery failures | Users can't sign in | Implement retry logic, consider fallback SMS provider |
| GPS permission denied | Can't show nearby shops | Fallback to manual city/area search |
| Simultaneous bookings | Double-booked barber | Database unique index + app-level slot filtering |
| RTL layout bugs | Poor Hebrew UX | Dedicated RTL testing phase, Tamagui's built-in RTL support |
| Expo SDK limitations | Can't access native APIs | Managed workflow covers all our needs; can eject if necessary |

---

## 17. Project Structure

```
barber-mobile/
├── app/                        # Screens (Expo Router)
│   ├── (auth)/                 # Auth flow (5 screens)
│   ├── (customer)/             # Customer tabs (4 tabs)
│   ├── (shop-owner)/           # Shop owner tabs (5 tabs)
│   └── booking/                # Booking flow stack (5 screens)
├── components/                 # Design system (Tamagui compound wrappers)
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand state stores
├── lib/                        # Supabase client, utilities
├── types/                      # TypeScript types
├── schemas/                    # Zod validation schemas
├── i18n/                       # Translation files (en.json, he.json)
├── constants/                  # Colors, config
├── assets/                     # Images, fonts
├── tamagui.config.ts           # Theme, tokens, fonts
└── supabase/
    ├── migrations/             # Database schema
    └── functions/              # Edge Functions (OTP, push)
```

---

## 18. Related Documents

- **Design Spec:** `docs/superpowers/specs/2026-04-03-barber-mobile-app-design.md`
- **Implementation Plan:** `IMPLEMENTATION-PLAN.md`
- **Database Documentation:** `docs/DATABASE.md`
