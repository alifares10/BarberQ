import {
  getDashboardStats,
  getRangeBounds,
  groupAppointmentsByDate,
  moveRangeAnchor,
  normalizeTime,
  toIsoDate,
} from '@/lib/shop-owner/appointments-helpers';

describe('shop owner appointment helpers', () => {
  it('formats dates as YYYY-MM-DD', () => {
    const value = new Date(2026, 3, 9);

    expect(toIsoDate(value)).toBe('2026-04-09');
  });

  it('normalizes HH:MM:SS values to HH:MM', () => {
    expect(normalizeTime('09:30:00')).toBe('09:30');
    expect(normalizeTime('17:05')).toBe('17:05');
  });

  it('calculates dashboard stats from appointment statuses', () => {
    const stats = getDashboardStats([
      { status: 'pending' },
      { status: 'confirmed' },
      { status: 'completed' },
      { status: 'cancelled' },
    ]);

    expect(stats).toEqual({
      cancelled: 1,
      total: 4,
      upcoming: 2,
    });
  });

  it('returns week range bounds from Monday through Sunday', () => {
    const bounds = getRangeBounds(new Date(2026, 3, 9), 'week');

    expect(toIsoDate(bounds.startDate)).toBe('2026-04-06');
    expect(toIsoDate(bounds.endDate)).toBe('2026-04-12');
  });

  it('returns month range bounds for the full month', () => {
    const bounds = getRangeBounds(new Date(2026, 1, 18), 'month');

    expect(toIsoDate(bounds.startDate)).toBe('2026-02-01');
    expect(toIsoDate(bounds.endDate)).toBe('2026-02-28');
  });

  it('moves week and month anchors correctly', () => {
    const weekAnchor = moveRangeAnchor(new Date(2026, 3, 9), 'week', 'next');
    const monthAnchor = moveRangeAnchor(new Date(2026, 3, 9), 'month', 'previous');

    expect(toIsoDate(weekAnchor)).toBe('2026-04-16');
    expect(toIsoDate(monthAnchor)).toBe('2026-03-01');
  });

  it('groups appointments by date and sorts each day by start time', () => {
    const grouped = groupAppointmentsByDate([
      { appointment_date: '2026-04-10', appointment_time: '13:00:00', id: '1' },
      { appointment_date: '2026-04-09', appointment_time: '11:00:00', id: '2' },
      { appointment_date: '2026-04-10', appointment_time: '09:00:00', id: '3' },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.date).toBe('2026-04-09');
    expect(grouped[1]?.date).toBe('2026-04-10');
    expect(grouped[1]?.appointments.map((item) => item.id)).toEqual(['3', '1']);
  });
});
