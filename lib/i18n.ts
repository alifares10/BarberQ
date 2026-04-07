import { I18nManager } from 'react-native';

import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { appConfig, type AppLanguage } from '@/constants/config';
import en from '@/i18n/en.json';
import he from '@/i18n/he.json';

const resources = {
  en: {
    translation: en,
  },
  he: {
    translation: he,
  },
} as const;

function resolveLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode;

  if (locale === 'he') {
    return 'he';
  }

  return appConfig.defaultLanguage;
}

export function isRtlLanguage(language: string) {
  return language.startsWith('he');
}

export function syncRtlDirection(language: string) {
  const shouldUseRtl = isRtlLanguage(language);

  I18nManager.allowRTL(true);

  if (I18nManager.isRTL !== shouldUseRtl) {
    I18nManager.forceRTL(shouldUseRtl);
  }
}

const initialLanguage = resolveLanguage();

syncRtlDirection(initialLanguage);

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: appConfig.defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
  lng: initialLanguage,
  resources,
});

export default i18n;
