// @ts-nocheck

const PHONE_PATTERN = /^\+\d{8,15}$/;

export function normalizePhoneNumber(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const compactValue = trimmedValue.replace(/[\s()-]/g, '');
  const withCountryCode = compactValue.startsWith('00')
    ? `+${compactValue.slice(2)}`
    : compactValue.startsWith('+9720')
      ? `+972${compactValue.slice(5)}`
      : compactValue.startsWith('0')
        ? `+972${compactValue.slice(1)}`
        : compactValue;
  const normalizedValue = withCountryCode;
  const digitsOnly = normalizedValue.startsWith('+')
    ? `+${normalizedValue.slice(1).replace(/\D/g, '')}`
    : `+${normalizedValue.replace(/\D/g, '')}`;

  if (!PHONE_PATTERN.test(digitsOnly)) {
    return null;
  }

  return digitsOnly;
}

export function maskPhoneNumber(phone: string) {
  if (phone.length <= 6) {
    return phone;
  }

  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

export function toSms4FreeRecipient(phone: string) {
  if (phone.startsWith('+972')) {
    return `0${phone.slice(4)}`;
  }

  return phone.startsWith('+') ? phone.slice(1) : phone;
}
