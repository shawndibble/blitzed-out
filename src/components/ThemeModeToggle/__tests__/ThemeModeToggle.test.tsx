import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThemeModeToggle from '../index';
import type { ThemeMode } from '@/types/Settings';

const setThemeMode = vi.fn();
let currentMode: ThemeMode = 'system';

vi.mock('@/context/theme', () => ({
  useTheme: () => ({
    themeMode: currentMode,
    resolvedThemeMode: currentMode === 'system' ? 'dark' : currentMode,
    setThemeMode,
  }),
}));

describe('ThemeModeToggle', () => {
  beforeEach(() => {
    setThemeMode.mockClear();
    currentMode = 'system';
  });

  it.each(['light', 'dark', 'system'] as const)('selects the %s mode', async (mode) => {
    currentMode = mode === 'light' ? 'dark' : 'light';
    render(<ThemeModeToggle />);

    await userEvent.click(screen.getByRole('button', { name: `theme.${mode}` }));

    expect(setThemeMode).toHaveBeenCalledWith(mode);
  });

  it('marks the active mode as pressed', () => {
    currentMode = 'dark';
    render(<ThemeModeToggle />);

    expect(screen.getByRole('button', { name: 'theme.dark' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'theme.light' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('ignores a deselect click on the active mode', async () => {
    currentMode = 'light';
    render(<ThemeModeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'theme.light' }));

    expect(setThemeMode).not.toHaveBeenCalled();
  });
});
