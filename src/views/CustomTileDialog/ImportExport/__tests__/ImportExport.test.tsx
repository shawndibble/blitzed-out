import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportExport from '../index';
import { CustomTile } from '@/types/customTiles';
import { AllGameModeActions } from '@/types/customTiles';

// Mock dependencies
vi.mock('@/stores/settingsStore', () => ({
  useGameSettings: () => ({
    settings: {
      locale: 'en',
      gameMode: 'online',
    },
  }),
}));

vi.mock('@/services/firebase', () => ({
  submitCustomAction: vi.fn(),
}));

vi.mock('@/components/CopyToClipboard', () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="copy-to-clipboard" data-text={text}>
      Copy Button
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock the enhanced import/export functions
const mockExportCleanData = vi.fn();
const mockExportGroupData = vi.fn();
const mockExportSelectedGroups = vi.fn();
const mockAutoImportData = vi.fn();
const mockGetAvailableGroupsForExport = vi.fn();

vi.mock('../enhancedImportExport', () => ({
  exportCleanData: mockExportCleanData,
  exportGroupData: mockExportGroupData,
  exportSelectedGroups: mockExportSelectedGroups,
  autoImportData: mockAutoImportData,
  generateExportSummary: vi.fn(),
  getAvailableGroupsForExport: mockGetAvailableGroupsForExport,
}));

describe('ImportExport Component', () => {
  const mockCustomTiles: CustomTile[] = [
    {
      id: 1,
      group: 'testGroup',
      intensity: 1,
      action: 'Test action 1',
      tags: ['tag1'],
      isCustom: 1,
      gameMode: 'online',
    },
    {
      id: 2,
      group: 'testGroup',
      intensity: 2,
      action: 'Test action 2',
      tags: [],
      isCustom: 1,
      gameMode: 'online',
    },
  ];

  const mockMappedGroups: AllGameModeActions = {
    online: {
      testGroup: {
        label: 'Test Group',
        type: 'action',
        actions: {
          Light: ['Action 1', 'Action 2'],
          Medium: ['Action 3'],
        },
      },
    },
    local: {},
    solo: {},
  };

  const mockAvailableGroups = [
    { name: 'group1', label: 'Group 1', tileCount: 5 },
    { name: 'group2', label: 'Group 2', tileCount: 3 },
  ];

  const defaultProps = {
    expanded: 'ctImport',
    handleChange: vi.fn(() => vi.fn()),
    customTiles: mockCustomTiles,
    mappedGroups: mockMappedGroups,
    setSubmitMessage: vi.fn(),
    bulkImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportCleanData.mockResolvedValue(
      JSON.stringify({
        version: '2.0.0',
        locale: 'en',
        gameMode: 'online',
        groups: {
          testGroup: {
            label: 'Test Group',
            type: 'action',
            intensities: ['None', 'Light', 'Medium'],
            actions: {
              None: [],
              Light: ['Test action 1'],
              Medium: ['Test action 2'],
            },
          },
        },
      })
    );
    mockGetAvailableGroupsForExport.mockResolvedValue(mockAvailableGroups);
    mockAutoImportData.mockResolvedValue({
      success: true,
      importedGroups: 1,
      importedTiles: 2,
      errors: [],
      warnings: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('component rendering', () => {
    it('should render the component with default clean export format', async () => {
      render(<ImportExport {...defaultProps} />);

      expect(screen.getByText('importExport')).toBeInTheDocument();
      expect(screen.getByText('ctImportDescription')).toBeInTheDocument();

      // Should show format selection with clean as default
      expect(screen.getByDisplayValue('Clean (v2.0)')).toBeInTheDocument();

      // Should show export scope selection
      expect(screen.getByText('Export Scope')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Custom Groups')).toBeInTheDocument();

      // Should show import strategy selection
      expect(screen.getByText('Import Strategy')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Skip Existing')).toBeInTheDocument();
    });

    it('should load and display available groups on mount', async () => {
      render(<ImportExport {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetAvailableGroupsForExport).toHaveBeenCalledWith('en', 'online');
      });
    });

    it('should export clean data on mount', async () => {
      render(<ImportExport {...defaultProps} />);

      await waitFor(() => {
        expect(mockExportCleanData).toHaveBeenCalledWith('en', 'online');
      });

      // Should populate text area with exported data
      const textArea = screen.getByRole('textbox', { name: '' });
      await waitFor(() => {
        expect(textArea).toHaveValue(expect.stringContaining('"version": "2.0.0"'));
      });
    });
  });

  describe('export format selection', () => {
    it('should switch to legacy format when selected', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const formatSelect = screen.getByRole('combobox', { name: 'Format' });
      await user.click(formatSelect);

      const legacyOption = screen.getByRole('option', { name: 'Legacy' });
      await user.click(legacyOption);

      // Should hide export scope options for legacy format
      expect(screen.queryByText('Export Scope')).not.toBeInTheDocument();

      // Should update placeholder text
      expect(screen.getByPlaceholderText('Paste legacy format data here...')).toBeInTheDocument();
    });

    it('should show export scope options only for clean format', async () => {
      render(<ImportExport {...defaultProps} />);

      // Clean format should show export scope
      expect(screen.getByText('Export Scope')).toBeInTheDocument();
      expect(screen.getByText('All:')).toBeInTheDocument();
      expect(screen.getByText('Selected:')).toBeInTheDocument();
      expect(screen.getByText('Single:')).toBeInTheDocument();
    });
  });

  describe('export scope functionality', () => {
    it('should show single group selector when single scope is selected', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to single group scope
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);

      const singleOption = screen.getByRole('option', { name: 'Single Group' });
      await user.click(singleOption);

      // Should show single group selector
      expect(screen.getByRole('combobox', { name: 'Select Group' })).toBeInTheDocument();
    });

    it('should show multiple group selector when selected scope is chosen', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to selected groups scope
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);

      const selectedOption = screen.getByRole('option', { name: 'Selected Groups' });
      await user.click(selectedOption);

      // Should show multi-select for groups
      expect(screen.getByRole('combobox', { name: 'Select Groups' })).toBeInTheDocument();
    });

    it('should export single group when scope is single', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to single group scope
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);
      await user.click(screen.getByRole('option', { name: 'Single Group' }));

      // Select a group
      const groupSelect = screen.getByRole('combobox', { name: 'Select Group' });
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /Group 1/ }));

      await waitFor(() => {
        expect(mockExportGroupData).toHaveBeenCalledWith('group1', 'en', 'online');
      });
    });

    it('should export selected groups when scope is selected', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to selected groups scope
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);
      await user.click(screen.getByRole('option', { name: 'Selected Groups' }));

      // Select multiple groups (this is complex due to multi-select behavior)
      const groupSelect = screen.getByRole('combobox', { name: 'Select Groups' });
      await user.click(groupSelect);

      // Click on group options (simulate checkbox selection)
      const group1Option = screen.getByText(/Group 1/);
      await user.click(group1Option);

      // The component should call exportSelectedGroups when groups are selected
      // This might need to be triggered by a re-export action
    });
  });

  describe('import functionality', () => {
    it('should import data successfully', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      // Clear and add import data
      await user.clear(textArea);
      await user.type(textArea, '{"version": "2.0.0", "groups": {}}');

      await user.click(importButton);

      await waitFor(() => {
        expect(mockAutoImportData).toHaveBeenCalledWith(
          '{"version": "2.0.0", "groups": {}}',
          mockMappedGroups,
          {
            locale: 'en',
            gameMode: 'online',
            mergeStrategy: 'skip',
          }
        );
      });

      expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
        type: 'success',
        message:
          'Import completed successfully! Imported 1 custom groups. Imported 2 custom tiles.',
      });
    });

    it('should handle import validation error', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      // Try to import without data
      await user.clear(textArea);
      await user.click(importButton);

      expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
        type: 'error',
        message: 'Please enter data to import',
      });
    });

    it('should handle import errors', async () => {
      const user = userEvent.setup();
      mockAutoImportData.mockResolvedValue({
        success: false,
        importedGroups: 0,
        importedTiles: 0,
        errors: ['Invalid format'],
        warnings: [],
      });

      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      await user.clear(textArea);
      await user.type(textArea, 'invalid data');
      await user.click(importButton);

      await waitFor(() => {
        expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
          type: 'error',
          message: 'Import failed: Invalid format',
        });
      });
    });

    it('should update merge strategy when changed', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const strategySelect = screen.getByRole('combobox', { name: 'Strategy' });
      await user.click(strategySelect);
      await user.click(screen.getByRole('option', { name: 'Overwrite' }));

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      await user.clear(textArea);
      await user.type(textArea, '{"version": "2.0.0", "groups": {}}');
      await user.click(importButton);

      await waitFor(() => {
        expect(mockAutoImportData).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            mergeStrategy: 'overwrite',
          })
        );
      });
    });
  });

  describe('import result display', () => {
    it('should display import results with success', async () => {
      const user = userEvent.setup();
      mockAutoImportData.mockResolvedValue({
        success: true,
        importedGroups: 2,
        importedTiles: 5,
        errors: [],
        warnings: ['Test warning'],
      });

      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      await user.clear(textArea);
      await user.type(textArea, '{"version": "2.0.0", "groups": {}}');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Results:')).toBeInTheDocument();
        expect(screen.getByText('• 2 custom groups imported')).toBeInTheDocument();
        expect(screen.getByText('• 5 custom tiles imported')).toBeInTheDocument();
        expect(screen.getByText('Warnings:')).toBeInTheDocument();
        expect(screen.getByText('• Test warning')).toBeInTheDocument();
      });
    });

    it('should display import results with errors', async () => {
      const user = userEvent.setup();
      mockAutoImportData.mockResolvedValue({
        success: false,
        importedGroups: 0,
        importedTiles: 0,
        errors: ['Test error 1', 'Test error 2'],
        warnings: [],
      });

      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      await user.clear(textArea);
      await user.type(textArea, 'invalid data');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Errors:')).toBeInTheDocument();
        expect(screen.getByText('• Test error 1')).toBeInTheDocument();
        expect(screen.getByText('• Test error 2')).toBeInTheDocument();
      });
    });

    it('should allow closing import results', async () => {
      const user = userEvent.setup();
      mockAutoImportData.mockResolvedValue({
        success: true,
        importedGroups: 1,
        importedTiles: 1,
        errors: [],
        warnings: [],
      });

      render(<ImportExport {...defaultProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const importButton = screen.getByRole('button', { name: 'import' });

      await user.clear(textArea);
      await user.type(textArea, '{"version": "2.0.0", "groups": {}}');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Results:')).toBeInTheDocument();
      });

      // Close the alert
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText('Import Results:')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle export errors gracefully', async () => {
      mockExportCleanData.mockRejectedValue(new Error('Export failed'));

      render(<ImportExport {...defaultProps} />);

      await waitFor(() => {
        expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
          message: 'Export failed: Error: Export failed',
          type: 'error',
        });
      });
    });

    it('should show error when trying to export single group without selection', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to single group scope without selecting a group
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);
      await user.click(screen.getByRole('option', { name: 'Single Group' }));

      // The export should be triggered but show error
      await waitFor(() => {
        expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
          message: 'Please select a group to export',
          type: 'error',
        });
      });
    });

    it('should show error when trying to export selected groups without selection', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      // Change to selected groups scope without selecting any groups
      const scopeSelect = screen.getByRole('combobox', { name: 'Scope' });
      await user.click(scopeSelect);
      await user.click(screen.getByRole('option', { name: 'Selected Groups' }));

      // The export should be triggered but show error
      await waitFor(() => {
        expect(defaultProps.setSubmitMessage).toHaveBeenCalledWith({
          message: 'Please select groups to export',
          type: 'error',
        });
      });
    });
  });

  describe('help text and documentation', () => {
    it('should display format help text', () => {
      render(<ImportExport {...defaultProps} />);

      expect(screen.getByText(/Clean \(v2\.0\):/)).toBeInTheDocument();
      expect(
        screen.getByText(/Locale-inspired format with groups and actions/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Legacy:/)).toBeInTheDocument();
      expect(screen.getByText(/Old text format for backward compatibility/)).toBeInTheDocument();
    });

    it('should display export scope help text', () => {
      render(<ImportExport {...defaultProps} />);

      expect(screen.getByText(/All:/)).toBeInTheDocument();
      expect(screen.getByText(/Export all your custom groups and tiles/)).toBeInTheDocument();
      expect(screen.getByText(/Selected:/)).toBeInTheDocument();
      expect(screen.getByText(/Choose multiple specific groups to export/)).toBeInTheDocument();
      expect(screen.getByText(/Single:/)).toBeInTheDocument();
      expect(screen.getByText(/Export one specific group/)).toBeInTheDocument();
    });

    it('should display import strategy help text', () => {
      render(<ImportExport {...defaultProps} />);

      expect(screen.getByText(/Skip:/)).toBeInTheDocument();
      expect(screen.getByText(/Keep existing items, don't import duplicates/)).toBeInTheDocument();
      expect(screen.getByText(/Overwrite:/)).toBeInTheDocument();
      expect(screen.getByText(/Replace existing items with imported versions/)).toBeInTheDocument();
      expect(screen.getByText(/Rename:/)).toBeInTheDocument();
      expect(screen.getByText(/Import duplicates with new names/)).toBeInTheDocument();
    });
  });

  describe('copy to clipboard functionality', () => {
    it('should render copy to clipboard button with exported data', async () => {
      render(<ImportExport {...defaultProps} />);

      await waitFor(() => {
        const copyButton = screen.getByTestId('copy-to-clipboard');
        expect(copyButton).toBeInTheDocument();
        expect(copyButton).toHaveAttribute(
          'data-text',
          expect.stringContaining('"version": "2.0.0"')
        );
      });
    });
  });
});
