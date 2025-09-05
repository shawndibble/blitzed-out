import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import BackgroundSelect from '../index';
import { Settings } from '@/types/Settings';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        background: 'Background',
        useRoomBackground: 'Use Room Background',
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
    it('should handle empty/undefined backgrounds correctly', () => {
      // Test with undefined background - just verify the component renders without errors
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

      // Component should render successfully with hidden input having empty value
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
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
        roomBackground: 'color',
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
      expect(initialSelect).toHaveTextContent('None - Color Tiles');

      // Change formData externally to a different background
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
  });

  describe('Edge Cases', () => {
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
