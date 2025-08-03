import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import BackgroundSelect from '../index';
import { Settings } from '@/types/Settings';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        background: 'Background',
        useAppBackground: 'Use App Background',
        color: 'None - Color Tiles',
        gray: 'None - Gray Tiles',
        hypnoDick: 'Hypno Dick',
        pinkSpiral: 'Pink Spiral',
        customURL: 'Custom URL',
        url: 'URL',
        supportedSites: 'Supported sites',
        requiresEmbeddedUrl: 'Requires embedded URL',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BackgroundSelect Component', () => {
  const mockSetFormData = vi.fn();

  const defaultBackgrounds = {
    useAppBackground: 'Use App Background',
    color: 'None - Color Tiles',
    gray: 'None - Gray Tiles',
    'metronome.gif': 'Hypno Dick',
    'pink-spiral.gif': 'Pink Spiral',
    custom: 'Custom URL',
  };

  beforeEach(() => {
    mockSetFormData.mockClear();
  });

  describe('Default Value Behavior', () => {
    it('should show default room background when roomBackground is undefined', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        // roomBackground is undefined
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Check that the select shows the correct text and has the correct value
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('Use App Background');

      // Check the hidden input has the correct value
      const hiddenInput = screen.getByDisplayValue('useAppBackground');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('should show default app background when background is undefined', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        // background is undefined
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={false}
        />
      );

      // Check that the select shows the correct text and has the correct value
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('None - Color Tiles');

      // Check the hidden input has the correct value
      const hiddenInput = screen.getByDisplayValue('color');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('should never show blank/empty value in select', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: '', // Empty string
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Should default to 'useAppBackground' instead of showing empty
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('Use App Background');

      const hiddenInput = screen.getByDisplayValue('useAppBackground');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('should initialize formData with default value when not set', async () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        // roomBackground is undefined
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalledWith({
          ...formData,
          roomBackground: 'useAppBackground',
        });
      });
    });
  });

  describe('Room vs App Background Context', () => {
    it('should use roomBackground key when isRoom=true', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'gray',
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('None - Gray Tiles');
    });

    it('should use background key when isRoom=false', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        background: 'gray',
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={false}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('None - Gray Tiles');
    });
  });

  describe('User Interactions', () => {
    it('should update formData when user changes selection', async () => {
      const user = userEvent.setup();
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'useAppBackground',
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      const grayOption = screen.getByText('None - Gray Tiles');
      await user.click(grayOption);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formData,
        roomBackground: 'gray',
      });
    });

    it('should show custom URL field when custom is selected', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'custom',
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      const urlField = screen.getByLabelText('URL');
      expect(urlField).toBeInTheDocument();
    });

    it('should update roomBackgroundURL when custom URL is entered', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'custom',
        roomBackgroundURL: '',
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      const urlField = screen.getByLabelText('URL');
      fireEvent.change(urlField, { target: { value: 'https://example.com/bg.jpg' } });

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formData,
        roomBackground: 'custom',
        roomBackgroundURL: 'https://example.com/bg.jpg',
        roomUpdated: true,
      });
    });
  });

  describe('State Synchronization', () => {
    it('should sync component state when formData changes externally', () => {
      const initialFormData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'useAppBackground',
      };

      const { rerender } = render(
        <BackgroundSelect
          formData={initialFormData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Verify initial value
      const initialSelect = screen.getByRole('combobox');
      expect(initialSelect).toHaveTextContent('Use App Background');

      // Change formData externally
      const updatedFormData: Settings = {
        ...initialFormData,
        roomBackground: 'gray',
      };

      rerender(
        <BackgroundSelect
          formData={updatedFormData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Should sync to new value
      const updatedSelect = screen.getByRole('combobox');
      expect(updatedSelect).toHaveTextContent('None - Gray Tiles');
    });

    it('should handle formData prop changes gracefully', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'color',
      };

      const { rerender } = render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Change to undefined (should fallback to default)
      rerender(
        <BackgroundSelect
          formData={{ ...formData, roomBackground: undefined }}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Should show default, not empty
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('Use App Background');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null formData gracefully', () => {
      render(
        <BackgroundSelect
          formData={null as any}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      // Should still render with default
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveTextContent('Use App Background');
    });

    it('should handle missing backgroundURL field', () => {
      const formData: Settings = {
        gameMode: 'online',
        boardUpdated: false,
        room: 'test-room',
        roomBackground: 'custom',
        // roomBackgroundURL is undefined
      };

      render(
        <BackgroundSelect
          formData={formData}
          setFormData={mockSetFormData}
          backgrounds={defaultBackgrounds}
          isRoom={true}
        />
      );

      const urlField = screen.getByLabelText('URL');
      expect(urlField).toHaveValue('');
    });
  });
});
