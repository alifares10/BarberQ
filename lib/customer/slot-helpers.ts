const SLOT_STEP_MINUTES = 15;

export type TimeWindow = {
  endMinutes: number;
  startMinutes: number;
};

export type ExistingBooking = {
  endMinutes: number;
  startMinutes: number;
};

export type GenerateAvailableSlotsParams = {
  bufferMinutes: number;
  existingBookings: ExistingBooking[];
  isToday: boolean;
  nowMinutes: number;
  totalDurationMinutes: number;
  workingWindows: TimeWindow[];
};

export function timeToMinutes(time: string) {
  const [hoursPart, minutesPart] = time.split(':');
  const hours = Number.parseInt(hoursPart ?? '', 10);
  const minutes = Number.parseInt(minutesPart ?? '', 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time format: "${time}"`);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Time value out of range: "${time}"`);
  }

  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number) {
  if (!Number.isFinite(minutes)) {
    throw new Error('Minutes value must be a finite number.');
  }

  const normalizedMinutes = ((Math.trunc(minutes) % 1_440) + 1_440) % 1_440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minuteValue = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')}`;
}

function hasOverlap({
  booking,
  bufferMinutes,
  slotEnd,
  slotStart,
}: {
  booking: ExistingBooking;
  bufferMinutes: number;
  slotEnd: number;
  slotStart: number;
}) {
  const bookingEndWithBuffer = booking.endMinutes + bufferMinutes;

  return slotStart < bookingEndWithBuffer && slotEnd > booking.startMinutes;
}

export function generateAvailableSlots({
  bufferMinutes,
  existingBookings,
  isToday,
  nowMinutes,
  totalDurationMinutes,
  workingWindows,
}: GenerateAvailableSlotsParams) {
  if (totalDurationMinutes <= 0) {
    return [];
  }

  const availableSlots = new Set<number>();
  const sortedWindows = [...workingWindows].sort((windowA, windowB) => windowA.startMinutes - windowB.startMinutes);

  for (const window of sortedWindows) {
    const latestSlotStart = window.endMinutes - totalDurationMinutes;

    for (let slotStart = window.startMinutes; slotStart <= latestSlotStart; slotStart += SLOT_STEP_MINUTES) {
      if (isToday && slotStart <= nowMinutes) {
        continue;
      }

      const slotEnd = slotStart + totalDurationMinutes;
      const isBlocked = existingBookings.some((booking) =>
        hasOverlap({
          booking,
          bufferMinutes,
          slotEnd,
          slotStart,
        })
      );

      if (!isBlocked) {
        availableSlots.add(slotStart);
      }
    }
  }

  return Array.from(availableSlots)
    .sort((slotA, slotB) => slotA - slotB)
    .map((slot) => minutesToTime(slot));
}
