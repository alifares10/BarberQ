import { I18nManager, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
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

const LANGUAGE_STORAGE_KEY = 'barberq.language';

function isSupportedLanguage(language: string | null): language is AppLanguage {
  return appConfig.supportedLanguages.includes(language as AppLanguage);
}

function resolveDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode;

  if (locale === 'he') {
    return 'he';
  }

  return appConfig.defaultLanguage;
}

export async function getStoredLanguage() {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return null;
  }

  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    return isSupportedLanguage(storedLanguage) ? storedLanguage : null;
  } catch (error) {
    console.error('Failed to read stored language preference', error);
    return null;
  }
}

export async function saveStoredLanguage(language: AppLanguage) {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return;
  }

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export async function resolveInitialLanguage(): Promise<AppLanguage> {
  const storedLanguage = await getStoredLanguage();

  return storedLanguage ?? resolveDeviceLanguage();
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

export async function changeAppLanguage(language: AppLanguage) {
  const requiresRestart = I18nManager.isRTL !== isRtlLanguage(language);

  await saveStoredLanguage(language);
  syncRtlDirection(language);
  await i18n.changeLanguage(language);

  return { requiresRestart };
}

let initPromise: Promise<AppLanguage> | null = null;

export function initI18n() {
  if (initPromise != null) {
    return initPromise;
  }

  initPromise = resolveInitialLanguage().then(async (initialLanguage) => {
    syncRtlDirection(initialLanguage);

    if (i18n.isInitialized) {
      await i18n.changeLanguage(initialLanguage);
      return initialLanguage;
    }

    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      fallbackLng: appConfig.defaultLanguage,
      interpolation: {
        escapeValue: false,
      },
      lng: initialLanguage,
      resources,
    });

    return initialLanguage;
  });

  return initPromise;
}

export const i18nReady = initI18n();

export default i18n;
