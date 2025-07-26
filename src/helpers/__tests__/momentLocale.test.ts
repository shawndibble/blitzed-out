import dayjs from 'dayjs';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { getMomentLocale, setMomentLocale, getMomentWithLocale } from '../momentLocale';

describe('momentLocale', () => {
  describe('getMomentLocale', () => {
    it('should map language codes to moment locale codes', () => {
      expect(getMomentLocale('zh')).toBe('zh-cn');
      expect(getMomentLocale('es')).toBe('es');
      expect(getMomentLocale('fr')).toBe('fr');
      expect(getMomentLocale('hi')).toBe('hi');
      expect(getMomentLocale('en')).toBe('en');
      expect(getMomentLocale('unknown')).toBe('en');
    });
  });

  describe('setMomentLocale', () => {
    it('should set dayjs global locale', () => {
      setMomentLocale('es');
      expect(dayjs.locale()).toBe('es');

      setMomentLocale('zh');
      expect(dayjs.locale()).toBe('zh-cn');

      // Reset to English
      setMomentLocale('en');
    });
  });

  describe('getMomentWithLocale', () => {
    const testDate = new Date('2024-01-01T12:00:00.000Z');
    const fiveMinutesAgo = new Date(testDate.getTime() - 5 * 60 * 1000);

    beforeEach(() => {
      // Mock the current time to be consistent
      vi.useFakeTimers();
      vi.setSystemTime(testDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return localized time strings', () => {
      const englishResult = getMomentWithLocale(fiveMinutesAgo, 'en').fromNow();
      const chineseResult = getMomentWithLocale(fiveMinutesAgo, 'zh').fromNow();
      const spanishResult = getMomentWithLocale(fiveMinutesAgo, 'es').fromNow();
      const frenchResult = getMomentWithLocale(fiveMinutesAgo, 'fr').fromNow();

      expect(englishResult).toBe('5 minutes ago');
      expect(chineseResult).toBe('5 分钟前');
      expect(spanishResult).toBe('hace 5 minutos');
      expect(frenchResult).toBe('il y a 5 minutes');
    });

    it('should handle different time periods correctly', () => {
      const oneHourAgo = new Date(testDate.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(testDate.getTime() - 24 * 60 * 60 * 1000);

      const chineseHour = getMomentWithLocale(oneHourAgo, 'zh').fromNow();
      const chineseDay = getMomentWithLocale(oneDayAgo, 'zh').fromNow();

      expect(chineseHour).toBe('1 小时前');
      expect(chineseDay).toBe('1 天前');
    });
  });
});
