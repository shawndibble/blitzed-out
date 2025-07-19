import { vi } from 'vitest';

// Mock all hooks used in tests
export const mockUseBreakpoint = vi.fn(() => false);
export const mockUseGameBoard = vi.fn(() => vi.fn());
export const mockUseSettings = vi.fn(() => [{}, vi.fn()]);
export const mockUseGameSettings = vi.fn(() => ({ settings: {}, updateSettings: vi.fn() }));
export const mockUseSettingsStore = vi.fn(() => ({
  settings: {},
  updateSettings: vi.fn(),
  setLocale: vi.fn(),
}));
export const mockUseReturnToStart = vi.fn(() => vi.fn());

// Export mocks with correct module structure
vi.mock('@/hooks/useBreakpoint', () => ({
  default: mockUseBreakpoint,
}));

vi.mock('@/hooks/useGameBoard', () => ({
  default: mockUseGameBoard,
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: mockUseSettings,
  useGameSettings: mockUseGameSettings,
  useSettingsStore: mockUseSettingsStore,
}));

vi.mock('@/hooks/useReturnToStart', () => ({
  default: mockUseReturnToStart,
}));
