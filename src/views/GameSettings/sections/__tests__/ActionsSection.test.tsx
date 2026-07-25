import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ActionsSection from '../ActionsSection';
import type { Settings } from '@/types/Settings';

// The picker's open state lives inside ActionsSection again, now that the page
// header no longer has its own duplicate "+ Add" button to open it.
type HarnessProps = Omit<Parameters<typeof ActionsSection>[0], 'onManageCustomTiles'> & {
  onManageCustomTiles?: () => void;
};

function Harness({ onManageCustomTiles = () => {}, ...props }: HarnessProps) {
  return <ActionsSection {...props} onManageCustomTiles={onManageCustomTiles} />;
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

// Shaped like what useUnifiedActionList really produces: `actions` keyed by
// intensity label with EMPTY arrays — the catalog never carries tile text.
// Role-bearing-ness therefore arrives as the `usesRoleTokens` flag, computed
// where the text does exist (getTileCountsByGroup). Fixtures that inlined action
// strings made this component look like it could detect roles itself; it can't,
// and in production it never did.
const ACTIONS_LIST = {
  alcohol: {
    label: 'Alcohol',
    type: 'consumption',
    intensities: { 1: 'Sip/Drink', 2: 'Shots', 3: 'Chug' },
    actions: { 'Sip/Drink': [], Shots: [], Chug: [] },
    usesRoleTokens: false,
  },
  buttPlay: {
    label: 'Butt Play',
    type: 'sex',
    dom: 'Top',
    sub: 'Bottom',
    intensities: { 1: 'Finger(s)/Rimmed', 2: 'Fucking' },
    actions: { 'Finger(s)/Rimmed': [], Fucking: [] },
    usesRoleTokens: true,
  },
  kissing: {
    label: 'Kissing',
    type: 'foreplay',
    intensities: { 1: 'Gentle Kisses', 2: 'Deep Kisses' },
    actions: { 'Gentle Kisses': [], 'Deep Kisses': [] },
    usesRoleTokens: false,
  },
  bating: {
    label: 'Bating',
    type: 'solo',
    intensities: { 1: 'Masturbation', 2: 'Edging' },
    actions: { Masturbation: [], Edging: [] },
    usesRoleTokens: false,
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

  it('renders content warnings above the Add actions button and Finish options, not below them', () => {
    const { container } = render(
      <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
    );
    const order = Array.from(
      container.querySelectorAll(
        '[data-testid="warning-alert"], [data-testid="content-warning"], [data-testid="finish-range-row"]'
      )
    ).map((el) => el.getAttribute('data-testid'));
    expect(order).toEqual(['warning-alert', 'content-warning', 'finish-range-row']);

    const addButton = screen.getByText(/addActions/);
    const warningAlert = screen.getByTestId('warning-alert');
    expect(
      warningAlert.compareDocumentPosition(addButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

  // Role is a select, matching the consumption variation select — same kind of
  // per-group qualifier, so the same control.
  it('shows a per-group role select only for role-bearing groups in With Others', () => {
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
    // buttPlay carries {dom}/{sub} tokens (usesRoleTokens); kissing doesn't.
    const roleSelects = screen.getAllByRole('combobox', { name: /role/ });
    expect(roleSelects).toHaveLength(1);
    expect(roleSelects[0]).toHaveTextContent('Bottom');
  });

  it('uses the group’s own role wording when it supplies one', () => {
    render(
      <Harness
        formData={makeFormData({ selectedActions: { buttPlay: { type: 'sex', levels: [1] } } })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    // Butt Play labels its sides Top/Bottom rather than Dominant/Submissive.
    expect(screen.getByRole('combobox', { name: /role/ })).toHaveTextContent('Bottom');
  });

  it('writes the chosen role onto the group entry', async () => {
    render(
      <Harness
        formData={makeFormData({ selectedActions: { buttPlay: { type: 'sex', levels: [1] } } })}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
      />
    );
    await user.click(screen.getByRole('combobox', { name: /role/ }));
    await user.click(screen.getByRole('option', { name: 'Top' }));

    const next = setFormData.mock.calls[0][0];
    expect(next.selectedActions.buttPlay.role).toBe('dom');
    expect(next.boardUpdated).toBe(true);
  });

  it('hides the role select on a shared device — roles come from player setup', () => {
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
    expect(screen.queryByRole('combobox', { name: /role/ })).not.toBeInTheDocument();
    expect(screen.getByText('actionsBannerSharedDevice')).toBeInTheDocument();
  });

  // Participation is chosen in the setup section now (see SetupSection.test),
  // not here. This section only states the consequence.
  it('offers no participation control of its own', () => {
    render(
      <Harness formData={makeFormData({})} setFormData={setFormData} actionsList={ACTIONS_LIST} />
    );
    expect(screen.queryByRole('group', { name: 'participation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'participationSolo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'participationTogether' })).not.toBeInTheDocument();
  });

  it('the manage custom actions button invokes onManageCustomTiles', async () => {
    const onManageCustomTiles = vi.fn();
    render(
      <Harness
        formData={makeFormData({})}
        setFormData={setFormData}
        actionsList={ACTIONS_LIST}
        onManageCustomTiles={onManageCustomTiles}
      />
    );
    await user.click(screen.getByRole('button', { name: /customTilesLabel/ }));
    expect(onManageCustomTiles).toHaveBeenCalledTimes(1);
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
