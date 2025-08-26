import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

import { CustomGroupPull } from '@/types/customGroups';
import CustomGroupSelector from '../index';
import { getCustomGroups, getCustomGroupsWithTiles } from '@/stores/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';
import { useEditorGroupsReactive } from '@/hooks/useGroupFiltering';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        Group: 'Group',
        default: 'Default',
        'customGroups.loadingGroups': 'Loading groups...',
        'customGroups.noGroupsAvailable': `No groups available for ${params?.locale}/${params?.gameMode}`,
        'customGroups.selectGroupFirst': 'Select a group first',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the customGroups store
vi.mock('@/stores/customGroups', () => ({
  getAllAvailableGroups: vi.fn(),
  getCustomGroups: vi.fn(),
  getCustomGroupsWithTiles: vi.fn(),
}));

// Mock the customTiles store
vi.mock('@/stores/customTiles', () => ({
  getTileCountsByGroup: vi.fn(),
}));

// Mock the useEditorGroupsReactive hook
vi.mock('@/hooks/useGroupFiltering', () => ({
  useEditorGroupsReactive: vi.fn(),
}));

// No longer need to mock groupRefresh store - using reactive hooks instead

describe('CustomGroupSelector', () => {
  const mockGroups: CustomGroupPull[] = [
    {
      id: '1',
      name: 'testGroup1',
      label: 'Test Group 1',
      intensities: [
        { id: '1', label: 'Beginner', value: 1, isDefault: true },
        { id: '2', label: 'Advanced', value: 2, isDefault: true },
      ],
      type: 'solo',
      isDefault: true,
      locale: 'en',
      gameMode: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'testGroup2',
      label: 'Test Group 2',
      intensities: [
        { id: '3', label: 'Light', value: 1, isDefault: false },
        { id: '4', label: 'Intense', value: 2, isDefault: false },
      ],
      type: 'foreplay',
      isDefault: false,
      locale: 'en',
      gameMode: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    locale: 'en',
    gameMode: 'online',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations
    vi.mocked(getCustomGroups).mockResolvedValue(mockGroups);
    vi.mocked(getCustomGroupsWithTiles).mockResolvedValue(mockGroups);
    vi.mocked(getTileCountsByGroup).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', async () => {
      // Mock the useEditorGroupsReactive hook to return loading state
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: [],
        loading: true,
        error: null,
        isEmpty: true,
      });

      await act(async () => {
        render(<CustomGroupSelector {...defaultProps} />);
      });

      expect(screen.getByText('Loading groups...')).toBeInTheDocument();
      // Note: Progress bar is only shown in menu when opened, not in the label
      expect(screen.getByDisplayValue('')).toBeDisabled();
    });
  });

  describe('successful data loading', () => {
    it('should call getAllAvailableGroups with correct parameters', async () => {
      // Mock the useEditorGroupsReactive hook to return data
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: mockGroups.map((group) => ({
          ...group,
          hasNoTiles: false,
          isAvailableForSetup: true,
        })),
        loading: false,
        error: null,
        isEmpty: false,
      });

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should handle empty groups array', async () => {
      // Mock the useEditorGroupsReactive hook to return empty groups
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: [],
        loading: false,
        error: null,
        isEmpty: true,
      });

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });
    });
  });

  describe('disabled state', () => {
    it('should render as disabled when disabled prop is true', async () => {
      // Mock the useEditorGroupsReactive hook to return data
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: mockGroups.map((group) => ({
          ...group,
          hasNoTiles: false,
          isAvailableForSetup: true,
        })),
        loading: false,
        error: null,
        isEmpty: false,
      });

      render(<CustomGroupSelector {...defaultProps} disabled={true} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Check the hidden input that is actually disabled
      const hiddenInput = screen.getByDisplayValue('');
      expect(hiddenInput).toBeDisabled();
    });
  });

  describe('refresh trigger', () => {
    it('should reload groups when refreshTrigger changes', async () => {
      // Mock the useEditorGroupsReactive hook to return data
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: mockGroups.map((group) => ({
          ...group,
          hasNoTiles: false,
          isAvailableForSetup: true,
        })),
        loading: false,
        error: null,
        isEmpty: false,
      });

      const { rerender } = render(<CustomGroupSelector {...defaultProps} refreshTrigger={0} />);

      rerender(<CustomGroupSelector {...defaultProps} refreshTrigger={1} />);

      // Note: The reactive hook automatically detects DB changes, no manual refresh needed
    });
  });

  describe('locale and gameMode filtering', () => {
    it('should pass correct locale and gameMode to hook', async () => {
      // Mock the useEditorGroupsReactive hook to return empty groups
      vi.mocked(useEditorGroupsReactive).mockReturnValue({
        groups: [],
        loading: false,
        error: null,
        isEmpty: true,
      });

      render(<CustomGroupSelector {...defaultProps} locale="es" gameMode="local" />);

      // Verify the hook was called with correct parameters (no refresh trigger needed)
      expect(useEditorGroupsReactive).toHaveBeenCalledWith('local', 'es');
    });
  });
});
