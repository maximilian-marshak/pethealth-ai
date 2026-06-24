import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// ─── Переводы EN ───────────────────────────────────────────
import enCommon    from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enProfile   from '../locales/en/profile.json';
import enPets      from '../locales/en/pets.json';
import enAuth      from '../locales/en/auth.json';
import enMedical   from '../locales/en/medical.json';
import enActivity  from '../locales/en/activity.json';
import enAi from '../locales/en/ai.json';
import enCharity  from '../locales/en/charity.json';
import enNotifications from '../locales/en/notifications.json';

// ─── Переводы RU ───────────────────────────────────────────
import ruCommon    from '../locales/ru/common.json';
import ruDashboard from '../locales/ru/dashboard.json';
import ruProfile   from '../locales/ru/profile.json';
import ruPets      from '../locales/ru/pets.json';
import ruAuth      from '../locales/ru/auth.json';
import ruMedical   from '../locales/ru/medical.json';
import ruActivity  from '../locales/ru/activity.json';
import ruAi from '../locales/ru/ai.json';
import ruCharity  from '../locales/ru/charity.json';
import ruNotifications from '../locales/ru/notifications.json';

// ─── Константа ─────────────────────────────────────────────
const LANGUAGE_KEY = '@pethealth_language';

// ─── Язык устройства ───────────────────────────────────────
const getDeviceLanguage = () => {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    if (locale?.startsWith('ru')) return 'ru';
    return 'en';
  } catch {
    return 'en';
  }
};

// ─── Загрузка сохранённого языка ───────────────────────────
const loadSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    console.log('[i18n] Saved language:', saved);
    return saved || getDeviceLanguage();
  } catch {
    return getDeviceLanguage();
  }
};

// ─── Сохранение языка ──────────────────────────────────────
export const saveLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    console.log('[i18n] Language saved:', lang);
  } catch (e) {
    console.error('[i18n] Failed to save language:', e);
  }
};

// ─── Инициализация ─────────────────────────────────────────
export const initI18n = async () => {
  const language = await loadSavedLanguage();
  console.log('[i18n] Initializing with language:', language);

  await i18n.use(initReactI18next).init({
    resources: {
      en: {
        common:    enCommon,
        dashboard: enDashboard,
        profile:   enProfile,
        pets:      enPets,
        auth:      enAuth,
        medical:   enMedical,
        activity:  enActivity,
        ai: enAi,
        charity:   enCharity,
        notifications: enNotifications,
      },
      ru: {
        common:    ruCommon,
        dashboard: ruDashboard,
        profile:   ruProfile,
        pets:      ruPets,
        auth:      ruAuth,
        medical:   ruMedical,
        activity:  ruActivity,
        ai: ruAi,
        charity:   ruCharity,
        notifications: ruNotifications,
      },
    },
    lng:         language,
    fallbackLng: 'en',
    //                                              
    ns:          ['common', 'dashboard', 'profile', 'pets', 'auth', 'medical', 'activity', 'ai', 'charity', 'notifications'],
    defaultNS:   'common',
    interpolation: {
      escapeValue: false,
    },
  });

  console.log('[i18n] Ready ✓');
  return i18n;
};

export default i18n;
