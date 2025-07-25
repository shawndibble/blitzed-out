import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { languages } from '@/services/i18nHelpers';

// Mock the auth context
const mockLogin = vi.fn();
const mockUser = null;

vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    login: mockLogin,
    user: mockUser,
  }),
}));

// Mock the settings store
const mockUpdateSettings = vi.fn();
const mockSettings = {
  displayName: '',
  room: 'PUBLIC',
};

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [mockSettings, mockUpdateSettings],
}));

// Mock other hooks
vi.mock('@/hooks/useBreakpoint', () => ({
  default: () => false,
}));

vi.mock('@/hooks/usePlayerList', () => ({
  default: () => [],
}));

// Mock Navigation component
vi.mock('@/views/Navigation', () => ({
  default: function MockNavigation() {
    return <div data-testid="navigation">Navigation</div>;
  },
}));

// Mock GameGuide component
vi.mock('@/views/GameGuide', () => ({
  default: function MockGameGuide() {
    return <div data-testid="game-guide">Game Guide</div>;
  },
}));

// Mock AuthDialog component
vi.mock('@/components/auth/AuthDialog', () => ({
  default: function MockAuthDialog({ open, close }: { open: boolean; close: () => void }) {
    return open ? (
      <div data-testid="auth-dialog">
        <button onClick={close}>Close</button>
      </div>
    ) : null;
  },
}));

// Create a mock i18n instance for testing
const mockI18n = {
  language: 'en',
  resolvedLanguage: 'en',
  changeLanguage: vi.fn((lng: string) => {
    mockI18n.language = lng;
    mockI18n.resolvedLanguage = lng;
    Promise.resolve();
  }),
  t: vi.fn((key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        setup: 'Game Setup',
        language: 'Language',
      },
      es: {
        setup: 'Configuración del juego',
        language: 'Idioma',
      },
      fr: {
        setup: 'Configuration du jeu',
        language: 'Langue',
      },
    };
    return translations[mockI18n.language]?.[key] || key;
  }),
};

// Create a simple language switching component for testing
const LanguageSwitcher = () => {
  return (
    <div>
      <h2 data-testid="setup-title">{mockI18n.t('setup')}</h2>
      <div>
        <span data-testid="language-label">{mockI18n.t('language')}:</span>
        {Object.entries(languages).map(([key, obj]) => (
          <button
            key={key}
            onClick={() => mockI18n.changeLanguage(key)}
            disabled={mockI18n.resolvedLanguage === key}
            data-testid={`language-${key}`}
          >
            {obj.label}
          </button>
        ))}
      </div>
    </div>
  );
};

describe('Language Switching Functionality', () => {
  beforeEach(() => {
    // Reset mock i18n to English before each test
    mockI18n.language = 'en';
    mockI18n.resolvedLanguage = 'en';
    vi.clearAllMocks();
  });

  it('should render language buttons with correct labels', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByTestId('language-en')).toHaveTextContent('English');
    expect(screen.getByTestId('language-es')).toHaveTextContent('Español');
    expect(screen.getByTestId('language-fr')).toHaveTextContent('Française');
  });

  it('should have English button disabled initially', () => {
    render(<LanguageSwitcher />);

    const englishButton = screen.getByTestId('language-en');
    const spanishButton = screen.getByTestId('language-es');
    const frenchButton = screen.getByTestId('language-fr');

    expect(englishButton).toBeDisabled();
    expect(spanishButton).not.toBeDisabled();
    expect(frenchButton).not.toBeDisabled();
  });

  it('should call changeLanguage when Spanish button is clicked', () => {
    render(<LanguageSwitcher />);

    const spanishButton = screen.getByTestId('language-es');
    fireEvent.click(spanishButton);

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');
  });

  it('should call changeLanguage when French button is clicked', () => {
    render(<LanguageSwitcher />);

    const frenchButton = screen.getByTestId('language-fr');
    fireEvent.click(frenchButton);

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('should not call changeLanguage when disabled English button is clicked', () => {
    render(<LanguageSwitcher />);

    const englishButton = screen.getByTestId('language-en');
    fireEvent.click(englishButton);

    // Should not be called because button is disabled
    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
  });

  it('should show correct disabled state for Spanish language', () => {
    // Set mock to Spanish before rendering
    mockI18n.language = 'es';
    mockI18n.resolvedLanguage = 'es';

    render(<LanguageSwitcher />);

    const englishButton = screen.getByTestId('language-en');
    const spanishButton = screen.getByTestId('language-es');
    const frenchButton = screen.getByTestId('language-fr');

    expect(englishButton).not.toBeDisabled();
    expect(spanishButton).toBeDisabled();
    expect(frenchButton).not.toBeDisabled();
  });

  it('should verify language helpers contains expected languages', () => {
    expect(languages).toHaveProperty('en');
    expect(languages).toHaveProperty('es');
    expect(languages).toHaveProperty('fr');

    expect(languages.en.label).toBe('English');
    expect(languages.es.label).toBe('Español');
    expect(languages.fr.label).toBe('Française');
  });
});
