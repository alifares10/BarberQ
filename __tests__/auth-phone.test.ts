import { maskPhoneNumber, normalizePhoneNumber } from '@/lib/auth/phone';

describe('auth phone helpers', () => {
  it('normalizes spaced international phone numbers', () => {
    expect(normalizePhoneNumber('+972 50 123 4567')).toBe('+972501234567');
  });

  it('converts leading double zero numbers to plus format', () => {
    expect(normalizePhoneNumber('00972-50-123-4567')).toBe('+972501234567');
  });

  it('rejects incomplete phone numbers', () => {
    expect(normalizePhoneNumber('12345')).toBeNull();
  });

  it('masks the middle digits for OTP confirmation copy', () => {
    expect(maskPhoneNumber('+972501234567')).toBe('+972****67');
  });
});
