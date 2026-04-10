import { generateAvailableSlots, minutesToTime, timeToMinutes } from '@/lib/customer/slot-helpers';

describe('customer slot helpers', () => {
  it('converts HH:MM and HH:MM:SS to minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('09:30:00')).toBe(570);
  });

  it('converts minutes to HH:MM', () => {
    expect(minutesToTime(570)).toBe('09:30');
  });

  it('generates 15-minute slots for a single free window', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 30,
      workingWindows: [{ endMinutes: 600, startMinutes: 540 }],
    });

    expect(slots).toEqual(['09:00', '09:15', '09:30']);
  });

  it('skips slots that overlap an existing booking', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [{ endMinutes: 600, startMinutes: 570 }],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 30,
      workingWindows: [{ endMinutes: 660, startMinutes: 540 }],
    });

    expect(slots).toEqual(['09:00', '10:00', '10:15', '10:30']);
  });

  it('applies buffer time after booking end', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 15,
      existingBookings: [{ endMinutes: 600, startMinutes: 570 }],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 30,
      workingWindows: [{ endMinutes: 660, startMinutes: 540 }],
    });

    expect(slots).toEqual(['09:00', '10:15', '10:30']);
  });

  it('filters out past or current slots for today', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [],
      isToday: true,
      nowMinutes: 600,
      totalDurationMinutes: 30,
      workingWindows: [{ endMinutes: 660, startMinutes: 540 }],
    });

    expect(slots).toEqual(['10:15', '10:30']);
  });

  it('combines multiple working windows', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 30,
      workingWindows: [
        { endMinutes: 660, startMinutes: 540 },
        { endMinutes: 780, startMinutes: 720 },
      ],
    });

    expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '12:00', '12:15', '12:30']);
  });

  it('returns no slots when fully blocked', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [{ endMinutes: 600, startMinutes: 540 }],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 30,
      workingWindows: [{ endMinutes: 600, startMinutes: 540 }],
    });

    expect(slots).toEqual([]);
  });

  it('includes a slot that exactly fits at window end', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 45,
      workingWindows: [{ endMinutes: 600, startMinutes: 540 }],
    });

    expect(slots).toEqual(['09:00', '09:15']);
  });

  it('returns no slots when duration exceeds window length', () => {
    const slots = generateAvailableSlots({
      bufferMinutes: 0,
      existingBookings: [],
      isToday: false,
      nowMinutes: 0,
      totalDurationMinutes: 45,
      workingWindows: [{ endMinutes: 570, startMinutes: 540 }],
    });

    expect(slots).toEqual([]);
  });
});
