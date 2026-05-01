import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';
const DEFAULT_PLACEHOLDER = { blurhash: DEFAULT_BLURHASH };

type BarberSelectRowProps = {
  barberId: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isSelected: boolean;
  onSelect: (barberId: string) => void;
};

/**
 * 56×56 portrait + name + bio (one line) + radio-dot. Selecting a row
 * flips the portrait ring + radio dot to gold. Specialty chips and the
 * "Next: …" hint from the design are intentionally omitted — the
 * barbers schema lacks `years_experience` and `specialties`, and a
 * per-barber next-available query would balloon network cost. We use
 * `bio` as a substitute single-line subtitle.
 *
 * Source: screens-booking.jsx ScrBarberSelect.
 */
export const BarberSelectRow = memo(function BarberSelectRow({
  barberId,
  name,
  bio,
  avatarUrl,
  isSelected,
  onSelect,
}: BarberSelectRowProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => onSelect(barberId)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineSoft,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: isSelected ? colors.gold : colors.goldHair,
          padding: 2,
        }}
      >
        <View style={{ flex: 1, borderRadius: 26, overflow: 'hidden' }}>
          {avatarUrl != null ? (
            <Image
              source={{ uri: avatarUrl }}
              placeholder={DEFAULT_PLACEHOLDER}
              contentFit="cover"
              transition={120}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Photo tone="portrait" />
          )}
        </View>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fontFamilies.serif.medium,
            fontSize: 17,
            color: colors.ivory,
          }}
        >
          {name}
        </Text>
        {bio != null && bio.trim().length > 0 ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 12,
              color: colors.muted,
              marginTop: 2,
            }}
          >
            {bio}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: isSelected ? colors.gold : colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSelected ? (
          <View
            style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold }}
          />
        ) : null}
      </View>
    </Pressable>
  );
});
