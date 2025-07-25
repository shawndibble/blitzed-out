// React import removed as it's not used in this test file
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

const mockUseTranslation = vi.mocked(useTranslation);
const mockLocaleService = vi.mocked(localeService);

describe('LanguageSelect', () => {
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
      {
        code: 'fr',
        label: 'Française',
        voice: 'Google français',
        status: 'available',
      },
    ]);

    mockLocaleService.loadLanguage.mockResolvedValue(undefined);
    mockI18n.changeLanguage.mockResolvedValue(undefined as any);
  });

  it('should render language selector with available languages', () => {
    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Check that the select is rendered
    const select = screen.getByLabelText(/language/i);
    expect(select).toBeInTheDocument();

    // Check that it shows current language
    expect(select).toHaveValue('en');
  });

  it('should display all available languages in dropdown', async () => {
    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Open the select dropdown
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    // Check that all languages are present
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Française')).toBeInTheDocument();
    });
  });

  it('should change language when option is selected', async () => {
    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Open dropdown and select Spanish
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Wait for async operations
    await waitFor(() => {
      expect(mockLocaleService.loadLanguage).toHaveBeenCalledWith('es');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');
      expect(mockLocaleService.saveLanguagePreference).toHaveBeenCalledWith('es');
      expect(mockBoardUpdated).toHaveBeenCalled();
    });
  });

  it('should show loading state during language change', async () => {
    // Make loadLanguage take some time
    let resolveLoadLanguage: () => void;
    const loadLanguagePromise = new Promise<void>((resolve) => {
      resolveLoadLanguage = resolve;
    });
    mockLocaleService.loadLanguage.mockReturnValue(loadLanguagePromise);

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Select a language
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveLoadLanguage!();

    // Check loading state disappears
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('should show error message when language loading fails', async () => {
    const errorMessage = 'Failed to load language';
    mockLocaleService.loadLanguage.mockRejectedValue(new Error(errorMessage));

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Select a language that will fail
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should dismiss error message when close button is clicked', async () => {
    const errorMessage = 'Failed to load language';
    mockLocaleService.loadLanguage.mockRejectedValue(new Error(errorMessage));

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Trigger error
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Click close button on alert
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Error should be dismissed
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('should show loading indicator for languages being loaded', async () => {
    // Mock one language as loading
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
        status: 'loading',
      },
    ]);

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Open dropdown
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    // Check that loading language has progress indicator
    await waitFor(() => {
      const spanishOption = screen.getByText('Español').closest('[role="option"]');
      expect(spanishOption).toContainElement(screen.getByRole('progressbar'));
    });
  });

  it('should show error state for languages that failed to load', async () => {
    // Mock one language with error status
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
        status: 'error',
      },
    ]);

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Open dropdown
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    // Check that error language shows error indication
    await waitFor(() => {
      expect(screen.getByText('(Error)')).toBeInTheDocument();
    });
  });

  it('should disable loading languages from being selected', async () => {
    // Mock one language as loading
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
        status: 'loading',
      },
    ]);

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Open dropdown
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    // Check that loading language is disabled
    await waitFor(() => {
      const spanishOption = screen.getByText('Español').closest('[role="option"]');
      expect(spanishOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('should not change language when selecting the same language', async () => {
    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Select the currently selected language (English)
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const englishOption = await screen.findByText('English');
    fireEvent.click(englishOption);

    // Should not trigger any loading
    expect(mockLocaleService.loadLanguage).not.toHaveBeenCalled();
    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
  });

  it('should update available languages after successful language change', async () => {
    const mockGetAvailableLanguages = mockLocaleService.getAvailableLanguages;

    // Initial call returns languages
    mockGetAvailableLanguages.mockReturnValueOnce([
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

    render(<LanguageSelect boardUpdated={mockBoardUpdated} />);

    // Second call after language change returns updated status
    mockGetAvailableLanguages.mockReturnValueOnce([
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
        status: 'loaded',
      },
    ]);

    // Change language
    const select = screen.getByLabelText(/language/i);
    fireEvent.mouseDown(select);

    const spanishOption = await screen.findByText('Español');
    fireEvent.click(spanishOption);

    // Should call getAvailableLanguages again after successful change
    await waitFor(() => {
      expect(mockGetAvailableLanguages).toHaveBeenCalledTimes(2);
    });
  });
});
