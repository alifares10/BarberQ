# BarberQ

Barber appointment scheduling mobile app built with Expo, React Native, and Supabase.

## Environment Setup

### App runtime (`.env.local`)

The Expo app reads these variables directly:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Function secrets

The OTP functions do **not** read SMS credentials from the Expo app runtime. They read secrets from the Supabase Edge Function runtime.

Set these secrets for `send-otp` and `verify-otp`:

```bash
supabase secrets set \
  SMS4FREE_API_KEY=your-api-key \
  SMS4FREE_USER=05xxxxxxxx \
  SMS4FREE_PASS=your-sms4free-password \
  SMS4FREE_SENDER=BarberQ \
  SMS4FREE_SEND_URL=https://api.sms4free.co.il/ApiSMS/v2/SendSMS
```

Notes:
- `SMS4FREE_SEND_URL` should be the full SMS4Free send endpoint.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are also required by the functions. On hosted Supabase they are available in the function runtime; when running locally, provide them through the Supabase CLI local environment.

### Deploy functions

```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

## Verification

Run the project checks after auth or backend changes:

```bash
npx expo lint
npx tsc --noEmit
npx jest
npx expo export
```
