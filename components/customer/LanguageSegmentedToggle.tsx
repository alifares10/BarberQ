import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text/Text';
import { useToast } from '@/components/ToastProvider';
import { appConfig, type AppLanguage } from '@/constants/config';
import { changeAppLanguage } from '@/lib/i18n';
import { fontFamilies } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'he', label: 'עב' },
];

function normalizeLanguage(language: string): AppLanguage {
  return appConfig.supportedLanguages.includes(language as AppLanguage)
    ? (language as AppLanguage)
    : appConfig.defaultLanguage;
}

/**
 * Inline EN/עב segmented pill matching the design's globe-row toggle.
 * Behaviour identical to the legacy LanguageSettingsCard — calls
 * `changeAppLanguage` and surfaces the restart-required notice via toast.
 * Source: ScrProfile language row.
 */
export function LanguageSegmentedToggle() {
  const { i18n, t } = useTranslation();
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(i18n.language),
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handlePress(next: AppLanguage) {
    if (next === selectedLanguage || isSaving) return;
    setIsSaving(true);
    try {
      const result = await changeAppLanguage(next);
      const nextT = i18n.getFixedT(next);

      setSelectedLanguage(next);
      showToast({
        message: result.requiresRestart
          ? nextT('common.languageRestartNotice')
          : nextT('toast.languageUpdated'),
        type: result.requiresRestart ? 'info' : 'success',
      });
    } catch (error) {
      console.error('Failed to save language preference', error);
      showToast({ message: t('common.languageSaveError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.goldBorder,
        borderRadius: 999,
        overflow: 'hidden',
        borderCurve: 'continuous',
      }}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === selectedLanguage;
        return (
          <Pressable
            key={option.value}
            disabled={isSaving}
            onPress={() => void handlePress(option.value)}
          >
            <Text
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                fontFamily: fontFamilies.sans.semibold,
                fontSize: 10,
                letterSpacing: 1,
                color: isActive ? colors.bg : colors.gold,
                backgroundColor: isActive ? colors.gold : 'transparent',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
