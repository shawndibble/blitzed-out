import { renderWithoutProviders } from '@/test-utils';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Packs from '../index';

const h = vi.hoisted(() => ({ isAnonymous: false }));

vi.mock('@mui/icons-material', () => ({ Publish: () => null }));
vi.mock('@/context/hooks/useAuth', () => ({ default: () => ({ isAnonymous: h.isAnonymous }) }));
vi.mock('@/stores/settingsStore', () => ({
  useGameSettings: () => ({ settings: { gameMode: 'online', locale: 'en' } }),
}));
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [
    { name: 'g1', label: 'Group One', tileCount: 3 },
    { name: 'g2', label: 'Group Two', tileCount: 5 },
  ],
}));
vi.mock('@/services/contentPacks', () => ({
  listPublishableGroups: vi.fn(),
  buildPackContents: vi.fn(async () => ({ contents: '{}', contentHash: 'sha256-x' })),
  publishPack: vi.fn(async () => 'pack123'),
  getPack: vi.fn(),
}));

const noop = () => () => {};

beforeEach(() => {
  h.isAnonymous = false;
});
afterEach(() => vi.clearAllMocks());

describe('Packs publish form', () => {
  it('requires at least one group: publish is disabled until a group is selected', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(
      <Packs expanded="ctPacks" handleChange={noop} gameMode="online" onGameModeChange={() => {}} />
    );

    const publishBtn = screen.getByRole('button', { name: 'packs.publish' });
    expect(publishBtn).toBeDisabled();

    await user.type(screen.getByLabelText('packs.name'), 'My Pack');
    // Name alone is not enough — a group is still required.
    expect(publishBtn).toBeDisabled();

    await user.click(screen.getByLabelText('packs.selectGroups'));
    await user.click(await screen.findByText('Group One'));
    await user.keyboard('{Escape}');

    expect(publishBtn).toBeEnabled();
  });

  it('defaults visibility to Public and has no consent checkbox', () => {
    renderWithoutProviders(
      <Packs expanded="ctPacks" handleChange={noop} gameMode="online" onGameModeChange={() => {}} />
    );

    expect(screen.getByText('packs.visibilityPublic')).toBeInTheDocument();
    expect(screen.queryByText('packs.consent')).not.toBeInTheDocument();
  });

  it('forces Private and disables the Public option for anonymous users', async () => {
    h.isAnonymous = true;
    const user = userEvent.setup();
    renderWithoutProviders(
      <Packs expanded="ctPacks" handleChange={noop} gameMode="online" onGameModeChange={() => {}} />
    );

    // Selected value renders the private label, and the helper explains the gate.
    expect(screen.getByText('packs.visibilityPrivate')).toBeInTheDocument();
    expect(screen.getByText('packs.anonymousPrivateOnly')).toBeInTheDocument();

    await user.click(screen.getByLabelText('packs.visibility'));
    const listbox = await screen.findByRole('listbox');
    // The Public option is disabled; its tooltip (which becomes the option's accessible
    // name) explains that linking an account is required.
    expect(
      within(listbox).getByRole('option', { name: 'packs.publicNeedsAccount' })
    ).toHaveAttribute('aria-disabled', 'true');
  });
});
