import { renderWithoutProviders } from '@/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PackImportDialog from '../PackImportDialog';
import type { ContentPackDoc } from '@/types/contentPacks';

vi.mock('@mui/icons-material', () => ({ Close: () => null }));

const importPack = vi.fn(async (_pack: ContentPackDoc) => ({
  success: true,
  errors: [] as string[],
}));
const reportPack = vi.fn(async (_packId: string, _reason: string) => undefined);

vi.mock('@/services/contentPacks', () => ({
  importPack: (pack: ContentPackDoc) => importPack(pack),
  reportPack: (packId: string, reason: string) => reportPack(packId, reason),
  parsePack: (pack: ContentPackDoc) => ({
    doc: pack,
    data: {
      formatVersion: '2.0.0',
      exportedAt: '',
      data: {
        customGroups: [
          {
            name: 'g1',
            label: 'Group One',
            gameMode: 'online',
            locale: 'en',
            intensities: [{ value: 1, label: 'Light' }],
            contentHash: 'h',
          },
        ],
        customTiles: [
          {
            action: 'Do the thing',
            groupName: 'g1',
            intensity: 1,
            tags: ['spicy'],
            gameMode: 'online',
            locale: 'en',
            isEnabled: true,
            contentHash: 'h',
          },
        ],
        disabledDefaultTiles: [],
      },
    },
  }),
}));

const pack: ContentPackDoc = {
  id: 'p1',
  author: 'u1',
  authorName: 'Tester',
  name: 'My Pack',
  description: 'desc',
  gameMode: 'online',
  locale: 'en',
  tags: ['fun'],
  visibility: 'public',
  contents: '{}',
  contentHash: 'sha256-x',
  packVersion: 1,
  formatVersion: '2.0.0',
  tileCount: 1,
  groupCount: 1,
  groupLabels: ['Group One'],
  createdAt: 1,
  updatedAt: 1,
};

afterEach(() => vi.clearAllMocks());

describe('PackImportDialog (full-dump preview, copy-only)', () => {
  it('renders the per-group action grid with a single Import and a Report, no subscribe', () => {
    renderWithoutProviders(<PackImportDialog pack={pack} open onClose={() => {}} />);

    expect(screen.getByText('Group One')).toBeInTheDocument();
    expect(screen.getByText('Do the thing')).toBeInTheDocument();
    expect(screen.getByText('spicy')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'packs.import' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'packs.report' })).toBeInTheDocument();
    // Subscription affordances are gone.
    expect(screen.queryByText('packs.subscribe')).not.toBeInTheDocument();
    expect(screen.queryByText('packs.importCopy')).not.toBeInTheDocument();
  });

  it('imports a copy and notifies the parent', async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    const onClose = vi.fn();
    renderWithoutProviders(
      <PackImportDialog pack={pack} open onClose={onClose} onImported={onImported} />
    );

    await user.click(screen.getByRole('button', { name: 'packs.import' }));

    expect(importPack).toHaveBeenCalledWith(pack);
    expect(onImported).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
