import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useState } from 'react';

import ActionsSection from '../ActionsSection';
import type { Settings } from '@/types/Settings';

type HarnessProps = Omit<Parameters<typeof ActionsSection>[0], 'pickerOpen' | 'onPickerOpenChange'>;

function Harness(props: HarnessProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return <ActionsSection {...props} pickerOpen={pickerOpen} onPickerOpenChange={setPickerOpen} />;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'count' in opts ? `${key}:${opts.count}` : opts?.label ? `${key}:${opts.label}` : key,
  }),
}));

vi.mock('../FinishRangeRow', () => ({
  default: () => <div data-testid="finish-range-row" />,
}));
vi.mock('../../BoardSettings/WarningAlert', () => ({
  default: () => <div data-testid="warning-alert" />,
}));
vi.mock('../../BoardSettings/ContentWarning', () => ({
  default: () => <div data-testid="content-warning" />,
}));
vi.mock('@/hooks/useBreakpoint', () => ({ default: () => false }));

const ACTIONS_LIST = {
  alcohol: {
    label: 'Alcohol',
    type: 'consumption',
    intensities: { 1: 'Sip/Drink', 2: 'Shots', 3: 'Chug' },
    actions: { 'Sip/Drink': ['Take a sip'] },
  },
  buttPlay: {
    label: 'Butt Play',
    type: 'sex',
    dom: 'Top',
    sub: 'Bottom',
    intensities: { 1: 'Finger(s)/Rimmed', 2: 'Fucking' },
    actions: { 'Finger(s)/Rimmed': ['{dom} rubs {sub}.'] },
  },
  kissing: {
    label: 'Kissing',
    type: 'foreplay',
    intensities: { 1: 'Gentle Kisses', 2: 'Deep Kisses' },
    actions: { 'Gentle Kisses': ['Kiss gently'] },
  },
  bating: {
    label: 'Bating',
    type: 'solo',
    intensities: { 1: 'Masturbation', 2: 'Edging' },
    actions: { Masturbation: ['Stroke'] },
  },
};

const makeFormData = (overrides: Partial<Settings>): Settings =>
  ({
    gameMode: 'online',
    soloPlay: false,
    room: 'KHLOE',
    boardUpdated: false,
    selectedActions: {},
    ...overrides,
  }) as unknown as Settings;

describe('ActionsSection (loadout)', () => {
  const setFormData = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    setFormData.mockClear();
  });

  it('shows only enabled groups as cards, not the whole catalog', () => {
    render(
      <Harness
        formData={makeFormData({
          selectedActions: { alcohol: { type: 'consumption', levels: [1, 2] } },
        })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    expect(screen.getByText('Alcohol')).toBeInTheDocument();
    expect(screen.queryByText('Butt Play')).not.toBeInTheDocument();
    expect(screen.queryByText('Kissing')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing is enabled', () => {
    render(
      <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
    );
    expect(screen.getByText('noActionsEnabled')).toBeInTheDocument();
  });

  it('toggling an intensity chip updates the group levels', async () => {
    render(
      <Harness
        formData={makeFormData({
          selectedActions: { alcohol: { type: 'consumption', levels: [1] } },
        })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    await user.click(screen.getByText('Shots'));

    const next = setFormData.mock.calls[0][0];
    expect(next.selectedActions.alcohol.levels).toEqual([1, 2]);
    expect(next.boardUpdated).toBe(true);
  });

  it('shows a per-group role toggle for role-bearing groups in With Others group play', () => {
    render(
      <Harness
        formData={makeFormData({
          selectedActions: {
            buttPlay: { type: 'sex', levels: [1] },
            kissing: { type: 'foreplay', levels: [1] },
          },
        })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    // buttPlay's actions use {dom}/{sub} tokens; kissing's don't.
    expect(screen.getByRole('button', { name: 'Top' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bottom' })).toBeInTheDocument();
    const roleGroups = screen.getAllByRole('group', { name: /role/ });
    expect(roleGroups).toHaveLength(1);
  });

  it('hides role toggles on a shared device — roles come from player setup', () => {
    render(
      <Harness
        formData={makeFormData({
          gameMode: 'local',
          selectedActions: { buttPlay: { type: 'sex', levels: [1] } },
        })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    expect(screen.queryByRole('button', { name: 'Top' })).not.toBeInTheDocument();
    expect(screen.getByText('actionsBannerSharedDevice')).toBeInTheDocument();
  });

  it('participation toggle appears only in With Others and writes soloPlay', async () => {
    render(
      <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
    );
    await user.click(screen.getByRole('button', { name: 'participationSolo' }));
    expect(setFormData.mock.calls[0][0].soloPlay).toBe(true);
  });

  it('marks an enabled group unavailable when the mode no longer offers it', () => {
    render(
      <Harness
        formData={makeFormData({
          gameMode: 'solo',
          soloPlay: true,
          selectedActions: { buttPlay: { type: 'sex', levels: [1] } },
        })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    expect(screen.getByText('notAvailableInMode')).toBeInTheDocument();
  });

  describe('add actions picker', () => {
    it('lists only not-yet-enabled groups for the current participation', async () => {
      render(
        <Harness
          formData={makeFormData({
            selectedActions: { alcohol: { type: 'consumption', levels: [1] } },
          })}
          setFormData={setFormData}
          actionsList={ACTIONS_LIST}
        />
      );
      await user.click(screen.getByRole('button', { name: /addActions/ }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Butt Play')).toBeInTheDocument();
      expect(within(dialog).getByText('Kissing')).toBeInTheDocument();
      // Enabled group and solo-only group are excluded in group play.
      expect(within(dialog).queryByText('Alcohol')).not.toBeInTheDocument();
      expect(within(dialog).queryByText('Bating')).not.toBeInTheDocument();
    });

    it('search filters the catalog', async () => {
      render(
        <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
      );
      await user.click(screen.getByRole('button', { name: /addActions/ }));
      await user.type(screen.getByRole('textbox', { name: 'searchActions' }), 'kiss');

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Kissing')).toBeInTheDocument();
      expect(within(dialog).queryByText('Butt Play')).not.toBeInTheDocument();
    });

    it('adding a group preselects its first intensity level', async () => {
      render(
        <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
      );
      await user.click(screen.getByRole('button', { name: /addActions/ }));
      await user.click(within(screen.getByRole('dialog')).getByText('Kissing'));

      const next = setFormData.mock.calls[0][0];
      expect(next.selectedActions.kissing).toEqual({ type: 'foreplay', levels: [1] });
    });

    it('offers solo groups instead of partnered ones when everyone plays solo', async () => {
      render(
        <Harness
          formData={makeFormData({ soloPlay: true })}
          setFormData={setFormData}
          actionsList={ACTIONS_LIST}
        />
      );
      await user.click(screen.getByRole('button', { name: /addActions/ }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Bating')).toBeInTheDocument();
      expect(within(dialog).queryByText('Butt Play')).not.toBeInTheDocument();
    });
  });

  describe('remove with undo', () => {
    it('removing a group deletes it and offers undo', async () => {
      render(
        <Harness
          formData={makeFormData({
            selectedActions: { alcohol: { type: 'consumption', levels: [1] } },
          })}
          setFormData={setFormData}
          actionsList={ACTIONS_LIST}
        />
      );
      await user.click(screen.getByRole('button', { name: 'removeAction:Alcohol' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.selectedActions).toEqual({});

      await user.click(screen.getByRole('button', { name: 'undo' }));
      const restored = setFormData.mock.calls[1][0];
      expect(restored.selectedActions.alcohol).toEqual({ type: 'consumption', levels: [1] });
    });
  });
});
