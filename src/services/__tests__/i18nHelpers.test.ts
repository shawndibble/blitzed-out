import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  languages,
  getAvailableLanguages,
  getLanguageMetadata,
  isLanguageLoaded,
  preloadLanguage,
} from '../i18nHelpers';
import localeService from '../localeService';

// Mock localeService
vi.mock('../localeService', () => ({
  default: {
    getAvailableLanguages: vi.fn(),
    getLanguageMetadata: vi.fn(),
    isLanguageLoaded: vi.fn(),
    preloadLanguage: vi.fn(),
  },
}));

const mockLocaleService = vi.mocked(localeService);

describe('i18nHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('legacy languages export', () => {
    it('should provide backward compatible languages object', () => {
      expect(languages).toEqual({
        en: {
          label: 'English',
          voice: 'Google UK English Male',
        },
        es: {
          label: 'Español',
          voice: 'Google español de Estados Unidos',
        },
        fr: {
          label: 'Française',
          voice: 'Google français',
        },
      });
    });
  });

  describe('getAvailableLanguages', () => {
    it('should delegate to localeService.getAvailableLanguages', () => {
      const mockLanguages = [
        {
          code: 'en',
          label: 'English',
          voice: 'Google UK English Male',
          status: 'loaded' as const,
        },
      ];

      mockLocaleService.getAvailableLanguages.mockReturnValue(mockLanguages);

      const result = getAvailableLanguages();

      expect(mockLocaleService.getAvailableLanguages).toHaveBeenCalled();
      expect(result).toBe(mockLanguages);
    });
  });

  describe('getLanguageMetadata', () => {
    it('should delegate to localeService.getLanguageMetadata', () => {
      const mockMetadata = {
        code: 'en',
        label: 'English',
        voice: 'Google UK English Male',
        status: 'loaded' as const,
      };

      mockLocaleService.getLanguageMetadata.mockReturnValue(mockMetadata);

      const result = getLanguageMetadata('en');

      expect(mockLocaleService.getLanguageMetadata).toHaveBeenCalledWith('en');
      expect(result).toBe(mockMetadata);
    });

    it('should return undefined for non-existing language', () => {
      mockLocaleService.getLanguageMetadata.mockReturnValue(undefined);

      const result = getLanguageMetadata('de');

      expect(mockLocaleService.getLanguageMetadata).toHaveBeenCalledWith('de');
      expect(result).toBeUndefined();
    });
  });

  describe('isLanguageLoaded', () => {
    it('should delegate to localeService.isLanguageLoaded', () => {
      mockLocaleService.isLanguageLoaded.mockReturnValue(true);

      const result = isLanguageLoaded('en');

      expect(mockLocaleService.isLanguageLoaded).toHaveBeenCalledWith('en');
      expect(result).toBe(true);
    });

    it('should return false for unloaded language', () => {
      mockLocaleService.isLanguageLoaded.mockReturnValue(false);

      const result = isLanguageLoaded('es');

      expect(mockLocaleService.isLanguageLoaded).toHaveBeenCalledWith('es');
      expect(result).toBe(false);
    });
  });

  describe('preloadLanguage', () => {
    it('should delegate to localeService.preloadLanguage', async () => {
      mockLocaleService.preloadLanguage.mockResolvedValue();

      await preloadLanguage('es');

      expect(mockLocaleService.preloadLanguage).toHaveBeenCalledWith('es');
    });

    it('should handle errors gracefully without throwing', async () => {
      const mockError = new Error('Preload failed');
      mockLocaleService.preloadLanguage.mockRejectedValue(mockError);

      // Mock console.warn to verify it's called
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      await expect(preloadLanguage('es')).resolves.toBeUndefined();

      expect(mockLocaleService.preloadLanguage).toHaveBeenCalledWith('es');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to preload language es:', mockError);

      consoleSpy.mockRestore();
    });

    it('should handle string errors gracefully', async () => {
      mockLocaleService.preloadLanguage.mockRejectedValue('String error');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await preloadLanguage('es');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to preload language es:', 'String error');

      consoleSpy.mockRestore();
    });
  });
});
