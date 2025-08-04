import * as helpers from '@/views/GameSettingsWizard/ActionsStep/helpers';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { FormData } from '@/types';
import PickConsumptions from '../index';

// Mock i18next
vi.mock('i18next', () => ({
  t: vi.fn((key: string) => key),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: { i18nKey: string; children?: React.ReactNode }) =>
    children || i18nKey,
}));

// Mock the helper functions
vi.mock('@/views/GameSettingsWizard/ActionsStep/helpers', () => ({
  populateSelections: vi.fn(() => ['alcohol', 'poppers']),
  updateFormDataWithDefaults: vi.fn(),
  handleLevelsChange: vi.fn(),
}));

// Mock MultiSelect component
vi.mock('@/components/MultiSelect', () => ({
  default: ({ onChange, values, options, label }: any) => (
    <div data-testid="multi-select">
      <label>{label}</label>
      <select
        multiple
        value={values}
        onChange={(e) => {
          const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
          onChange({ target: { value: selectedValues } });
        }}
        data-testid="consumption-select"
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

// Mock YesNoSwitch component
vi.mock('@/components/GameForm/YesNoSwitch', () => ({
  default: ({ trueCondition, onChange, yesLabel }: any) => (
    <div data-testid="yes-no-switch">
      <label>
        <input
          type="checkbox"
          checked={trueCondition || false}
          onChange={(e) => onChange(e, e.target.checked)}
          data-testid="toggle-checkbox"
        />
        {yesLabel}
      </label>
    </div>
  ),
}));

// Mock MultiSelectIntensity component
vi.mock('@/components/MultiSelectIntensity', () => ({
  default: ({ actionName, selectedLevels, onChange }: any) => (
    <div data-testid={`multi-select-intensity-${actionName}`}>
      <label>{actionName}</label>
      <div>
        {[1, 2, 3, 4].map((level) => (
          <label key={level}>
            <input
              type="checkbox"
              checked={selectedLevels.includes(level)}
              onChange={() => {
                const newLevels = selectedLevels.includes(level)
                  ? selectedLevels.filter((l: number) => l !== level)
                  : [...selectedLevels, level].sort();
                onChange(newLevels);
              }}
              data-testid={`level-checkbox-${actionName}-${level}`}
            />
            Level {level}
          </label>
        ))}
      </div>
    </div>
  ),
}));

// Mock IntensityTitle component
vi.mock('@/views/GameSettingsWizard/ActionsStep/IntensityTitle', () => ({
  default: () => <div data-testid="intensity-title">Intensity Title</div>,
}));

describe('PickConsumptions', () => {
  const mockSetFormData = vi.fn();
  const mockOptions = vi.fn(() => [
    { value: 'alcohol', label: 'Alcohol' },
    { value: 'poppers', label: 'Poppers' },
    { value: 'vaping', label: 'Vaping' },
  ]);
  const mockActionsList = {
    alcohol: { label: 'Alcohol' },
    poppers: { label: 'Poppers' },
    vaping: { label: 'Vaping' },
  };

  const defaultFormData: FormData = {
    gameMode: 'online' as any,
    room: 'TEST',
    boardUpdated: false,
    isAppend: false,
    selectedActions: {
      alcohol: {
        type: 'consumption',
        levels: [2],
        variation: 'standalone',
      },
      poppers: {
        type: 'consumption',
        levels: [1],
        variation: 'standalone',
      },
    },
  };

  const defaultProps = {
    formData: defaultFormData,
    setFormData: mockSetFormData,
    options: mockOptions,
    actionsList: mockActionsList,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with basic elements', () => {
      render(<PickConsumptions {...defaultProps} />);

      expect(screen.getByText('pickConsumptions')).toBeInTheDocument();
      expect(screen.getByTestId('multi-select')).toBeInTheDocument();
    });

    it('should show toggle and intensity controls when consumptions are selected', () => {
      render(<PickConsumptions {...defaultProps} />);

      expect(screen.getByTestId('intensity-title')).toBeInTheDocument();
      expect(screen.getByTestId('yes-no-switch')).toBeInTheDocument();
      expect(screen.getByText('standaloneOrCombine')).toBeInTheDocument();
    });

    it('should render multi-select intensity components for each selected consumption', () => {
      render(<PickConsumptions {...defaultProps} />);

      expect(screen.getByTestId('multi-select-intensity-alcohol')).toBeInTheDocument();
      expect(screen.getByTestId('multi-select-intensity-poppers')).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should show toggle as unchecked when isAppend is false', () => {
      render(<PickConsumptions {...defaultProps} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      expect(toggleCheckbox).not.toBeChecked();
    });

    it('should show toggle as checked when isAppend is true', () => {
      const formDataWithAppend = {
        ...defaultFormData,
        isAppend: true,
      };

      render(<PickConsumptions {...defaultProps} formData={formDataWithAppend} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      expect(toggleCheckbox).toBeChecked();
    });

    it('should update selectedActions with appendMost when toggle is turned ON', async () => {
      render(<PickConsumptions {...defaultProps} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            isAppend: true,
            selectedActions: expect.objectContaining({
              alcohol: expect.objectContaining({
                variation: 'appendMost',
              }),
              poppers: expect.objectContaining({
                variation: 'appendMost',
              }),
            }),
          })
        );
      });
    });

    it('should update selectedActions with standalone when toggle is turned OFF', async () => {
      const formDataWithAppend = {
        ...defaultFormData,
        isAppend: true,
        selectedActions: {
          alcohol: {
            type: 'consumption' as const,
            levels: [2],
            variation: 'appendMost',
          },
          poppers: {
            type: 'consumption' as const,
            levels: [1],
            variation: 'appendMost',
          },
        },
      };

      render(<PickConsumptions {...defaultProps} formData={formDataWithAppend} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            isAppend: false,
            selectedActions: expect.objectContaining({
              alcohol: expect.objectContaining({
                variation: 'standalone',
              }),
              poppers: expect.objectContaining({
                variation: 'standalone',
              }),
            }),
          })
        );
      });
    });

    it('should preserve other properties when updating variation', async () => {
      render(<PickConsumptions {...defaultProps} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedActions: expect.objectContaining({
              alcohol: expect.objectContaining({
                type: 'consumption',
                levels: [2],
                variation: 'appendMost',
              }),
              poppers: expect.objectContaining({
                type: 'consumption',
                levels: [1],
                variation: 'appendMost',
              }),
            }),
          })
        );
      });
    });

    it('should not show controls when no consumptions are selected', async () => {
      // Override the mock to return empty array for this test
      vi.mocked(helpers.populateSelections).mockReturnValueOnce([]);

      const formDataEmpty = {
        ...defaultFormData,
        selectedActions: {},
      };

      render(<PickConsumptions {...defaultProps} formData={formDataEmpty} />);

      // When no consumptions are selected, the toggle should not be visible
      expect(screen.queryByTestId('toggle-checkbox')).not.toBeInTheDocument();
      expect(screen.queryByTestId('intensity-title')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle selectedActions with missing consumption items', async () => {
      const formDataPartial = {
        ...defaultFormData,
        selectedActions: {
          alcohol: {
            type: 'consumption' as const,
            level: 2,
            variation: 'standalone',
          },
          // Missing poppers entry
        },
      };

      render(<PickConsumptions {...defaultProps} formData={formDataPartial} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            isAppend: true,
            selectedActions: expect.objectContaining({
              alcohol: expect.objectContaining({
                variation: 'appendMost',
              }),
            }),
          })
        );
      });
    });

    it('should not update non-existent consumption items', async () => {
      const formDataWithExtra = {
        ...defaultFormData,
        selectedActions: {
          alcohol: {
            type: 'consumption' as const,
            level: 2,
            variation: 'standalone',
          },
          someOtherAction: {
            type: 'sex' as const,
            level: 1,
            variation: 'standalone',
          },
        },
      };

      render(<PickConsumptions {...defaultProps} formData={formDataWithExtra} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        const callArgs = mockSetFormData.mock.calls[0][0];
        expect(callArgs.selectedActions.alcohol.variation).toBe('appendMost');
        expect(callArgs.selectedActions.someOtherAction.variation).toBe('standalone'); // Should remain unchanged
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain synchronization between isAppend and variation values', async () => {
      render(<PickConsumptions {...defaultProps} />);

      // Toggle ON
      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        const callArgs = mockSetFormData.mock.calls[0][0];
        expect(callArgs.isAppend).toBe(true);
        expect(callArgs.selectedActions.alcohol.variation).toBe('appendMost');
        expect(callArgs.selectedActions.poppers.variation).toBe('appendMost');
      });
    });

    it('should update all selected consumption items when toggle changes', async () => {
      const formDataMultiple = {
        ...defaultFormData,
        selectedActions: {
          alcohol: { type: 'consumption' as const, level: 2, variation: 'standalone' },
          poppers: { type: 'consumption' as const, level: 1, variation: 'standalone' },
          vaping: { type: 'consumption' as const, level: 3, variation: 'standalone' },
        },
      };

      // Mock to return all three items as selected
      vi.mocked(helpers.populateSelections).mockReturnValue(['alcohol', 'poppers', 'vaping']);

      render(<PickConsumptions {...defaultProps} formData={formDataMultiple} />);

      const toggleCheckbox = screen.getByTestId('toggle-checkbox');
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        const callArgs = mockSetFormData.mock.calls[0][0];
        expect(callArgs.selectedActions.alcohol.variation).toBe('appendMost');
        expect(callArgs.selectedActions.poppers.variation).toBe('appendMost');
        expect(callArgs.selectedActions.vaping.variation).toBe('appendMost');
      });
    });
  });
});
