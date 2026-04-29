import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { CTA, Icon, SerifTitle, Text } from '@/components';
import { CategoryChipRow } from '@/components/customer/CategoryChipRow';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type SavedFilter = 'all' | 'shops' | 'barbers';

/**
 * Saved tab — empty-state-only in this phase. There is no `favorites` table
 * or API today; the populated 2-col grid layout is captured in the design
 * source for the schema follow-up.
 *
 * TODO: replace with `useQuery(customerQueryKeys.favorites(customerId))`
 * once the favorites table + RPC ship.
 */
export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<SavedFilter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + 8,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <SerifTitle size={32} weight="regular">
          {t('customer.favoritesTitle')}
        </SerifTitle>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Pressable onPress={() => setView('grid')}>
            <Icon
              name="grid"
              size={16}
              color={view === 'grid' ? colors.gold : colors.muted}
            />
          </Pressable>
          <Pressable onPress={() => setView('list')}>
            <Icon
              name="list"
              size={16}
              color={view === 'list' ? colors.gold : colors.muted}
            />
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <CategoryChipRow
          options={[
            { id: 'all', name: t('customer.favorites.all') },
            { id: 'shops', name: t('customer.favorites.shops') },
            { id: 'barbers', name: t('customer.favorites.barbers') },
          ]}
          selectedId={filter}
          onSelect={(next) => setFilter((next as SavedFilter | null) ?? 'all')}
        />
      </View>

      {/* Empty state */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
          gap: 24,
        }}
      >
        <RazorMark stroke={colors.goldBorder} dotFill={colors.gold} />
        <View style={{ alignItems: 'center', gap: 8 }}>
          <SerifTitle size={22} italic style={{ textAlign: 'center' }}>
            {t('customer.favorites.emptyTitle')}
          </SerifTitle>
          <Text
            style={{
              fontFamily: fontFamilies.sans.regular,
              fontSize: 13,
              lineHeight: 19,
              color: colors.muted,
              textAlign: 'center',
            }}
          >
            {t('customer.favorites.emptyBody')}
          </Text>
        </View>
        <CTA
          variant="ghost"
          onPress={() => router.push('/(customer)')}
          style={{
            borderWidth: 1,
            borderColor: colors.gold,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            height: undefined,
          }}
        >
          {t('customer.favorites.browseButton')}
        </CTA>
      </View>
    </View>
  );
}

function RazorMark({ stroke, dotFill }: { stroke: string; dotFill: string }) {
  return (
    <Svg
      width={64}
      height={80}
      viewBox="0 0 64 80"
      fill="none"
      stroke={stroke}
      strokeWidth={1.2}
      strokeLinecap="round"
    >
      <Path d="M22 8h20l3 16H19l3-16Z" />
      <Path d="M32 24v32" />
      <Path d="M22 56h20l-3 18H25l-3-18Z" />
      <Circle cx={32} cy={40} r={2} fill={dotFill} stroke="none" />
    </Svg>
  );
}
