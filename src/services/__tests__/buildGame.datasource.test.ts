import { describe, expect, it, vi, beforeEach } from 'vitest';

// The default (Dexie-backed) data source must exclude disabled tiles so that
// disabled defaults never leak onto the generated board. The pure builder is
// intentionally enabled-agnostic, so this filtering has to happen at the source.
vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(async () => []),
}));
vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(async () => []),
}));

import buildGameBoard from '../buildGame';
import { getTiles } from '@/stores/customTiles';
import type { Settings } from '@/types/Settings';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildGameBoard default data source', () => {
  it('fetches only enabled tiles (excludes disabled defaults from the board)', async () => {
    await buildGameBoard({ selectedActions: {} } as Settings, 'en', 'online', 5);

    expect(getTiles).toHaveBeenCalledWith(expect.objectContaining({ isEnabled: 1 }));
  });
});
