import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportExport from '../index';
import { DBGameBoard } from '@/types/gameBoard';

// Mock dependencies
vi.mock('@/stores/gameBoard', () => ({
  updateBoard: vi.fn(),
}));

vi.mock('@/components/CopyToClipboard', () => ({
  default: vi.fn(({ text, copiedText, icon, tooltip }) => (
    <div
      data-testid="copy-to-clipboard"
      data-text={text}
      data-copied-text={copiedText}
      data-tooltip={tooltip}
    >
      Copy Button
      {icon && <span data-testid="copy-icon">{icon}</span>}
    </div>
  )),
}));

import { updateBoard } from '@/stores/gameBoard';

describe('ImportExport', () => {
  const mockBoard: DBGameBoard = {
    id: 1,
    title: 'Test Board',
    tiles: [
      { title: 'Start', description: 'Welcome to the game!' },
      { title: 'Action 1', description: 'Perform first action' },
      { title: 'Action 2', description: 'Perform second action' },
      { title: 'Finish', description: 'Game complete!' },
    ],
    isActive: 1,
    tags: ['test'],
    gameMode: 'online',
  };

  const mockProps = {
    open: true,
    close: vi.fn(),
    setAlert: vi.fn(),
    board: mockBoard,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateBoard).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render title field and text area', () => {
      render(<ImportExport {...mockProps} />);

      expect(screen.getByDisplayValue('Test Board')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument(); // Multiline textbox
    });

    it('should populate text area with exported board data on open', () => {
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const expectedContent =
        '[Start]\nWelcome to the game!\n~~\n[Action 1]\nPerform first action\n~~\n[Action 2]\nPerform second action\n~~\n[Finish]\nGame complete!';

      expect(textArea).toHaveValue(expectedContent);
    });

    it('should render save button and copy buttons', () => {
      render(<ImportExport {...mockProps} />);

      expect(screen.getByLabelText('save')).toBeInTheDocument();
      expect(screen.getAllByTestId('copy-to-clipboard')).toHaveLength(2);
    });
  });

  describe('export functionality', () => {
    it('should format board tiles correctly for export', () => {
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const content = textArea.value;

      expect(content).toContain('[Start]');
      expect(content).toContain('Welcome to the game!');
      expect(content).toContain('~~');
      expect(content).toContain('[Action 1]');
      expect(content).toContain('Perform first action');
    });

    it('should handle empty tiles array', () => {
      const boardWithEmptyTiles = { ...mockBoard, tiles: [] };
      const propsWithEmptyBoard = { ...mockProps, board: boardWithEmptyTiles };

      render(<ImportExport {...propsWithEmptyBoard} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      expect(textArea).toHaveValue('');
    });

    it('should handle undefined tiles', () => {
      const boardWithUndefinedTiles = { ...mockBoard, tiles: undefined };
      const propsWithUndefinedTiles = { ...mockProps, board: boardWithUndefinedTiles };

      render(<ImportExport {...propsWithUndefinedTiles} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      expect(textArea).toHaveValue('');
    });
  });

  describe('import functionality', () => {
    it('should import valid board data successfully', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const importData =
        '[New Action]\nNew action description\n~~\n[Another Action]\nAnother description';

      await user.clear(textArea);
      fireEvent.change(textArea, { target: { value: importData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(updateBoard).toHaveBeenCalledWith({
        ...mockBoard,
        title: 'Test Board',
        tiles: [
          { title: 'New Action', description: 'New action description' },
          { title: 'Another Action', description: 'Another description' },
        ],
      });

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'saved',
        type: 'success',
      });

      expect(mockProps.close).toHaveBeenCalled();
    });

    it('should handle multiline descriptions', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const multilineData =
        '[Title]\nFirst line\nSecond line\nThird line\n~~\n[Another]\nMore content';

      await user.clear(textArea);
      fireEvent.change(textArea, { target: { value: multilineData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(updateBoard).toHaveBeenCalledWith({
        ...mockBoard,
        title: 'Test Board',
        tiles: [
          { title: 'Title', description: 'First line\nSecond line\nThird line' },
          { title: 'Another', description: 'More content' },
        ],
      });
    });

    it('should show error for missing title requirement', async () => {
      const user = userEvent.setup();
      const propsWithEmptyTitle = { ...mockProps, board: { ...mockBoard, title: '' } };
      render(<ImportExport {...propsWithEmptyTitle} />);

      const titleField = screen.getByRole('textbox', { name: /title/i });
      await user.clear(titleField);

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importTitleRequired',
      });

      expect(updateBoard).not.toHaveBeenCalled();
      expect(mockProps.close).not.toHaveBeenCalled();
    });

    it('should show error for invalid tile format', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      const invalidData = 'Invalid Format\nNo brackets';

      await user.clear(textArea);
      await user.type(textArea, invalidData);

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importInvalidTitle',
      });

      expect(updateBoard).not.toHaveBeenCalled();
    });

    it('should show error for missing description', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const invalidData = '[Valid Title]';

      await user.clear(textArea);
      fireEvent.change(textArea, { target: { value: invalidData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importMissingDescription',
      });

      expect(updateBoard).not.toHaveBeenCalled();
    });

    it('should show info message when no changes detected', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      // Don't change the text area content (it's already populated with current board)
      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importNoChange',
      });

      expect(updateBoard).not.toHaveBeenCalled();
      expect(mockProps.close).not.toHaveBeenCalled();
    });
  });

  describe('title editing', () => {
    it('should update board title on blur', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const titleField = screen.getByRole('textbox', { name: /title/i });
      await user.clear(titleField);
      await user.type(titleField, 'Updated Title');

      // Trigger blur event
      await user.tab();

      expect(updateBoard).toHaveBeenCalledWith({
        ...mockBoard,
        title: 'Updated Title',
      });
    });

    it('should show error when trying to save with empty title', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const titleField = screen.getByRole('textbox', { name: /title/i });
      await user.clear(titleField);
      await user.tab();

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importTitleRequired',
      });

      expect(updateBoard).not.toHaveBeenCalled();
    });
  });

  describe('copy functionality', () => {
    it('should render copy to clipboard buttons with correct text', () => {
      render(<ImportExport {...mockProps} />);

      const copyButtons = screen.getAllByTestId('copy-to-clipboard');
      expect(copyButtons).toHaveLength(2);

      // First button should copy the text content
      const expectedText =
        '[Start]\nWelcome to the game!\n~~\n[Action 1]\nPerform first action\n~~\n[Action 2]\nPerform second action\n~~\n[Finish]\nGame complete!';
      expect(copyButtons[0]).toHaveAttribute('data-text', expectedText);

      // Second button should copy the share link
      expect(copyButtons[1]).toHaveAttribute('data-text', `${window.location.href}?importBoard=1`);
      expect(copyButtons[1]).toHaveAttribute('data-copied-text', 'copiedLink');
      expect(copyButtons[1]).toHaveAttribute('data-tooltip', 'copyShareLink');
    });
  });

  describe('text area manipulation', () => {
    it('should update text area content when typing', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' });
      await user.clear(textArea);
      await user.type(textArea, 'New content');

      expect(textArea).toHaveValue('New content');
    });

    it('should handle text content updates', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const newContent = '[New]\nNew description';

      await user.clear(textArea);
      fireEvent.change(textArea, { target: { value: newContent } });

      expect(textArea).toHaveValue(newContent);
    });
  });

  describe('validation edge cases', () => {
    it('should handle tiles with empty entries', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const invalidData = '[Valid]\nDescription\n~~\n\n~~\n[Another]\nAnother description';

      await user.clear(textArea);
      fireEvent.change(textArea, { target: { value: invalidData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(mockProps.setAlert).toHaveBeenCalledWith({
        message: 'importNoEmpty',
      });
    });

    it('should handle tiles with special characters in titles', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const specialCharsData = '[Title with @#$%]\nDescription with special chars !@#$%^&*()';

      await user.clear(textArea);
      // Use fireEvent instead of userEvent to avoid special character issues
      fireEvent.change(textArea, { target: { value: specialCharsData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(updateBoard).toHaveBeenCalledWith({
        ...mockBoard,
        title: 'Test Board',
        tiles: [
          { title: 'Title with @#$%', description: 'Description with special chars !@#$%^&*()' },
        ],
      });
    });

    it('should handle inconsistent separator usage', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      const inconsistentData =
        '[First]\nFirst description\n~~~\n[Second]\nSecond description\n~~~~~\n[Third]\nThird description';

      await user.clear(textArea);
      // Use fireEvent instead of userEvent to avoid special character issues
      fireEvent.change(textArea, { target: { value: inconsistentData } });

      const saveButton = screen.getByLabelText('save');
      await user.click(saveButton);

      expect(updateBoard).toHaveBeenCalledWith({
        ...mockBoard,
        title: 'Test Board',
        tiles: [
          { title: 'First', description: 'First description' },
          { title: 'Second', description: 'Second description' },
          { title: 'Third', description: 'Third description' },
        ],
      });
    });
  });

  describe('error handling', () => {
    it('should handle updateBoard failure', async () => {
      vi.mocked(updateBoard).mockRejectedValue(new Error('Update failed'));

      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      const titleField = screen.getByRole('textbox', { name: /title/i });
      await user.clear(titleField);
      await user.type(titleField, 'New Title');
      await user.tab();

      // Should handle the error gracefully without crashing
      expect(updateBoard).toHaveBeenCalled();
    });
  });

  describe('component lifecycle', () => {
    it('should export board data when component opens', () => {
      const { rerender } = render(<ImportExport {...mockProps} open={false} />);

      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      expect(textArea).toHaveValue('');

      rerender(<ImportExport {...mockProps} open={true} />);

      // Should populate with exported data when opened
      expect(textArea.value).toContain('[Start]');
    });

    it('should handle board changes during component lifecycle', async () => {
      const updatedBoard = { ...mockBoard, title: 'Updated Board' };
      const updatedProps = { ...mockProps, board: updatedBoard };

      // First render with original props
      const { rerender } = render(<ImportExport {...mockProps} />);

      // Verify initial state
      const textArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
      expect(textArea.value).toContain('[Start]');
      const titleField = screen.getByRole('textbox', { name: /title/i });
      expect(titleField).toHaveValue('Test Board');

      // Re-render with updated props
      act(() => {
        rerender(<ImportExport {...updatedProps} />);
      });

      // Wait for title field to update and verify
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Updated Board');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper labels and structure', () => {
      render(<ImportExport {...mockProps} />);

      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
      expect(screen.getByLabelText('save')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...mockProps} />);

      // Should be able to tab through all interactive elements
      await user.tab(); // Title field
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveFocus();

      await user.tab(); // Text area
      expect(screen.getByRole('textbox', { name: '' })).toHaveFocus();

      await user.tab(); // Save button
      expect(screen.getByLabelText('save')).toHaveFocus();
    });
  });
});
