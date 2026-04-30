import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Eyebrow } from '@/components/Eyebrow';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { SerifTitle } from '@/components/SerifTitle';
import { Status } from '@/components/Status';
import { Text } from '@/components/Text/Text';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

const DEFAULT_BLURHASH = 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4';
// Stable references for `expo-image` — passing fresh `{uri:…}` /
// `{blurhash:…}` literals on every render makes the native image
// bridge treat each render as a "new source" and re-decode.
const DEFAULT_PLACEHOLDER = { blurhash: DEFAULT_BLURHASH };

type ShopCardProps = {
  shopId: string;
  name: string;
  address: string;
  coverImageUrl: string | null;
  /** Pre-formatted distance string (e.g. "0.4 mi"). */
  distance: string | null;
  /** Optional shop tagline / category eyebrow ("EST. 1962", "HERITAGE"). */
  tagline?: string;
  /** Hardcoded for now — schema has no rating column. */
  rating?: string;
  onPress: (shopId: string) => void;
};

/**
 * Wide horizontal photo card — 110px tall, full-bleed photo with a
 * left→right gradient over the bottom-left content stack. Used in the
 * Explore "Near you" rail. Source: ScrExplore shop card.
 */
export const ShopCard = memo(function ShopCard({
  shopId,
  name,
  address: _address,
  coverImageUrl,
  distance,
  tagline,
  rating = '4.8',
  onPress,
}: ShopCardProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const eyebrow = tagline ?? t('customer.explore.shopTagline');
  const imageSource = useMemo(
    () => (coverImageUrl != null ? { uri: coverImageUrl } : null),
    [coverImageUrl],
  );

  return (
    <Pressable onPress={() => onPress(shopId)}>
      <View
        style={{
          height: 110,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.goldHair,
          backgroundColor: colors.surface,
          borderCurve: 'continuous',
        }}
      >
        {/* Layer 1 — cover photo */}
        {imageSource ? (
          <Image
            source={imageSource}
            placeholder={DEFAULT_PLACEHOLDER}
            contentFit="cover"
            transition={150}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Photo tone="chair" dim={0.5} />
          </View>
        )}

        {/* Layer 2 — left→right gradient for legibility */}
        <LinearGradient
          colors={['rgba(14,11,8,0.9)', 'rgba(14,11,8,0.4)', 'transparent']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Content */}
        <View
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Eyebrow size={9} color={colors.gold}>
              {eyebrow}
            </Eyebrow>
            <SerifTitle size={22} weight="regular" style={{ marginTop: 2 }}>
              {name}
            </SerifTitle>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="star" size={11} color={colors.gold} sw={0} />
              <Text
                style={{
                  fontFamily: fontFamilies.sans.regular,
                  fontSize: 11,
                  fontVariant: ['tabular-nums'],
                  color: colors.ivory,
                }}
              >
                {rating}
              </Text>
            </View>
            {distance ? (
              <>
                <Dot color={colors.muted} />
                <Text
                  style={{
                    fontFamily: fontFamilies.sans.regular,
                    fontSize: 11,
                    fontVariant: ['tabular-nums'],
                    color: colors.muted,
                  }}
                >
                  {distance}
                </Text>
              </>
            ) : null}
            <Dot color={colors.muted} />
            {/* TODO: derive open/closed from working_hours per-barber once
                a shop-level "open now" helper exists. */}
            <Status kind="open" compact />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const Dot = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 11 }}>·</Text>
);
