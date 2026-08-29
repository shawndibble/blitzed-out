import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import MenuDrawer from '../index';

const setThemeMode = vi.fn();

vi.mock('@/context/theme', () => ({
  useTheme: () => ({
    themeMode: 'system',
    setThemeMode,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    wipeAllData: vi.fn(),
    isAnonymous: true,
    hasPermanentProvider: false,
  }),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [{ gameMode: 'online' }, vi.fn()],
  useSettingsStore: () => ({ updateSettings: vi.fn() }),
}));

vi.mock('@/hooks/useSubmitGameSettings', () => ({
  default: () => ({ submit: vi.fn() }),
}));

vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => ({ actionsList: {} }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ id: 'PUBLIC' }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'en' } }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));

// The Drawer keeps its children mounted until its close transition finishes, so
// asserting right after a click passes whether or not the drawer is closing.
// Zero-duration transitions make "it stayed open" checkable in one flush.
const instantTheme = createTheme({
  transitions: { duration: { enteringScreen: 0, leavingScreen: 0 } },
});

function renderDrawer() {
  return render(
    <ThemeProvider theme={instantTheme}>
      <MenuDrawer />
    </ThemeProvider>
  );
}

async function settleTransition() {
  await act(async () => {});
}

async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'open menu' }));
  expect(await screen.findByText('about')).toBeInTheDocument();
}

describe('MenuDrawer', () => {
  beforeEach(() => setThemeMode.mockClear());

  it('keeps the drawer open when the theme mode changes', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByRole('button', { name: 'theme.light' }));

    expect(setThemeMode).toHaveBeenCalledWith('light');
    await settleTransition();
    expect(screen.getByText('about')).toBeInTheDocument();
  });

  it('keeps the drawer open when the language select is opened', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByRole('combobox'));

    await settleTransition();
    expect(screen.getByText('about')).toBeInTheDocument();
  });

  it('closes the drawer for items that only open an external link', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('Discord'));

    expect(openSpy).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('gameBoards')).not.toBeInTheDocument());
    openSpy.mockRestore();
  });

  it('closes the drawer when a menu item is chosen', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await openDrawer(user);

    await user.click(screen.getByText('about'));

    await waitFor(() => expect(screen.queryByText('gameBoards')).not.toBeInTheDocument());
  });
});
