/**
 * Test to verify LanguageSelect component updates settings store on locale change
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import LanguageSelect from '../index';
import localeService from '@/services/localeService';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock localeService
vi.mock('@/services/localeService', () => ({
  default: {
    getAvailableLanguages: vi.fn(),
    loadLanguage: vi.fn(),
    saveLanguagePreference: vi.fn(),
  },
}));

// Mock settings store
const mockSetLocale = vi.fn();
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: () => ({
    setLocale: mockSetLocale,
  }),
}));

// Mock migration service
vi.mock('@/services/migrationService', () => ({
  migrateLocaleIfNeeded: vi.fn(),
}));

const mockUseTranslation = vi.mocked(useTranslation);
const mockLocaleService = vi.mocked(localeService);

describe('LanguageSelect Settings Store Integration', () => {
  const mockBoardUpdated = vi.fn();
  const mockI18n = {
    resolvedLanguage: 'en',
    changeLanguage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: vi.fn((key: string) => key) as any,
      i18n: mockI18n as any,
    } as any);

    mockLocaleService.getAvailableLanguages.mockReturnValue([
      {
        code: 'en',
        label: 'English',
        voice: 'Google UK English Male',
        status: 'loaded',
      },
      {
        code: 'es',
        label: 'Español',
        voice: 'Google español de Estados Unidos',
        status: 'available',
      },
    ]);

    mockLocaleService.loadLanguage.mockResolvedValue(undefined);
    mockI18n.changeLanguage.mockResolvedValue(undefined as any);
  });

  it('should update settings store locale when language is changed', async () => {
    // Mock successful migration
    const mockMigrateLocale = vi.fn().mockResolvedValue(true);
    vi.doMock('@/services/migrationService', () => ({
      migrateLocaleIfNeeded: mockMigrateLocale,
    }));

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Change language to Spanish
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Wait for async operations to complete
    await waitFor(() => {
      // Verify all the expected calls were made in order
      expect(mockLocaleService.loadLanguage).toHaveBeenCalledWith('es');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');
      expect(mockLocaleService.saveLanguagePreference).toHaveBeenCalledWith('es');
      expect(mockSetLocale).toHaveBeenCalledWith('es');
      expect(mockBoardUpdated).toHaveBeenCalled();
    });
  });

  it('should still update settings store even if migration fails', async () => {
    // Mock failed migration
    const mockMigrateLocale = vi.fn().mockResolvedValue(false);
    vi.doMock('@/services/migrationService', () => ({
      migrateLocaleIfNeeded: mockMigrateLocale,
    }));

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Change language to Spanish
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Wait for async operations to complete
    await waitFor(() => {
      // Even with failed migration, settings store should still be updated
      expect(mockSetLocale).toHaveBeenCalledWith('es');
      expect(mockBoardUpdated).toHaveBeenCalled();
    });
  });

  it('should not update settings store if language change fails', async () => {
    // Mock failed language change
    mockI18n.changeLanguage.mockRejectedValue(new Error('Language change failed'));

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Change language to Spanish
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Language change failed')).toBeInTheDocument();
    });

    // Settings store should not be updated on error
    expect(mockSetLocale).not.toHaveBeenCalled();
    expect(mockBoardUpdated).not.toHaveBeenCalled();
  });
});
