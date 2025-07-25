/**
 * Dynamic locale loading service for efficient i18n resource management
 */

import i18next from 'i18next';

export interface LocaleMetadata {
  code: string;
  label: string;
  voice: string;
  region?: string;
  rtl?: boolean;
  status: 'core' | 'available' | 'loading' | 'loaded' | 'error';
}

export interface LocaleResources {
  translation: Record<string, any>;
}

class LocaleService {
  private loadedLanguages = new Set<string>(['en']); // English is always loaded
  private availableLanguages = new Map<string, LocaleMetadata>();
  private loadingPromises = new Map<string, Promise<void>>();

  constructor() {
    this.initializeAvailableLanguages();
  }

  /**
   * Initialize available languages from static configuration
   * In the future, this could fetch from an API endpoint
   */
  private initializeAvailableLanguages(): void {
    const languages: Record<string, Omit<LocaleMetadata, 'code' | 'status'>> = {
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
    };

    Object.entries(languages).forEach(([code, metadata]) => {
      this.availableLanguages.set(code, {
        code,
        ...metadata,
        status: code === 'en' ? 'loaded' : 'available',
      });
    });
  }

  /**
   * Get all available languages with their metadata
   */
  getAvailableLanguages(): LocaleMetadata[] {
    return Array.from(this.availableLanguages.values());
  }

  /**
   * Get metadata for a specific language
   */
  getLanguageMetadata(locale: string): LocaleMetadata | undefined {
    return this.availableLanguages.get(locale);
  }

  /**
   * Check if a language is currently loaded
   */
  isLanguageLoaded(locale: string): boolean {
    return this.loadedLanguages.has(locale);
  }

  /**
   * Load language resources dynamically
   */
  async loadLanguage(locale: string): Promise<void> {
    // If already loaded, return immediately
    if (this.loadedLanguages.has(locale)) {
      return;
    }

    // If currently loading, return the existing promise
    if (this.loadingPromises.has(locale)) {
      return this.loadingPromises.get(locale);
    }

    // Check if language is available
    const metadata = this.availableLanguages.get(locale);
    if (!metadata) {
      throw new Error(`Language ${locale} is not available`);
    }

    // Create loading promise
    const loadingPromise = this.loadLanguageResources(locale);
    this.loadingPromises.set(locale, loadingPromise);

    // Update status to loading
    this.availableLanguages.set(locale, { ...metadata, status: 'loading' });

    try {
      await loadingPromise;
      this.loadedLanguages.add(locale);
      this.availableLanguages.set(locale, { ...metadata, status: 'loaded' });
    } catch (error) {
      this.availableLanguages.set(locale, { ...metadata, status: 'error' });
      throw error;
    } finally {
      this.loadingPromises.delete(locale);
    }
  }

  /**
   * Load language resources and add them to i18next
   */
  private async loadLanguageResources(locale: string): Promise<void> {
    try {
      // Load main translation file
      const translationModule = await import(`../locales/${locale}/translation.json`);
      const translation = translationModule.default || translationModule;

      // Add resources to i18next
      i18next.addResourceBundle(locale, 'translation', translation, true, true);

      // Add language to supported languages list if not already there
      const currentSupported = i18next.options.supportedLngs as string[];
      if (!currentSupported.includes(locale)) {
        i18next.options.supportedLngs = [...currentSupported, locale];
      }

      // Load game-specific resources on demand
      // These will be loaded when actually needed by the resourcesToBackend function
    } catch (error) {
      console.error(`Failed to load resources for language ${locale}:`, error);

      // If not English, try to load English as fallback
      if (locale !== 'en') {
        console.warn(`Falling back to English for ${locale}`);
        // Don't throw here, let i18next handle the fallback
        return;
      }

      throw new Error(`Critical error: Could not load English fallback resources`);
    }
  }

  /**
   * Preload a language without switching to it
   */
  async preloadLanguage(locale: string): Promise<void> {
    try {
      await this.loadLanguage(locale);
    } catch (error) {
      console.warn(`Failed to preload language ${locale}:`, error);
      // Don't throw for preloading failures
    }
  }

  /**
   * Get the current user's preferred locale
   */
  detectUserLocale(): string {
    // Check localStorage first
    const stored = localStorage.getItem('selectedLanguage');
    if (stored && this.availableLanguages.has(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (this.availableLanguages.has(browserLang)) {
      return browserLang;
    }

    // Default to English
    return 'en';
  }

  /**
   * Save user's language preference
   */
  saveLanguagePreference(locale: string): void {
    localStorage.setItem('selectedLanguage', locale);
  }

  /**
   * Clear loaded language cache (useful for testing)
   */
  clearCache(): void {
    this.loadedLanguages.clear();
    this.loadedLanguages.add('en'); // Keep English loaded
    this.loadingPromises.clear();

    // Reset all non-English languages to available status
    this.availableLanguages.forEach((metadata, code) => {
      if (code !== 'en') {
        this.availableLanguages.set(code, { ...metadata, status: 'available' });
      }
    });
  }
}

// Export singleton instance
export const localeService = new LocaleService();
export default localeService;
