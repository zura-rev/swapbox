import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ka from './ka';
import en from './en';
import ru from './ru';

const LANG_KEY = 'swapbox_lang';

export const LANGUAGES = [
  { code: 'ka', label: 'ᲕᲐᲠ' },
  { code: 'en', label: 'ENG' },
  { code: 'ru', label: 'РУС' },
];

const savedLang = localStorage.getItem(LANG_KEY) || 'ka';

i18n.use(initReactI18next).init({
  resources: {
    ka: { translation: ka },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: savedLang,
  fallbackLng: 'ka',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;
