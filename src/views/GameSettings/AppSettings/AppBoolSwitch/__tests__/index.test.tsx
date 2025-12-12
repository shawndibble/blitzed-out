import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppBoolSwitch from '../index';
import { Settings } from '@/types/Settings';

// Mock YesNoSwitch to avoid i18next translation complexities
vi.mock('@/components/GameForm/YesNoSwitch', () => ({
  default: ({
    trueCondition,
    onChange,
    yesLabel,
  }: {
    trueCondition: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    yesLabel: string;
  }) => (
    <label data-testid="yes-no-switch">
      <input
        type="checkbox"
        checked={trueCondition}
        onChange={onChange}
        data-testid={`switch-${yesLabel}`}
      />
      {yesLabel}: {trueCondition ? 'on' : 'off'}
    </label>
  ),
}));

describe('AppBoolSwitch', () => {
  const createFormData = (overrides: Partial<Settings> = {}): Settings =>
    ({
      room: 'test-room',
      displayName: 'Test User',
      ...overrides,
    }) as Settings;

  describe('defaultValue behavior', () => {
    it('should use field value when it is explicitly true', () => {
      const formData = createFormData({ showDiceAnimation: true });
      const handleSwitch = vi.fn();

      render(
        <AppBoolSwitch
          field="showDiceAnimation"
          formData={formData}
          handleSwitch={handleSwitch}
          defaultValue={false}
        />
      );

      const checkbox = screen.getByTestId('switch-showDiceAnimation') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should use field value when it is explicitly false', () => {
      const formData = createFormData({ showDiceAnimation: false });
      const handleSwitch = vi.fn();

      render(
        <AppBoolSwitch
          field="showDiceAnimation"
          formData={formData}
          handleSwitch={handleSwitch}
          defaultValue={true}
        />
      );

      const checkbox = screen.getByTestId('switch-showDiceAnimation') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should use defaultValue when field is undefined', () => {
      const formData = createFormData({ showDiceAnimation: undefined });
      const handleSwitch = vi.fn();

      render(
        <AppBoolSwitch
          field="showDiceAnimation"
          formData={formData}
          handleSwitch={handleSwitch}
          defaultValue={true}
        />
      );

      const checkbox = screen.getByTestId('switch-showDiceAnimation') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should default to false when no defaultValue provided and field is undefined', () => {
      const formData = createFormData({});
      const handleSwitch = vi.fn();

      render(
        <AppBoolSwitch field="playerDialog" formData={formData} handleSwitch={handleSwitch} />
      );

      const checkbox = screen.getByTestId('switch-playerDialog') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('handleSwitch callback', () => {
    it('should call handleSwitch with event and field name', () => {
      const formData = createFormData({ showDiceAnimation: true });
      const handleSwitch = vi.fn();

      render(
        <AppBoolSwitch field="showDiceAnimation" formData={formData} handleSwitch={handleSwitch} />
      );

      const checkbox = screen.getByTestId('switch-showDiceAnimation');
      fireEvent.click(checkbox);

      expect(handleSwitch).toHaveBeenCalledTimes(1);
      expect(handleSwitch).toHaveBeenCalledWith(expect.any(Object), 'showDiceAnimation');
    });
  });
});
