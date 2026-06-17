import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../utils/i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const isRussian  = currentLanguage === 'ru';
  const isEnglish  = currentLanguage === 'en';

  const switchLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
    console.log('[useLanguage] Switched to:', lang);
  };

  const toggleLanguage = async () => {
    const newLang = isRussian ? 'en' : 'ru';
    await switchLanguage(newLang);
  };

  return {
    currentLanguage,
    isRussian,
    isEnglish,
    switchLanguage,
    toggleLanguage,
  };
};
