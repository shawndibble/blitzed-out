import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SizePaceSection from '../SizePaceSection';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const makeFormData = (overrides: Partial<Settings>): Settings =>
  ({
    gameMode: 'solo',
    room: 'PUBLIC',
    boardUpdated: false,
    selectedActions: {},
    ...overrides,
  }) as unknown as Settings;

describe('SizePaceSection', () => {
  const setFormData = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    setFormData.mockClear();
  });

  it('accepts granular tile counts, not just 10-step increments', () => {
    render(<SizePaceSection formData={makeFormData({})} setFormData={setFormData} />);

    const slider = screen.getByRole('slider', { name: 'roomTileCount' });
    fireEvent.change(slider, { target: { value: 47 } });

    const next = setFormData.mock.calls[0][0];
    expect(next.roomTileCount).toBe(47);
    expect(next.roomUpdated).toBe(true);
  });

  it('works in a public room — board size is board scope, not room scope', () => {
    render(
      <SizePaceSection formData={makeFormData({ room: 'PUBLIC' })} setFormData={setFormData} />
    );
    expect(screen.getByRole('slider', { name: 'roomTileCount' })).toBeEnabled();
  });

  it('shows the roll estimate for the current size and dice', () => {
    render(
      <SizePaceSection
        formData={makeFormData({ roomTileCount: 60, roomDice: '1d6' })}
        setFormData={setFormData}
      />
    );
    // 60 tiles / 3.5 avg per 1d6 roll = 17
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('changing dice updates form data', async () => {
    render(
      <SizePaceSection
        formData={makeFormData({ roomTileCount: 60, roomDice: '1d6' })}
        setFormData={setFormData}
      />
    );
    await user.click(screen.getByRole('combobox', { name: 'roomDice' }));
    await user.click(screen.getByRole('option', { name: '2d4' }));

    const next = setFormData.mock.calls[0][0];
    expect(next.roomDice).toBe('2d4');
    expect(next.roomUpdated).toBe(true);
  });
});
