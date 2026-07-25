import { describe, expect, it, vi, afterEach } from 'vitest';
import i18next from 'i18next';
import { readPackPayload, storedTileIdentityKey, type PackPayload } from '../packPayload';
import type { ExportData, ExportGroup, ExportTile } from '@/types/importExport';

const ES_TOKENS: Record<string, string> = { genital: 'genitales', dom: 'dominante' };

function group(overrides: Partial<ExportGroup> = {}): ExportGroup {
  return {
    name: 'myGroup',
    label: 'My Group',
    gameMode: 'online',
    locale: 'en',
    intensities: [{ value: 1, label: 'L1' }],
    contentHash: 'g-hash',
    ...overrides,
  };
}

function tile(overrides: Partial<ExportTile> = {}): ExportTile {
  return {
    action: 'Do a thing',
    groupName: 'myGroup',
    intensity: 1,
    tags: [],
    gameMode: 'online',
    locale: 'en',
    isEnabled: true,
    contentHash: 't-hash',
    ...overrides,
  };
}

function payloadDoc(data: Partial<ExportData['data']> = {}): ExportData {
  return {
    formatVersion: '2.1.0',
    exportedAt: '2026-07-25T00:00:00.000Z',
    data: {
      customGroups: [],
      customTiles: [],
      disabledDefaultTiles: [],
      ...data,
    },
  };
}

function read(doc: unknown): PackPayload {
  const payload = readPackPayload(doc);
  if (!payload) throw new Error('expected a readable payload');
  return payload;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readPackPayload', () => {
  it('reads a well-formed document', () => {
    const payload = read(payloadDoc({ customGroups: [group()], customTiles: [tile()] }));

    expect(payload.formatVersion).toBe('2.1.0');
    expect(payload.groups).toHaveLength(1);
    expect(payload.tiles).toHaveLength(1);
    expect(payload.counts).toEqual({
      groups: 1,
      tiles: 1,
      extensions: 0,
      disabledDefaults: 0,
    });
  });

  it('parses a JSON string', () => {
    const payload = read(JSON.stringify(payloadDoc({ customTiles: [tile()] })));
    expect(payload.tiles).toHaveLength(1);
  });

  it('rejects malformed JSON, wrong shape, and a missing format version', () => {
    expect(readPackPayload('{not json')).toBeUndefined();
    expect(readPackPayload(null)).toBeUndefined();
    expect(readPackPayload({ formatVersion: '2.1.0' })).toBeUndefined();
    expect(
      readPackPayload({ formatVersion: 2, data: { customGroups: [], customTiles: [] } })
    ).toBeUndefined();
    expect(readPackPayload({ formatVersion: '2.1.0', data: { customGroups: [] } })).toBeUndefined();
  });

  it('defaults the optional sections a 2.0.0 export omits', () => {
    const payload = read({
      formatVersion: '2.0.0',
      exportedAt: 'then',
      data: { customGroups: [], customTiles: [] },
    });

    expect(payload.disabledDefaults).toEqual([]);
    expect(payload.extensions).toEqual([]);
  });

  it('buckets tiles under their group name', () => {
    const payload = read(
      payloadDoc({
        customTiles: [tile(), tile({ action: 'Another' }), tile({ groupName: 'other' })],
      })
    );

    expect(payload.tilesByGroup('myGroup').map((t) => t.action)).toEqual(['Do a thing', 'Another']);
    expect(payload.tilesByGroup('other')).toHaveLength(1);
    expect(payload.tilesByGroup('absent')).toEqual([]);
  });
});

describe('extendedGroups', () => {
  it('returns declared extensions unchanged', () => {
    const payload = read(
      payloadDoc({
        groupExtensions: [
          {
            groupName: 'ballBusting',
            groupLabel: 'Ball Busting',
            locale: 'en',
            gameMode: 'online',
            addedIntensities: [{ value: 5, label: 'Brutal' }],
            contentHash: 'e-hash',
          },
        ],
      })
    );

    expect(payload.extensions).toHaveLength(1);
    expect(payload.extendedGroups()).toHaveLength(1);
    expect(payload.extendedGroups()[0].addedIntensities).toHaveLength(1);
  });

  it('synthesizes an entry for a default group a legacy payload touches only via tiles', () => {
    const payload = read(
      payloadDoc({
        customGroups: [group()],
        customTiles: [tile(), tile({ groupName: 'ballBusting', locale: 'es', gameMode: 'local' })],
      })
    );

    // `extensions` stays exactly what the document declares — the importer
    // applies nothing for a synthesized entry.
    expect(payload.extensions).toEqual([]);

    const inferred = payload.extendedGroups();
    expect(inferred).toHaveLength(1);
    expect(inferred[0]).toMatchObject({
      groupName: 'ballBusting',
      groupLabel: 'ballBusting',
      locale: 'es',
      gameMode: 'local',
      addedIntensities: [],
    });
  });

  it('does not synthesize for a group already covered by a declaration', () => {
    const payload = read(
      payloadDoc({
        customGroups: [group()],
        customTiles: [tile(), tile({ groupName: 'ballBusting' })],
        groupExtensions: [
          {
            groupName: 'ballBusting',
            groupLabel: 'Ball Busting',
            locale: 'en',
            gameMode: 'online',
            addedIntensities: [],
            contentHash: 'e-hash',
          },
        ],
      })
    );

    expect(payload.extendedGroups()).toHaveLength(1);
  });

  it('names every group the payload touches, groups and extensions alike', () => {
    const payload = read(
      payloadDoc({
        customGroups: [group()],
        customTiles: [tile({ groupName: 'orphan' })],
        groupExtensions: [
          {
            groupName: 'ballBusting',
            groupLabel: 'Ball Busting',
            locale: 'en',
            gameMode: 'online',
            addedIntensities: [],
            contentHash: 'e-hash',
          },
        ],
      })
    );

    expect(payload.touchedGroupNames().sort()).toEqual(['ballBusting', 'myGroup', 'orphan']);
  });
});

describe('entryLocale', () => {
  const disabled = {
    action: 'Default action',
    groupName: 'ballBusting',
    intensity: 2,
    gameMode: 'online',
    contentHash: 'd-hash',
  };

  it('recovers a locale from the group section', () => {
    const payload = read(
      payloadDoc({
        customGroups: [group({ name: 'ballBusting', locale: 'fr' })],
        disabledDefaultTiles: [disabled],
      })
    );
    expect(payload.entryLocale('ballBusting', 'online')).toBe('fr');
  });

  it('falls back to an extension entry, then a tile, then en', () => {
    const viaExtension = read(
      payloadDoc({
        groupExtensions: [
          {
            groupName: 'ballBusting',
            groupLabel: 'BB',
            locale: 'de',
            gameMode: 'online',
            addedIntensities: [],
            contentHash: 'e',
          },
        ],
      })
    );
    expect(viaExtension.entryLocale('ballBusting', 'online')).toBe('de');

    const viaTile = read(
      payloadDoc({ customTiles: [tile({ groupName: 'ballBusting', locale: 'hi' })] })
    );
    expect(viaTile.entryLocale('ballBusting', 'online')).toBe('hi');

    const nothing = read(payloadDoc({ disabledDefaultTiles: [disabled] }));
    expect(nothing.entryLocale('ballBusting', 'online')).toBe('en');
  });

  it('only matches siblings in the same game mode', () => {
    const payload = read(
      payloadDoc({ customTiles: [tile({ groupName: 'ballBusting', locale: 'zh' })] })
    );
    expect(payload.entryLocale('ballBusting', 'local')).toBe('en');
  });
});

describe('tileIdentityKey', () => {
  function mockLocale(tokens: Record<string, string>) {
    vi.spyOn(i18next, 't').mockImplementation(((key: string, opts?: any) => {
      if (key === 'placeholders:tokens' && opts?.returnObjects) return tokens;
      return key;
    }) as typeof i18next.t);
  }

  it('canonicalizes localized placeholder tokens before keying', () => {
    mockLocale(ES_TOKENS);
    const payload = read(
      payloadDoc({ customTiles: [tile({ action: 'Toca tus {genitales}.', locale: 'es' })] })
    );

    expect(payload.tileIdentityKey(payload.tiles[0], 'group-1')).toBe(
      storedTileIdentityKey('Toca tus {genital}.', 1, 'group-1')
    );
  });

  it('is stable for canonical actions', () => {
    const payload = read(payloadDoc({ customTiles: [tile({ action: 'Touch your {genital}.' })] }));
    expect(payload.tileIdentityKey(payload.tiles[0], 'g')).toBe(
      storedTileIdentityKey('Touch your {genital}.', 1, 'g')
    );
  });

  it('separates tiles by intensity and group', () => {
    expect(storedTileIdentityKey('a', 1, 'g1')).not.toBe(storedTileIdentityKey('a', 2, 'g1'));
    expect(storedTileIdentityKey('a', 1, 'g1')).not.toBe(storedTileIdentityKey('a', 1, 'g2'));
  });
});
