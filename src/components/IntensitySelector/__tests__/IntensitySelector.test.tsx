import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntensitySelector from '../index';
import { CustomGroupIntensity } from '@/types/customGroups';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        intensity: 'Intensity',
        'customGroups.selectGroupFirst': 'Select a group first',
        'customGroups.loadingIntensities': 'Loading intensities...',
        'customGroups.noIntensitiesAvailable': `No intensities available for "${params?.groupName}"`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the customGroups store
vi.mock('@/stores/customGroups', () => ({
  getGroupIntensities: vi.fn(),
}));

import { getGroupIntensities } from '@/stores/customGroups';

describe('IntensitySelector', () => {
  const mockIntensities: CustomGroupIntensity[] = [
    { id: '1', label: 'Beginner', value: 1, isDefault: true },
    { id: '2', label: 'Intermediate', value: 2, isDefault: true },
    { id: '3', label: 'Advanced', value: 3, isDefault: true },
  ];

  const defaultProps = {
    groupName: 'testGroup',
    value: 1,
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

  describe('no group selected state', () => {
    it('should show select group first message when no groupName provided', () => {
      render(<IntensitySelector {...defaultProps} groupName="" />);

      expect(screen.getByText('Select a group first')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading state when intensities are being loaded', async () => {
      vi.mocked(getGroupIntensities).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<IntensitySelector {...defaultProps} />);

      expect(screen.getByText('Loading intensities...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('successful data loading', () => {
    it('should render intensities when data loads successfully', async () => {
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should call onChange when an intensity is selected', async () => {
      const mockOnChange = vi.fn();
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      render(<IntensitySelector {...defaultProps} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await userEvent.click(select);

      const option = screen.getByText('Advanced');
      await userEvent.click(option);

      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    it('should display intensities sorted by value', async () => {
      const unsortedIntensities = [
        { id: '3', label: 'Advanced', value: 3, isDefault: true },
        { id: '1', label: 'Beginner', value: 1, isDefault: true },
        { id: '2', label: 'Intermediate', value: 2, isDefault: true },
      ];

      vi.mocked(getGroupIntensities).mockResolvedValue(unsortedIntensities);

      render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        userEvent.click(select);
      });

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveTextContent('Beginner');
        expect(options[1]).toHaveTextContent('Intermediate');
        expect(options[2]).toHaveTextContent('Advanced');
      });
    });
  });

  describe('empty state', () => {
    it('should show no intensities message when no intensities available', async () => {
      vi.mocked(getGroupIntensities).mockResolvedValue([]);

      render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No intensities available for "testGroup"')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle error state gracefully', async () => {
      vi.mocked(getGroupIntensities).mockRejectedValue(new Error('Failed to load'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No intensities available for "testGroup"')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading group intensities:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('value validation', () => {
    it('should reset value when current value is not in intensities', async () => {
      const mockOnChange = vi.fn();
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      render(<IntensitySelector {...defaultProps} value={99} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(1); // Should reset to first intensity
      });
    });

    it('should not reset value when current value is valid', async () => {
      const mockOnChange = vi.fn();
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      render(<IntensitySelector {...defaultProps} value={2} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should render as disabled when disabled prop is true', async () => {
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      render(<IntensitySelector {...defaultProps} disabled={true} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeDisabled();
      });
    });
  });

  describe('group change handling', () => {
    it('should reload intensities when groupName changes', async () => {
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      const { rerender } = render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        expect(getGroupIntensities).toHaveBeenCalledWith('testGroup', 'en', 'online');
      });

      rerender(<IntensitySelector {...defaultProps} groupName="newGroup" />);

      await waitFor(() => {
        expect(getGroupIntensities).toHaveBeenCalledWith('newGroup', 'en', 'online');
      });

      expect(getGroupIntensities).toHaveBeenCalledTimes(2);
    });

    it('should clear intensities when groupName is empty', async () => {
      vi.mocked(getGroupIntensities).mockResolvedValue(mockIntensities);

      const { rerender } = render(<IntensitySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      rerender(<IntensitySelector {...defaultProps} groupName="" />);

      expect(screen.getByText('Select a group first')).toBeInTheDocument();
      expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
    });
  });
});
