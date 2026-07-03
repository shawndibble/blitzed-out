import { renderWithoutProviders } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExtendDefaultGroupDialog from '../ExtendDefaultGroupDialog';
import type { CustomGroupPull } from '@/types/customGroups';

vi.mock('@/stores/customGroups', () => ({
  updateCustomGroup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn().mockResolvedValue([]),
}));

import { updateCustomGroup } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';

const defaultGroup: CustomGroupPull = {
  id: 'default-group-1',
  name: 'ballBusting',
  label: 'Ball Busting',
  intensities: [
    { id: 'bb-1', label: 'Slap/Squeeze', value: 1, isDefault: true },
    { id: 'bb-2', label: 'Punch/Crush', value: 2, isDefault: true },
  ],
  type: 'sex',
  isDefault: true,
  locale: 'en',
  gameMode: 'local',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ExtendDefaultGroupDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTiles).mockResolvedValue([]);
    vi.mocked(updateCustomGroup).mockResolvedValue(undefined as any);
  });

  it('renders built-in levels as locked chips', () => {
    renderWithoutProviders(
      <ExtendDefaultGroupDialog
        open
        group={defaultGroup}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText('1. Slap/Squeeze')).toBeInTheDocument();
    expect(screen.getByText('2. Punch/Crush')).toBeInTheDocument();
    // No delete affordance for built-in levels; save disabled until a change.
    expect(screen.getByRole('button', { name: /customGroups.saveLevels/i })).toBeDisabled();
  });

  it('appends a new level after the default ladder on save', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();

    renderWithoutProviders(
      <ExtendDefaultGroupDialog open group={defaultGroup} onClose={vi.fn()} onSaved={onSaved} />
    );

    await user.click(screen.getByRole('button', { name: /customGroups.addLevel/i }));
    await user.type(
      screen.getByPlaceholderText('customGroups.newLevelPlaceholder'),
      'Rubber Bands'
    );
    await user.click(screen.getByRole('button', { name: /customGroups.saveLevels/i }));

    await waitFor(() => {
      expect(updateCustomGroup).toHaveBeenCalledWith('default-group-1', {
        intensities: [
          expect.objectContaining({ value: 1, isDefault: true }),
          expect.objectContaining({ value: 2, isDefault: true }),
          expect.objectContaining({
            id: 'ballBusting-ext-3',
            label: 'Rubber Bands',
            value: 3,
            isDefault: false,
          }),
        ],
      });
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('blocks removal of an added level that already has tiles', async () => {
    vi.mocked(getTiles).mockResolvedValue([{ id: 1 } as any]);
    const extendedGroup: CustomGroupPull = {
      ...defaultGroup,
      intensities: [
        ...defaultGroup.intensities,
        { id: 'ballBusting-ext-3', label: 'Rubber Bands', value: 3, isDefault: false },
      ],
    };

    renderWithoutProviders(
      <ExtendDefaultGroupDialog open group={extendedGroup} onClose={vi.fn()} onSaved={vi.fn()} />
    );

    await waitFor(() => {
      expect(getTiles).toHaveBeenCalledWith({ group_id: 'default-group-1', intensity: 3 });
    });
    const removeButton = screen.getByRole('button', { name: /remove level/i });
    expect(removeButton).toBeDisabled();
  });

  it('removes a tile-less added level on save', async () => {
    const user = userEvent.setup();
    const extendedGroup: CustomGroupPull = {
      ...defaultGroup,
      intensities: [
        ...defaultGroup.intensities,
        { id: 'ballBusting-ext-3', label: 'Rubber Bands', value: 3, isDefault: false },
      ],
    };

    renderWithoutProviders(
      <ExtendDefaultGroupDialog open group={extendedGroup} onClose={vi.fn()} onSaved={vi.fn()} />
    );

    await waitFor(() => {
      expect(getTiles).toHaveBeenCalled();
    });
    await user.click(screen.getByRole('button', { name: /remove level/i }));
    await user.click(screen.getByRole('button', { name: /customGroups.saveLevels/i }));

    await waitFor(() => {
      expect(updateCustomGroup).toHaveBeenCalledWith('default-group-1', {
        intensities: [
          expect.objectContaining({ value: 1, isDefault: true }),
          expect.objectContaining({ value: 2, isDefault: true }),
        ],
      });
    });
  });
});
