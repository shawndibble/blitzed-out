import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Theme, useMediaQuery } from '@mui/material';
import { getThemeByMode } from '@/theme';
import { ThemeMode } from '@/types/Settings';
import { useSettingsStore } from '@/stores/settingsStore';

interface ThemeContextValue {
  /** Current active theme object */
  theme: Theme;
  /** Current theme mode preference (light, dark, or system) */
  themeMode: ThemeMode;
  /** Actual resolved theme mode (light or dark, never system) */
  resolvedThemeMode: 'light' | 'dark';
  /** Whether the user prefers dark mode according to system settings */
  prefersDarkMode: boolean;
  /** Function to change theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Function to toggle between light and dark (ignores system preference) */
  toggleTheme: () => void;
  /** Whether theme is currently being determined (loading state) */
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional default theme mode (defaults to 'system') */
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'system' }: ThemeProviderProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);

  // Detect system preference for dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
    noSsr: true, // Prevent hydration mismatch
  });

  // Get theme mode from settings or use default
  const themeMode: ThemeMode = settings.themeMode || defaultMode;

  // Resolve the actual theme mode (convert 'system' to 'light' or 'dark')
  const resolvedThemeMode: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, prefersDarkMode]);

  // Get the actual theme object
  const theme = useMemo(() => {
    return getThemeByMode(resolvedThemeMode);
  }, [resolvedThemeMode]);

  // Function to update theme mode
  const setThemeMode = (mode: ThemeMode) => {
    updateSettings({ themeMode: mode });
  };

  // Function to toggle between light and dark (ignores system)
  const toggleTheme = () => {
    const newMode = resolvedThemeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Handle loading state - wait for initial system preference detection
  useEffect(() => {
    // Small delay to ensure useMediaQuery has properly initialized
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Listen for system theme changes and update if in system mode
  useEffect(() => {
    if (themeMode === 'system') {
      // Theme will automatically update due to resolvedThemeMode dependency
      console.log('System theme preference changed:', prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode, themeMode]);

  // Provide smooth transition classes to body
  useEffect(() => {
    const body = document.body;

    // Add transition class for smooth theme switching
    body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // Add theme mode class for any custom CSS that might need it
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${resolvedThemeMode}`);

    return () => {
      body.style.transition = '';
      body.classList.remove('theme-light', 'theme-dark');
    };
  }, [resolvedThemeMode]);

  const contextValue: ThemeContextValue = {
    theme,
    themeMode,
    resolvedThemeMode,
    prefersDarkMode,
    setThemeMode,
    toggleTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to get just the theme mode and setter (lighter alternative)
 */
export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const { themeMode, setThemeMode } = useTheme();
  return [themeMode, setThemeMode];
}

/**
 * Hook to get the resolved theme mode (always 'light' or 'dark')
 */
export function useResolvedThemeMode(): 'light' | 'dark' {
  const { resolvedThemeMode } = useTheme();
  return resolvedThemeMode;
}

/**
 * Hook for theme toggle functionality
 */
export function useThemeToggle(): () => void {
  const { toggleTheme } = useTheme();
  return toggleTheme;
}
