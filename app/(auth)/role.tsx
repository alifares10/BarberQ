import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  CTA,
  Eyebrow,
  Icon,
  Photo,
  SerifTitle,
  StepHeader,
  Text,
} from '@/components';
import type { PhotoTone } from '@/components/Photo';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';

type RoleKind = 'customer' | 'shop_owner';

export default function RoleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const setPendingRole = useAuthStore((state) => state.setPendingRole);
  const [selected, setSelected] = useState<RoleKind | null>(null);

  if (session == null) {
    return <Redirect href="/(auth)/phone" />;
  }

  const continueLabel =
    selected === 'shop_owner'
      ? t('auth.roleContinueOwner')
      : selected === 'customer'
        ? t('auth.roleContinueCustomer')
        : t('auth.roleContinue');

  const handleContinue = () => {
    if (selected == null) return;
    setPendingRole(selected);
    router.push('/(auth)/profile');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
      }}
    >
      <StepHeader step={3} total={3} />

      <View style={{ marginTop: 24 }}>
        <SerifTitle size={30} weight="regular">
          {t('auth.roleHeadlineA')}
        </SerifTitle>
        <SerifTitle size={30} italic color={colors.gold}>
          {t('auth.roleHeadlineB')}
        </SerifTitle>
      </View>

      <View style={{ marginTop: 32, gap: 14 }}>
        <RoleCard
          tone="chair"
          label={t('auth.roleCustomerLabel')}
          title={t('auth.roleCustomerHeadline')}
          sub={t('auth.roleCustomerSub')}
          selected={selected === 'customer'}
          onPress={() => setSelected('customer')}
        />
        <RoleCard
          tone="counter"
          label={t('auth.roleOwnerLabel')}
          title={t('auth.roleOwnerHeadline')}
          sub={t('auth.roleOwnerSub')}
          selected={selected === 'shop_owner'}
          onPress={() => setSelected('shop_owner')}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          left: 24,
          right: 24,
        }}
      >
        <CTA disabled={selected == null} onPress={handleContinue}>
          {continueLabel}
        </CTA>
      </View>
    </View>
  );
}

type RoleCardProps = {
  tone: PhotoTone;
  label: string;
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
};

function RoleCard({ tone, label, title, sub, selected, onPress }: RoleCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 220,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: selected ? colors.gold : colors.goldHair,
        borderCurve: 'continuous',
      }}
    >
      <Photo tone={tone} dim={0.55} />
      <LinearGradient
        colors={['transparent', 'rgba(14,11,8,0.85)']}
        locations={[0.3, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          top: 18,
          left: 20,
        }}
      >
        <Eyebrow size={9} color={selected ? colors.gold : colors.muted}>
          {label}
        </Eyebrow>
      </View>
      {selected ? (
        <View
          style={{
            position: 'absolute',
            top: 18,
            right: 20,
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={12} color={colors.gold} sw={2} />
        </View>
      ) : null}
      <View
        style={{
          position: 'absolute',
          bottom: 22,
          left: 20,
          right: 20,
        }}
      >
        <SerifTitle size={26} weight="regular">
          {title}
        </SerifTitle>
        <Text
          style={{
            marginTop: 4,
            fontFamily: fontFamilies.sans.regular,
            fontSize: 12,
            lineHeight: 17,
            color: colors.muted,
          }}
        >
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
