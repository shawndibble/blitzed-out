import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { CustomGroupPull } from '@/types/customGroups';
import CustomGroupSelector from '../index';
import { getAllAvailableGroups } from '@/stores/customGroups';

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
}));

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', async () => {
      vi.mocked(getAllAvailableGroups).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CustomGroupSelector {...defaultProps} />);

      expect(screen.getByText('Loading groups...')).toBeInTheDocument();
      // Note: Progress bar is only shown in menu when opened, not in the label
      expect(screen.getByDisplayValue('')).toBeDisabled();
    });
  });

  describe('successful data loading', () => {
    it('should call getAllAvailableGroups with correct parameters', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(getAllAvailableGroups).toHaveBeenCalledWith('en', 'online');
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should handle empty groups array', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      expect(getAllAvailableGroups).toHaveBeenCalledWith('en', 'online');
    });
  });

  describe('disabled state', () => {
    it('should render as disabled when disabled prop is true', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

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
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      const { rerender } = render(<CustomGroupSelector {...defaultProps} refreshTrigger={0} />);

      await waitFor(() => {
        expect(getAllAvailableGroups).toHaveBeenCalledTimes(1);
      });

      rerender(<CustomGroupSelector {...defaultProps} refreshTrigger={1} />);

      await waitFor(() => {
        expect(getAllAvailableGroups).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('locale and gameMode filtering', () => {
    it('should call getAllAvailableGroups with correct locale and gameMode', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

      render(<CustomGroupSelector {...defaultProps} locale="es" gameMode="local" />);

      await waitFor(() => {
        expect(getAllAvailableGroups).toHaveBeenCalledWith('es', 'local');
      });
    });
  });
});
