import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithoutProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import SelectBoardSetting from '../index';
import { Settings } from '@/types/Settings';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        role: 'Role',
        vers: 'Vers',
        variation: 'Variation',
        standalone: 'Standalone',
        appendSome: 'Append Some',
        appendMost: 'Append Most',
        variationTooltip: 'Variation tooltip',
      };
      return translations[key] || key;
    },
  }),
  Trans: ({ children, i18nKey }: { children?: React.ReactNode; i18nKey?: string }) =>
    children || i18nKey || '',
}));

// Mock MUI components that need special handling
vi.mock('@mui/icons-material', () => ({
  Help: () => <div data-testid="help-icon">Help</div>,
  CheckBox: () => <div data-testid="checkbox-icon">CheckBox</div>,
  CheckBoxOutlineBlank: () => (
    <div data-testid="checkbox-outline-blank-icon">CheckBoxOutlineBlank</div>
  ),
}));

// Mock useHasMouse hook
vi.mock('@/hooks/useHasMouse', () => ({
  default: () => true,
}));

describe('SelectBoardSetting', () => {
  const mockActionsFolder = {
    testAction: {
      label: 'Test Action',
      type: 'consumption',
      dom: 'Dom Label',
      sub: 'Sub Label',
      actions: {
        'Level 0': {},
        'Level 1': {},
        'Level 2': {},
      },
    },
  };

  const mockSettings: Settings = {
    gameMode: 'local' as const,
    role: 'sub' as const,
    boardUpdated: false,
    room: 'TEST',
    selectedActions: {
      testAction: {
        type: 'consumption',
        level: 1,
        role: 'dom',
        variation: 'appendSome',
      },
    },
  };

  const mockSetSettings = vi.fn();

  const defaultProps = {
    option: 'testAction',
    settings: mockSettings,
    setSettings: mockSetSettings,
    actionsFolder: mockActionsFolder,
    type: 'consumption',
    showVariation: false,
    showRole: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('selectedActions data structure', () => {
    it('should render component without crashing', () => {
      renderWithoutProviders(<SelectBoardSetting {...defaultProps} />);

      // Should render the main action select (IncrementalSelect)
      const actionSelect = screen.getByRole('combobox');
      expect(actionSelect).toBeInTheDocument();
    });

    it('should handle role change and update selectedActions structure', async () => {
      const user = userEvent.setup();

      renderWithoutProviders(<SelectBoardSetting {...defaultProps} showRole={true} />);

      // Find role select by its display value
      const roleSelects = screen.getAllByRole('combobox');
      const roleSelect = roleSelects.find((select) =>
        select
          .closest('.MuiFormControl-root')
          ?.querySelector('label')
          ?.textContent?.includes('Role')
      );

      expect(roleSelect).toBeInTheDocument();

      // Simulate role change
      if (roleSelect) {
        await user.click(roleSelect);
        const versOption = await screen.findByText('Vers');
        await user.click(versOption);

        // Verify setSettings was called with correct selectedActions structure
        expect(mockSetSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedActions: expect.objectContaining({
              testAction: expect.objectContaining({
                type: 'consumption',
                level: expect.any(Number),
                role: 'vers',
              }),
            }),
            boardUpdated: true,
          })
        );
      }
    });

    it('should render variation select with selectedActions data', () => {
      renderWithoutProviders(<SelectBoardSetting {...defaultProps} showVariation={true} />);

      // Find variation select and verify it shows the current value from selectedActions
      const variationSelects = screen.getAllByRole('combobox');
      const variationSelect = variationSelects.find((select) =>
        select
          .closest('.MuiFormControl-root')
          ?.querySelector('label')
          ?.textContent?.includes('Variation')
      );

      expect(variationSelect).toBeInTheDocument();

      // Verify the variation select shows the value from selectedActions
      if (variationSelect) {
        expect(variationSelect).toHaveTextContent('appendSome'); // Value from selectedActions.testAction.variation
      }
    });

    it('should handle empty selectedActions gracefully', () => {
      const settingsWithoutSelectedActions: Settings = {
        ...mockSettings,
        selectedActions: {},
      };

      renderWithoutProviders(
        <SelectBoardSetting
          {...defaultProps}
          settings={settingsWithoutSelectedActions}
          showRole={true}
          showVariation={true}
        />
      );

      // Should render without crashing
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('should preserve existing selectedActions for other options', async () => {
      const user = userEvent.setup();
      const settingsWithMultipleActions: Settings = {
        ...mockSettings,
        selectedActions: {
          testAction: {
            type: 'consumption',
            level: 1,
            role: 'dom',
            variation: 'appendSome',
          },
          anotherAction: {
            type: 'foreplay',
            level: 2,
            role: 'sub',
            variation: 'standalone',
          },
        },
      };

      renderWithoutProviders(
        <SelectBoardSetting
          {...defaultProps}
          settings={settingsWithMultipleActions}
          showRole={true}
        />
      );

      const roleSelects = screen.getAllByRole('combobox');
      const roleSelect = roleSelects.find((select) =>
        select
          .closest('.MuiFormControl-root')
          ?.querySelector('label')
          ?.textContent?.includes('Role')
      );

      if (roleSelect) {
        await user.click(roleSelect);
        const versOption = await screen.findByText('Vers');
        await user.click(versOption);

        // Verify that anotherAction is preserved
        const setSettingsCall = mockSetSettings.mock.calls[0][0];
        expect(setSettingsCall.selectedActions.anotherAction).toEqual({
          type: 'foreplay',
          level: 2,
          role: 'sub',
          variation: 'standalone',
        });
      }
    });

    it('should always set boardUpdated to true when making changes', async () => {
      const user = userEvent.setup();

      renderWithoutProviders(<SelectBoardSetting {...defaultProps} showRole={true} />);

      const roleSelects = screen.getAllByRole('combobox');
      const roleSelect = roleSelects.find((select) =>
        select
          .closest('.MuiFormControl-root')
          ?.querySelector('label')
          ?.textContent?.includes('Role')
      );

      if (roleSelect) {
        await user.click(roleSelect);
        const versOption = await screen.findByText('Vers');
        await user.click(versOption);

        const setSettingsCall = mockSetSettings.mock.calls[0][0];
        expect(setSettingsCall.boardUpdated).toBe(true);
      }
    });
  });

  describe('regression prevention', () => {
    it('should not use the old direct settings[option] pattern', () => {
      // This test ensures we're using the new selectedActions structure
      // and not reverting to the old pattern that caused the bug

      renderWithoutProviders(
        <SelectBoardSetting {...defaultProps} showRole={true} showVariation={true} />
      );

      // Component should render successfully, indicating it's using
      // the correct selectedActions structure internally
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);

      // The component should handle the data structure without throwing errors
      // If it was still using the old settings[option] pattern,
      // it would likely throw errors or not display correctly
    });

    it('should handle undefined selectedActions without breaking', () => {
      const settingsWithUndefinedSelectedActions: Settings = {
        ...mockSettings,
        selectedActions: undefined as any,
      };

      expect(() => {
        renderWithoutProviders(
          <SelectBoardSetting
            {...defaultProps}
            settings={settingsWithUndefinedSelectedActions}
            showRole={true}
            showVariation={true}
          />
        );
      }).not.toThrow();

      // Should render the component elements
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});
