import type { ShopAppointment } from '@/lib/shop-owner/api';

export type RangeMode = 'month' | 'week';
export type RangeDirection = 'next' | 'previous';

type AppointmentStatusRecord = {
  status: string;
};

type AppointmentDateTimeRecord = {
  appointment_date: string;
  appointment_time: string;
};

const UPCOMING_STATUSES = new Set(['confirmed', 'pending']);

export function toIsoDate(dateValue: Date) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const date = String(dateValue.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}

export function normalizeTime(timeValue: string) {
  if (timeValue.length >= 5) {
    return timeValue.slice(0, 5);
  }

  return timeValue;
}

export function parseIsoDate(dateValue: string) {
  const [yearPart, monthPart, dayPart] = dateValue.split('-');
  const year = Number.parseInt(yearPart ?? '0', 10);
  const month = Number.parseInt(monthPart ?? '0', 10);
  const day = Number.parseInt(dayPart ?? '0', 10);

  return new Date(year, month - 1, day);
}

export function getDashboardStats<T extends AppointmentStatusRecord>(appointments: T[]) {
  let cancelled = 0;
  let upcoming = 0;

  for (const appointment of appointments) {
    if (appointment.status === 'cancelled') {
      cancelled += 1;
    }

    if (UPCOMING_STATUSES.has(appointment.status)) {
      upcoming += 1;
    }
  }

  return {
    cancelled,
    total: appointments.length,
    upcoming,
  };
}

export function startOfDay(dateValue: Date) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

export function addDays(dateValue: Date, days: number) {
  const nextDate = new Date(dateValue);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function startOfWeek(dateValue: Date) {
  const dayValue = dateValue.getDay();
  const delta = dayValue === 0 ? -6 : 1 - dayValue;

  return addDays(startOfDay(dateValue), delta);
}

export function startOfMonth(dateValue: Date) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), 1);
}

export function endOfMonth(dateValue: Date) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth() + 1, 0);
}

export function getRangeBounds(anchorDate: Date, mode: RangeMode) {
  if (mode === 'week') {
    const startDate = startOfWeek(anchorDate);

    return {
      endDate: addDays(startDate, 6),
      startDate,
    };
  }

  const startDate = startOfMonth(anchorDate);

  return {
    endDate: endOfMonth(anchorDate),
    startDate,
  };
}

export function moveRangeAnchor(anchorDate: Date, mode: RangeMode, direction: RangeDirection) {
  const delta = direction === 'next' ? 1 : -1;

  if (mode === 'week') {
    return addDays(anchorDate, delta * 7);
  }

  return new Date(anchorDate.getFullYear(), anchorDate.getMonth() + delta, 1);
}

export function groupAppointmentsByDate<T extends AppointmentDateTimeRecord>(appointments: T[]) {
  const groupedAppointments = new Map<string, T[]>();

  for (const appointment of appointments) {
    const currentItems = groupedAppointments.get(appointment.appointment_date) ?? [];

    currentItems.push(appointment);
    groupedAppointments.set(appointment.appointment_date, currentItems);
  }

  return Array.from(groupedAppointments.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([dateValue, dayAppointments]) => ({
      appointments: dayAppointments.sort((appointmentA, appointmentB) =>
        appointmentA.appointment_time.localeCompare(appointmentB.appointment_time)
      ),
      date: dateValue,
    }));
}

export function groupShopAppointmentsByDate(appointments: ShopAppointment[]) {
  return groupAppointmentsByDate(appointments);
}
