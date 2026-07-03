import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PackCreator from './index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, arg?: any) =>
      typeof arg === 'object' && arg !== null
        ? `${key}:${JSON.stringify(arg)}`
        : (arg ?? key),
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

vi.mock('@mui/icons-material', () => ({
  Add: () => null,
  ArrowBack: () => null,
  Close: () => null,
  Edit: () => null,
  Publish: () => null,
  AutoAwesome: () => null,
  ContentCopy: () => null,
}));
vi.mock('@/components/CopyToClipboard', () => ({
  default: () => null,
}));

const mockPublish = vi.fn(async (_meta: { visibility: string; name: string }) => 'pack-123');
const mockListMyPacks = vi.fn(async (): Promise<unknown[]> => []);
vi.mock('@/services/contentPacks', () => ({
  buildPackContents: vi.fn(async () => ({ contents: '{}', contentHash: 'hash' })),
  getPack: vi.fn(async () => undefined),
  listMyPacks: () => mockListMyPacks(),
  listPublishableGroups: vi.fn(async () => [
    { name: 'myGroup', label: 'My Group', tileCount: 5, isExtension: false, addedIntensityCount: 0 },
  ]),
  parsePack: vi.fn(() => undefined),
  publishPack: (meta: { visibility: string; name: string }) => mockPublish(meta),
  republishPack: vi.fn(async () => {}),
}));

vi.mock('@/stores/customGroups', () => ({ getCustomGroups: vi.fn(async () => []) }));
vi.mock('@/stores/customTiles', () => ({ addCustomTile: vi.fn(async () => 1) }));
vi.mock('@/services/validationService', () => ({
  validateCustomTileWithGroups: vi.fn(async () => ({ isValid: true, errors: [], warnings: [] })),
}));
vi.mock('@/services/analytics', () => ({
  analytics: { trackPackEvent: vi.fn() },
}));
vi.mock('@/views/CustomGroupDialog', () => ({
  default: () => null,
}));

const mockAuth = { user: { uid: 'u1' }, isAnonymous: true };
vi.mock('@/context/hooks/useAuth', () => ({
  default: () => mockAuth,
}));

vi.mock('@/stores/settingsStore', () => ({
  useGameSettings: () => ({ settings: { locale: 'en', gameMode: 'solo', room: 'PUBLIC' } }),
}));

function renderCreator() {
  return render(
    <MemoryRouter initialEntries={['/packs/create']}>
      <PackCreator />
    </MemoryRouter>
  );
}

describe('PackCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAnonymous = true;
  });

  it('walks content → details → publish and forces private for anonymous users', async () => {
    renderCreator();

    // Step 0: group appears; Next disabled until one is selected
    const nextButton = await screen.findByText('next');
    expect(nextButton.closest('button')).toBeDisabled();

    fireEvent.click(await screen.findByText('My Group'));
    expect(nextButton.closest('button')).not.toBeDisabled();
    fireEvent.click(nextButton);

    // Step 1: name required
    expect(screen.getByText('next').closest('button')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('packs.name'), { target: { value: 'Party Pack' } });
    fireEvent.click(screen.getByText('next'));

    // Step 2: publish → anonymous forced private regardless of UI state
    fireEvent.click(screen.getByText('packs.publish'));

    await waitFor(() => expect(mockPublish).toHaveBeenCalled());
    const meta = mockPublish.mock.calls[0][0];
    expect(meta.visibility).toBe('private');
    expect(meta.name).toBe('Party Pack');

    // Share link surfaces after publish
    await screen.findByText(/importPack=pack-123/);
  });
});
