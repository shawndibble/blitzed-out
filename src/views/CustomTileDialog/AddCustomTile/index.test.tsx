import { renderWithoutProviders } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CustomTileLifecycle } from '@/views/CustomTileDialog/hooks/useCustomTileLifecycle';
import { localizePlaceholders } from '@/services/placeholderAliasService';
import AddCustomTile from './index';

// The global icon Proxy mock has no `has` trap, so named imports fail to resolve.
vi.mock('@mui/icons-material', () => ({
  ExpandMore: () => <span data-testid="icon-expand-more" />,
  HelpOutlined: () => <span data-testid="icon-help" />,
}));

vi.mock('@/components/CustomGroupSelector', () => ({
  default: () => <div data-testid="group-selector" />,
}));

vi.mock('@/views/CustomGroupDialog', () => ({
  default: () => null,
}));

// Locale drives which token text gets written into the draft, so the test needs
// to vary it. The i18n `placeholders` namespace is unavailable under the global
// mock, so the real service falls back to canonical English tokens.
const settings = { role: 'sub', gameMode: 'local', locale: 'en', room: 'PUBLIC' };

vi.mock('@/stores/settingsStore', () => ({
  useGameSettings: () => ({ settings }),
}));

vi.mock('@/services/placeholderAliasService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/placeholderAliasService')>();
  return { ...actual, localizePlaceholders: vi.fn(actual.localizePlaceholders) };
});

const addDraftTag = vi.fn();
// Stable reference: Autocomplete resets its freeSolo draft text when the `value`
// (tags) prop identity changes, which a fresh `[]` literal on every render would
// trigger on each keystroke — mirroring the real hook's stable array reference.
const EMPTY_TAGS: string[] = [];

function Harness({ initialAction = '' }: { initialAction?: string }) {
  const [action, setAction] = useState(initialAction);
  const [tagInputValue, setTagInputValue] = useState('');

  const lifecycle = {
    sharedFilters: { gameMode: 'local', groupName: '', intensity: '' },
    setSharedFilters: vi.fn(),
    editTarget: { tileId: null, editTileData: undefined },
    beginEdit: vi.fn(),
    clearEdit: vi.fn(),
    refreshTrigger: 0,
    triggerRefresh: vi.fn(),
    draft: { action, tags: EMPTY_TAGS },
    setDraftAction: setAction,
    setDraftTags: vi.fn(),
    addDraftTag,
    tagInputValue,
    setTagInputValue,
    validationMessage: '',
    groups: [],
    selectedGroup: undefined,
    groupsRefreshTrigger: 0,
    bumpGroupsRefresh: vi.fn(),
    submitTile: vi.fn(),
  } as unknown as CustomTileLifecycle;

  return (
    <AddCustomTile
      lifecycle={lifecycle}
      expanded="ctAdd"
      handleChange={() => vi.fn()}
      tagList={[]}
    />
  );
}

async function openPlaceholderHelp(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /placeholderHelp.title/i }));
}

const playerChip = () => screen.getByRole('button', { name: /\{player\}/ });
const actionField = () => screen.getByLabelText(/action/i) as HTMLInputElement;

describe('AddCustomTile placeholder insertion', () => {
  beforeEach(() => {
    settings.locale = 'en';
  });

  it('appends the token when the action field has never been focused', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness initialAction="Kiss" />);

    await openPlaceholderHelp(user);
    await user.click(playerChip());

    await waitFor(() => expect(actionField().value).toBe('Kiss {player}'));
  });

  it('inserts at the last known caret and keeps focus in the action field', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness initialAction="Kiss hard" />);

    await openPlaceholderHelp(user);

    const input = actionField();
    await user.click(input);
    input.setSelectionRange(5, 5);

    await user.click(playerChip());

    await waitFor(() => expect(input.value).toBe('Kiss {player} hard'));
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe('Kiss {player} '.length);
  });

  it('uses the caret from before focus left the field', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness initialAction="Kiss hard" />);

    await openPlaceholderHelp(user);

    const input = actionField();
    await user.click(input);
    input.setSelectionRange(5, 5);
    await user.click(screen.getByLabelText(/tags/i));

    await user.click(playerChip());

    await waitFor(() => expect(actionField().value).toBe('Kiss {player} hard'));
  });

  it('lets the author keep typing after an insertion', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness />);

    await openPlaceholderHelp(user);
    await user.click(playerChip());
    await user.keyboard(' waits');

    await waitFor(() => expect(actionField().value).toBe('{player} waits'));
  });

  it('resolves the token against settings.locale, not the ambient i18n language', async () => {
    const user = userEvent.setup();
    settings.locale = 'es';
    renderWithoutProviders(<Harness />);

    await openPlaceholderHelp(user);

    expect(vi.mocked(localizePlaceholders)).toHaveBeenCalledWith('{player}', 'es');
  });

  it('inserts without stealing focus from the tags field', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness initialAction="Kiss" />);

    await openPlaceholderHelp(user);

    const tagsInput = screen.getByLabelText(/tags/i);
    await user.click(tagsInput);
    await user.keyboard('rough');

    await user.click(playerChip());

    await waitFor(() => expect(actionField().value).toBe('Kiss {player}'));
    expect(document.activeElement).toBe(tagsInput);
    expect(addDraftTag).not.toHaveBeenCalled();
  });

  it('warns instead of silently doing nothing when the action is at max length', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness initialAction={'a'.repeat(2000)} />);

    await openPlaceholderHelp(user);
    await user.click(playerChip());

    expect(await screen.findByRole('alert')).toHaveTextContent(/insertTooLong/i);
    expect(actionField().value).toBe('a'.repeat(2000));
  });
});

describe('AddCustomTile tags input', () => {
  it('commits a tag on comma without throwing', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness />);

    await user.click(screen.getByLabelText(/tags/i));
    await user.keyboard('rough,');

    expect(addDraftTag).toHaveBeenCalledTimes(1);
    expect(addDraftTag).toHaveBeenCalledWith('rough');
  });

  // Autocomplete's own freeSolo+multiple handling already commits typed text as a
  // tag on Enter (via onChange), so handleKeyDown must not also call addDraftTag —
  // doing so double-inserts the tag.
  it('does not double-commit a tag on Enter', async () => {
    const user = userEvent.setup();
    renderWithoutProviders(<Harness />);

    await user.click(screen.getByLabelText(/tags/i));
    await user.keyboard('rough{Enter}');

    expect(addDraftTag).not.toHaveBeenCalled();
  });
});
