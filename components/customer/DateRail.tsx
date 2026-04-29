import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

export type DateRailProps = {
  /** ISO date strings (YYYY-MM-DD) for the rail cells. */
  dates: string[];
  /** Currently selected ISO date or null when no filter is active. */
  selectedDate: string | null;
  onSelect: (next: string | null) => void;
  /** Map of ISO date → number of items, used to show a small dot under the day. */
  countByDate?: Record<string, number>;
  /** Locale for the abbreviated day-of-week label. */
  locale?: string;
};

const formatCell = (iso: string, locale: string) => {
  // Treat the date string as local — server values are stored in calendar
  // form (YYYY-MM-DD) and the rail is purely a UI filter.
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  const year = Number.parseInt(yearRaw ?? '', 10);
  const month = Number.parseInt(monthRaw ?? '', 10);
  const day = Number.parseInt(dayRaw ?? '', 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return { weekday: '—', dayNum: '—' };
  }
  const date = new Date(year, month - 1, day);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(date)
    .toUpperCase();
  return { weekday, dayNum: day.toString() };
};

/**
 * 6-cell hairline date rail. Tap a date to filter; tap the same date again
 * to clear. Source: ScrBookings date rail.
 */
export const DateRail = memo(function DateRail({
  dates,
  selectedDate,
  onSelect,
  countByDate = {},
  locale = 'en',
}: DateRailProps) {
  const { colors } = useAppTheme();
  const cells = useMemo(
    () => dates.map((iso) => ({ iso, ...formatCell(iso, locale) })),
    [dates, locale],
  );

  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
      {cells.map(({ iso, weekday, dayNum }) => {
        const isSelected = iso === selectedDate;
        const hasItems = (countByDate[iso] ?? 0) > 0;

        return (
          <Pressable
            key={iso}
            onPress={() => onSelect(isSelected ? null : iso)}
            style={{
              flex: 1,
              height: 64,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isSelected ? colors.gold : colors.line,
              backgroundColor: isSelected ? colors.goldDim : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              borderCurve: 'continuous',
            }}
          >
            <Text
              style={{
                fontFamily: fontFamilies.mono.regular,
                fontSize: 8,
                letterSpacing: 1.5,
                color: isSelected ? colors.gold : colors.muted,
              }}
            >
              {weekday}
            </Text>
            <Text
              style={{
                fontFamily: fontFamilies.serif.regular,
                fontSize: 20,
                fontVariant: ['tabular-nums'],
                color: isSelected ? colors.gold : colors.ivory,
              }}
            >
              {dayNum}
            </Text>
            {isSelected || hasItems ? (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.gold,
                  opacity: isSelected ? 1 : 0.6,
                }}
              />
            ) : (
              <View style={{ width: 4, height: 4 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
});
