import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomGroupSelector from '../index';
import { CustomGroupPull } from '@/types/customGroups';

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

import { getAllAvailableGroups } from '@/stores/customGroups';

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
    it('should render groups when data loads successfully', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument(); // Default chip for first group
    });

    it('should call onChange when a group is selected', async () => {
      const mockOnChange = vi.fn();
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      render(<CustomGroupSelector {...defaultProps} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const select = screen.getByRole('combobox');
      await userEvent.click(select);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });

      const option = screen.getByText('Test Group 1');
      await userEvent.click(option);

      expect(mockOnChange).toHaveBeenCalledWith('testGroup1');
    });

    it('should filter groups by includeDefault prop', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      render(<CustomGroupSelector {...defaultProps} includeDefault={false} />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        userEvent.click(select);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Group 2')).toBeInTheDocument();
        expect(screen.queryByText('Test Group 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show no groups message when no groups available', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No groups available for en/online')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle error state gracefully', async () => {
      vi.mocked(getAllAvailableGroups).mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<CustomGroupSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No groups available for en/online')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading custom groups:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('disabled state', () => {
    it('should render as disabled when disabled prop is true', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

      render(<CustomGroupSelector {...defaultProps} disabled={true} />);

      await waitFor(() => {
        // Check the hidden input that is actually disabled
        const hiddenInput = screen.getByDisplayValue('');
        expect(hiddenInput).toBeDisabled();
      });
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
