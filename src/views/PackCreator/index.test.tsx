import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parsePack, republishPack } from '@/services/contentPacks';
import { analytics } from '@/services/analytics';
import PackCreator from './index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, arg?: any) =>
      typeof arg === 'object' && arg !== null ? `${key}:${JSON.stringify(arg)}` : (arg ?? key),
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
    {
      name: 'myGroup',
      label: 'My Group',
      tileCount: 5,
      isExtension: false,
      addedIntensityCount: 0,
    },
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

const mockAuth = { user: { uid: 'u1' }, isAnonymous: true, hasPermanentProvider: false };
vi.mock('@/hooks/useAuth', () => ({
  default: () => mockAuth,
}));

// Stand-in for the real dialog: one button per outcome, so the tests drive the
// creator's reaction to an upgrade without exercising Firebase.
vi.mock('@/components/auth/AuthDialog', () => ({
  default: ({ open, onSuccess }: { open: boolean; onSuccess?: (user: { uid: string }) => void }) =>
    open ? (
      <div>
        <button
          onClick={() => {
            mockAuth.isAnonymous = false;
            mockAuth.hasPermanentProvider = true;
            // Same uid: the credential linked in place.
            onSuccess?.({ uid: mockAuth.user.uid });
          }}
        >
          finish-link
        </button>
        <button
          onClick={() => {
            mockAuth.isAnonymous = false;
            mockAuth.hasPermanentProvider = true;
            mockAuth.user = { uid: 'other-user' };
            onSuccess?.({ uid: 'other-user' });
          }}
        >
          finish-signin
        </button>
        {/* A link whose re-auth failed: Firebase flips isAnonymous, the token
            provider stays anonymous, and the dialog reports no success. */}
        <button
          onClick={() => {
            mockAuth.isAnonymous = false;
          }}
        >
          half-link
        </button>
      </div>
    ) : null,
}));

vi.mock('@/stores/settingsStore', async (importOriginal) => ({
  // Real pure seam functions (deriveContentMode); only the React hook is stubbed.
  ...(await importOriginal<typeof import('@/stores/settingsStore')>()),
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
    mockAuth.hasPermanentProvider = false;
    mockAuth.user = { uid: 'u1' };
    mockListMyPacks.mockResolvedValue([]);
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

  it('lets an anonymous author upgrade in place and publishes publicly afterwards', async () => {
    renderCreator();

    fireEvent.click(await screen.findByText('My Group'));
    fireEvent.click(screen.getByText('next'));

    // Details step offers the upgrade next to the disabled Public option.
    expect(screen.getByText('packs.signInToPublish')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('packs.name'), { target: { value: 'Party Pack' } });
    fireEvent.click(screen.getByText('next'));

    // Publish step repeats the offer — the last moment it matters.
    fireEvent.click(screen.getByText('packs.signInToPublish'));
    expect(analytics.trackPackEvent).toHaveBeenCalledWith('pack_auth_prompt_clicked');

    fireEvent.click(await screen.findByText('finish-link'));

    // Dialog closed, visibility switched to public without leaving the step.
    await waitFor(() => expect(screen.queryByText('finish-link')).toBeNull());
    await screen.findByText('packCreator.willBePublic');
    expect(analytics.trackPackEvent).toHaveBeenCalledWith('pack_auth_upgraded', {
      auth_method: 'linked',
    });

    fireEvent.click(screen.getByText('packs.publish'));

    await waitFor(() => expect(mockPublish).toHaveBeenCalled());
    expect(mockPublish.mock.calls[0][0].visibility).toBe('public');
  });

  it('keeps public off the table when a link left the session half-upgraded', async () => {
    renderCreator();

    fireEvent.click(await screen.findByText('My Group'));
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('packs.signInToPublish'));

    // isAnonymous flips, but the token still carries the anonymous provider.
    fireEvent.click(await screen.findByText('half-link'));
    fireEvent.change(screen.getByLabelText('packs.name'), { target: { value: 'Party Pack' } });

    // The prompt stays, and the publish is forced private rather than offering
    // a capability the rules would reject.
    expect(screen.getByText('packs.signInToPublish')).toBeInTheDocument();
    fireEvent.click(screen.getByText('next'));
    await screen.findByText('packCreator.willBePrivate');
    fireEvent.click(screen.getByText('packs.publish'));

    await waitFor(() => expect(mockPublish).toHaveBeenCalled());
    expect(mockPublish.mock.calls[0][0].visibility).toBe('private');
  });

  it('honours the public request even if the dialog is dismissed after the upgrade', async () => {
    renderCreator();

    fireEvent.click(await screen.findByText('My Group'));
    fireEvent.click(screen.getByText('next'));
    fireEvent.change(screen.getByLabelText('packs.name'), { target: { value: 'Party Pack' } });
    fireEvent.click(screen.getByText('packs.signInToPublish'));

    // Upgrade lands, then the dialog is dismissed without reporting success.
    await screen.findByText('half-link');
    mockAuth.isAnonymous = false;
    mockAuth.hasPermanentProvider = true;
    fireEvent.click(screen.getByLabelText('close'));

    fireEvent.click(screen.getByText('next'));
    await screen.findByText('packCreator.willBePublic');
  });

  it('stops republishing a pack owned by the account that was signed out of', async () => {
    mockListMyPacks.mockResolvedValue([
      {
        id: 'p1',
        author: 'u1',
        name: 'Old Pack',
        description: 'desc',
        tags: ['party'],
        visibility: 'private',
        gameMode: 'online',
        locale: 'en',
        packVersion: 3,
      },
    ]);
    vi.mocked(parsePack).mockReturnValue({
      payload: { touchedGroupNames: () => ['myGroup'] },
    } as never);

    renderCreator();

    fireEvent.click(await screen.findByText('Old Pack'));
    fireEvent.click(await screen.findByText('next'));

    fireEvent.click(screen.getByText('packs.signInToPublish'));
    fireEvent.click(await screen.findByText('finish-signin'));

    // The loaded pack belongs to the previous uid, so republishing is off.
    await screen.findByText('packCreator.newAccountOwnership');
    expect(screen.getByLabelText('packs.name')).toHaveValue('Old Pack');

    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('packs.publish'));

    await waitFor(() => expect(mockPublish).toHaveBeenCalled());
    expect(republishPack).not.toHaveBeenCalled();
    expect(mockPublish.mock.calls[0][0].visibility).toBe('public');
  });
});
