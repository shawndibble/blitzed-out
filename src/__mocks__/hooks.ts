import { vi } from 'vitest';

// Mock all hooks used in tests
export const mockUseBreakpoint = vi.fn(() => false);
export const mockUseGameBoard = vi.fn(() => vi.fn());
export const mockUseLocalStorage = vi.fn(() => [{}, vi.fn()]);
export const mockUseReturnToStart = vi.fn(() => vi.fn());

// Export mocks with correct module structure
vi.mock('@/hooks/useBreakpoint', () => ({
  default: mockUseBreakpoint,
}));

vi.mock('@/hooks/useGameBoard', () => ({
  default: mockUseGameBoard,
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  default: mockUseLocalStorage,
}));

vi.mock('@/hooks/useReturnToStart', () => ({
  default: mockUseReturnToStart,
}));
