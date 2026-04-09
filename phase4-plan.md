# Phase 4 Plan - Shop Owner Flow

## Decision
- Calendar style: **list-based month/week ranges grouped by day** (no new calendar dependency in Phase 4).

## Why Slice-by-Slice
- Reduces integration risk in a large phase.
- Gives clear, testable milestones.
- Keeps Supabase + UI + routing changes isolated.
- Easier rollback/debug if any slice fails checks.

## Scope
Implement all Phase 4 items in `IMPLEMENTATION-PLAN.md`:
1. Shop Management
2. Barbers
3. Services
4. Barber-Services linking
5. Working Hours
6. Time-Off
7. Shop Closures
8. Dashboard
9. Calendar

## Implementation Strategy (Vertical Slices)

### Slice 1 - Shop Foundation
- Build `app/(shop-owner)/shop.tsx`:
  - Create/edit shop profile: name, address, phone, description
  - Cover image upload (expo-image + Supabase Storage)
  - `buffer_minutes` and `cancellation_window_hours`
  - Address geocoding -> lat/lng
- Add data hooks + mutations for shop CRUD and media upload.
- DoD:
  - Owner can create/update shop
  - Validation and error states work
  - Data persists and reloads correctly

### Slice 2 - Team + Services Hub
- Expand `app/(shop-owner)/barbers.tsx` into management hub:
  - Barbers CRUD + activate/deactivate
  - Services CRUD + activate/deactivate
  - Link/unlink services per barber (`barber_services`)
- Use virtualized lists (FlashList) for barbers/services.
- DoD:
  - Owner can manage barbers/services end-to-end
  - Assignments persist and re-render immediately

### Slice 3 - Availability Management
- Working Hours editor:
  - Per barber, per day, multiple windows/day
- Barber Time-Off (`barber_unavailable_dates`)
- Shop Closures (`shop_closures`)
- Handle uniqueness conflicts cleanly (duplicate date entries).
- DoD:
  - All availability data can be created/edited/deleted
  - Multi-window schedule works as intended

### Slice 4 - Operational Views
- Dashboard `app/(shop-owner)/index.tsx`:
  - Today's appointments list (virtualized)
  - Quick stats (total bookings, upcoming, cancellations)
- Calendar `app/(shop-owner)/calendar.tsx`:
  - Date-range queries (week/month)
  - Group appointments by date in list sections
- DoD:
  - Live appointment data visible and role-restricted
  - Filters/range switching works

### Slice 5 - Hardening + Phase Closure
- Loading/empty/error states across all owner screens
- EN/HE translations for new copy
- Basic tests for core owner flows and data helpers
- Run full verification:
  - `npx expo lint`
  - `npx tsc --noEmit`
  - `npx jest`
  - `npx expo export`
- Mark Phase 4 items as `[x]` in `IMPLEMENTATION-PLAN.md` once all pass.

## Data/Architecture Notes
- Keep all Supabase calls in dedicated shop-owner data layer (hooks/api module), not inline in screens.
- Keep all UI imports from `@/components` only.
- Use native `Modal` forms for create/edit interactions.
- Preserve auth/role guards already present in owner tab layout.

## Risks & Mitigation
- Large combined surface area -> strict slice boundaries + per-slice checks.
- Availability complexity -> start with strict validations and deterministic sorting.
- Calendar scope creep -> keep Phase 4 calendar list-based only.

## Execution Cadence
For each slice:
1. Implement
2. Smoke test feature manually
3. Run lint + typecheck
4. Fix issues before moving on
5. Wait for your input before continuing to the next slice

At end of Slice 5:
- Run full 4-command verification and close phase.
