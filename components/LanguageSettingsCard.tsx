import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ToastProvider';
import { Card } from '@/components/Card/Card';
import { Text } from '@/components/Text/Text';
import { appConfig, type AppLanguage } from '@/constants/config';
import { changeAppLanguage } from '@/lib/i18n';
import { getRtlLayout } from '@/lib/rtl';
import { useAppTheme } from '@/lib/theme';

const LANGUAGE_OPTIONS: { labelKey: string; value: AppLanguage }[] = [
  { labelKey: 'common.languageEnglish', value: 'en' },
  { labelKey: 'common.languageHebrew', value: 'he' },
];

function normalizeLanguage(language: string): AppLanguage {
  return appConfig.supportedLanguages.includes(language as AppLanguage)
    ? (language as AppLanguage)
    : appConfig.defaultLanguage;
}

export function LanguageSettingsCard() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(() => normalizeLanguage(i18n.language));
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const rtlLayout = getRtlLayout(i18n.language);
  const { colors } = useAppTheme();

  async function handleLanguagePress(language: AppLanguage) {
    if (language === selectedLanguage || isSaving) {
      return;
    }

    setIsSaving(true);
    setNotice(null);
    setErrorMessage(null);

    try {
      const result = await changeAppLanguage(language);
      const nextT = i18n.getFixedT(language);

      setSelectedLanguage(language);
      setNotice(result.requiresRestart ? t('common.languageRestartNotice') : t('common.languageAppliedNotice'));
      showToast({
        message: result.requiresRestart ? nextT('common.languageRestartNotice') : nextT('toast.languageUpdated'),
        type: result.requiresRestart ? 'info' : 'success',
      });
    } catch (error) {
      console.error('Failed to save language preference', error);
      setErrorMessage(t('common.languageSaveError'));
      showToast({ message: t('common.languageSaveError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('common.languageSectionTitle')}</Text>
      <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('common.languageSectionDescription')}</Text>

      <View style={[styles.optionsRow, { flexDirection: rtlLayout.rowDirection }]}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.value === selectedLanguage;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving, selected: isSelected }}
              disabled={isSaving}
              key={option.value}
              onPress={() => void handleLanguagePress(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceMuted,
                  borderColor: isSelected ? colors.primary : colors.chipBorder,
                },
              ]}
            >
              <Text color={isSelected ? '$inverseColor' : '$color'} fontWeight="700" textAlign="center">
                {t(option.labelKey)}
              </Text>
              <Text color={isSelected ? '$inverseColor' : '$colorMuted'} fontSize={12} textAlign="center">
                {isSelected ? t('common.languageSelected') : t('common.languageTapToSelect')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {notice != null ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSurface }]}>
          <Text color="$color" fontSize={13} textAlign={rtlLayout.textAlign}>
            {notice}
          </Text>
        </View>
      ) : null}

      {errorMessage != null ? <Text color="$error" textAlign={rtlLayout.textAlign}>{errorMessage}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderCurve: 'continuous',
    borderRadius: 12,
    padding: 12,
  },
  option: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionsRow: {
    gap: 8,
  },
});
