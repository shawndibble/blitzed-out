import { renderWithoutProviders } from '@/test-utils';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as actionReplacementModule from '@/services/actionStringReplacement';
import CustomTilePreview from './CustomTilePreview';

describe('CustomTilePreview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when the action is empty', () => {
    renderWithoutProviders(
      <CustomTilePreview
        action=""
        settings={{
          role: 'sub',
          displayName: 'Alex',
          room: 'PUBLIC',
          boardUpdated: false,
          gameMode: 'local',
        }}
      />
    );

    expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
  });

  it('renders a generic example through actionStringReplacement', () => {
    const replacementSpy = vi.spyOn(actionReplacementModule, 'default');

    renderWithoutProviders(
      <CustomTilePreview
        action="{player} follows the {dom}"
        settings={{
          role: 'sub',
          displayName: 'Alex',
          room: 'PUBLIC',
          boardUpdated: false,
          gameMode: 'local',
          gender: 'non-binary',
          locale: 'en',
        }}
      />
    );

    expect(screen.getByText(/customTiles.preview.title/i)).toBeInTheDocument();
    expect(replacementSpy).toHaveBeenCalledWith(
      '{player} follows the {dom}',
      'sub',
      '',
      undefined,
      true,
      'non-binary',
      'en'
    );
    expect(screen.queryByText('{player} follows the {dom}')).not.toBeInTheDocument();
  });
});
