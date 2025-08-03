import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardSettings from '../index';
import { Settings, GameMode } from '@/types/Settings';

// Mock the local player store
const mockUseLocalPlayerStore = vi.fn();
vi.mock('@/stores/localPlayerStore', () => ({
  useLocalPlayerStore: () => mockUseLocalPlayerStore(),
}));

// Mock other dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    Trans: ({ children }: { children: React.ReactNode }) => children,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

describe('BoardSettings', () => {
  const mockFormData: Settings = {
    room: 'TESTROOM',
    gameMode: 'local',
    difficulty: 'normal',
    role: 'sub',
    selectedActions: {},
    boardUpdated: false,
  };

  const mockActionsList = {
    testAction: {
      type: 'foreplay',
      label: 'Test Action',
    },
  };

  const mockSetFormData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('role selection visibility', () => {
    it('should show role select when in private room without local players', () => {
      // Mock: No local players setup
      mockUseLocalPlayerStore.mockReturnValue({
        hasLocalPlayers: () => false,
      });

      render(
        <BoardSettings
          formData={mockFormData}
          setFormData={mockSetFormData}
          actionsList={mockActionsList}
        />
      );

      // Should show the main role select - check there are more comboboxes (difficulty + mainRole + action role selects)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(1); // At least difficulty + mainRole
    });

    it('should hide role select when in private room with local players setup', () => {
      // Mock: Local players are setup
      mockUseLocalPlayerStore.mockReturnValue({
        hasLocalPlayers: () => true,
      });

      render(
        <BoardSettings
          formData={mockFormData}
          setFormData={mockSetFormData}
          actionsList={mockActionsList}
        />
      );

      // Should NOT show the main role select - fewer comboboxes (only difficulty, no mainRole, no action role selects)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(1); // Only difficulty select
    });

    it('should hide role select when in public room regardless of local players', () => {
      // Mock: Local players are setup but in public room
      mockUseLocalPlayerStore.mockReturnValue({
        hasLocalPlayers: () => false,
      });

      const publicRoomFormData = {
        ...mockFormData,
        room: 'public',
      };

      render(
        <BoardSettings
          formData={publicRoomFormData}
          setFormData={mockSetFormData}
          actionsList={mockActionsList}
        />
      );

      // Should NOT show the main role select in public room - only difficulty select should be present
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(1); // Only difficulty select
    });

    it('should hide role select when in online mode regardless of local players', () => {
      // Mock: Local players are setup but in online mode
      mockUseLocalPlayerStore.mockReturnValue({
        hasLocalPlayers: () => false,
      });

      const onlineModeFormData: Settings = {
        ...mockFormData,
        gameMode: 'online' as GameMode,
      };

      render(
        <BoardSettings
          formData={onlineModeFormData}
          setFormData={mockSetFormData}
          actionsList={mockActionsList}
        />
      );

      // Should NOT show the main role select in online mode - only difficulty select should be present
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(1); // Only difficulty select
    });
  });
});
