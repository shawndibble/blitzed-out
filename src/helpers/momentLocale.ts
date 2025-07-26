import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/hi';

// Enable the relativeTime plugin
dayjs.extend(relativeTime);

/**
 * Map i18n language codes to dayjs locale codes
 * @param language - The i18n language code (e.g., 'zh', 'es', 'fr', 'hi', 'en')
 * @returns The corresponding dayjs locale code
 */
export const getDayjsLocale = (language: string): string => {
  switch (language) {
    case 'zh':
      return 'zh-cn';
    case 'es':
      return 'es';
    case 'fr':
      return 'fr';
    case 'hi':
      return 'hi';
    default:
      return 'en'; // Default to English
  }
};

/**
 * Set dayjs locale based on i18n language
 * @param language - The i18n language code
 */
export const setDayjsLocale = (language: string): void => {
  const locale = getDayjsLocale(language);
  dayjs.locale(locale);
};

/**
 * Get a localized dayjs instance for the given date and language
 * @param date - The date to create a dayjs instance for
 * @param language - The i18n language code
 * @returns A dayjs instance with the correct locale
 */
export const getDayjsWithLocale = (date: Date, language: string) => {
  const dayjsLocale = getDayjsLocale(language);
  return dayjs(date).locale(dayjsLocale);
};

// Backward compatibility aliases (deprecated - use dayjs versions)
export const setMomentLocale = setDayjsLocale;
export const getMomentWithLocale = getDayjsWithLocale;
export const getMomentLocale = getDayjsLocale;
