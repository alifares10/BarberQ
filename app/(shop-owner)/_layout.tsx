import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ShopOwnerTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tabs.calendar') }} />
      <Tabs.Screen name="shop" options={{ title: t('tabs.shop') }} />
      <Tabs.Screen name="barbers" options={{ title: t('tabs.barbers') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
