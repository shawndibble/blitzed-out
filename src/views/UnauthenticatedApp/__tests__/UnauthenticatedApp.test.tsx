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
    return Promise.resolve();
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
      zh: {
        setup: '游戏设置',
        language: '语言',
      },
      hi: {
        setup: 'गेम सेटअप',
        language: 'भाषा',
      },
    };
    return translations[mockI18n.language]?.[key] || key;
  }),
};

// Create a simple language switching component for testing (simulates new Select approach)
const LanguageSwitcher = () => {
  return (
    <div>
      <h2 data-testid="setup-title">{mockI18n.t('setup')}</h2>
      <div>
        <span data-testid="language-label">{mockI18n.t('language')}:</span>
        <select
          data-testid="language-select"
          value={mockI18n.resolvedLanguage}
          onChange={(e) => mockI18n.changeLanguage(e.target.value)}
          aria-labelledby="language-label"
        >
          {Object.entries(languages).map(([key, obj]) => (
            <option key={key} value={key} data-testid={`language-option-${key}`}>
              {obj.label}
            </option>
          ))}
        </select>
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

  it('should render language select with all 5 language options', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    expect(select).toBeInTheDocument();

    expect(screen.getByTestId('language-option-en')).toHaveTextContent('English');
    expect(screen.getByTestId('language-option-es')).toHaveTextContent('Español');
    expect(screen.getByTestId('language-option-fr')).toHaveTextContent('Français');
    expect(screen.getByTestId('language-option-zh')).toHaveTextContent('中文');
    expect(screen.getByTestId('language-option-hi')).toHaveTextContent('हिन्दी');
  });

  it('should have English selected initially', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('should call changeLanguage when Spanish is selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'es' } });

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');
  });

  it('should call changeLanguage when French is selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'fr' } });

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('should call changeLanguage when Mandarin is selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'zh' } });

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('zh');
  });

  it('should call changeLanguage when Hindi is selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'hi' } });

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('hi');
  });

  it('should show correct selected value for Spanish language', () => {
    // Set mock to Spanish before rendering
    mockI18n.language = 'es';
    mockI18n.resolvedLanguage = 'es';

    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select') as HTMLSelectElement;
    expect(select.value).toBe('es');
  });

  it('should have proper accessibility attributes', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    expect(select).toHaveAttribute('aria-labelledby', 'language-label');
  });

  it('should verify language helpers contains all 5 expected languages', () => {
    expect(languages).toHaveProperty('en');
    expect(languages).toHaveProperty('es');
    expect(languages).toHaveProperty('fr');
    expect(languages).toHaveProperty('zh');
    expect(languages).toHaveProperty('hi');

    expect(languages.en.label).toBe('English');
    expect(languages.es.label).toBe('Español');
    expect(languages.fr.label).toBe('Français');
    expect(languages.zh.label).toBe('中文');
    expect(languages.hi.label).toBe('हिन्दी');
  });

  it('should verify TTS voice configurations for all languages', () => {
    expect(languages.en.voice).toContain('Google UK English');
    expect(languages.es.voice).toContain('Google español');
    expect(languages.fr.voice).toContain('Google français');
    expect(languages.zh.voice).toContain('Google 中文');
    expect(languages.hi.voice).toContain('Google हिन्दी');
  });
});
