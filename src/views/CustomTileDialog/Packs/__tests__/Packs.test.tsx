import { renderWithoutProviders } from '@/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Packs from '../index';

vi.mock('@mui/icons-material', () => ({ AutoAwesome: () => null }));
vi.mock('@/services/contentPacks', () => ({
  getPack: vi.fn(async () => ({
    id: 'pack123',
    name: 'Found Pack',
    contents: '{}',
    groupCount: 1,
    tileCount: 2,
    packVersion: 1,
  })),
}));
vi.mock('../PackImportDialog', () => ({
  default: ({ pack }: { pack: { name: string } }) => <div>preview:{pack.name}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const noop = () => () => {};

function renderPacks() {
  return renderWithoutProviders(
    <Packs expanded="ctPacks" handleChange={noop} gameMode="online" onGameModeChange={() => {}} />
  );
}

afterEach(() => vi.clearAllMocks());

// Publish-form behavior (group gating, anonymous-forced-private) now lives in
// the route-level PackCreator and is tested in src/views/PackCreator/index.test.tsx.
describe('Packs tab (import + creator entry)', () => {
  it('routes to the pack creator instead of hosting a publish form', async () => {
    const user = userEvent.setup();
    renderPacks();

    expect(screen.queryByLabelText('packs.name')).toBeNull();
    expect(screen.queryByRole('button', { name: 'packs.publish' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /packCreator.openCta/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/packs/create');
  });

  it('imports a pack by code and opens the preview dialog', async () => {
    const user = userEvent.setup();
    renderPacks();

    await user.type(screen.getByLabelText('packs.importByCode'), 'pack123');
    await user.click(screen.getByRole('button', { name: 'packs.import' }));

    expect(await screen.findByText('preview:Found Pack')).toBeInTheDocument();
  });
});
