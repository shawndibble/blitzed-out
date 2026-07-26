import { describe, expect, it } from 'vitest';

import { exportSettings, getSettingsMessage } from '@/services/gameSettingsMessage';
import { convertDexieGroupsToActions } from '@/services/dexieActionImport';
import db from '@/stores/store';
import type { CustomGroupPull } from '@/types/customGroups';
import type { PlayerRole, Settings } from '@/types/Settings';

describe('getSettingsMessage', () => {
  const throatTraining = {
    id: 'g1',
    name: 'throatTraining',
    label: 'Throat Training',
    type: 'solo',
    locale: 'en',
    gameMode: 'online',
    isDefault: true,
    intensities: [
      { id: 'i1', label: 'Lick Toy', value: 1, isDefault: true },
      { id: 'i2', label: 'Suck Toy', value: 2, isDefault: true },
      { id: 'i3', label: 'Deepthroat', value: 3, isDefault: true },
    ],
  } as CustomGroupPull;

  // Room-entry and rebuilt-board messages build their catalog through
  // `convertDexieGroupsToActions`, so the two must agree on level numbering.
  // They didn't: the catalog injected a phantom "None" first key, so the
  // message named every selected level one step too low.
  it('names the levels the player actually selected', async () => {
    const settings: Settings = {
      gameMode: 'solo',
      boardUpdated: false,
      room: 'PUBLIC',
      selectedActions: { throatTraining: { type: 'solo', levels: [1, 2] } },
    } as Settings;

    const message = await getSettingsMessage(
      settings,
      [],
      convertDexieGroupsToActions([throatTraining])
    );

    expect(message).toContain('Lick Toy');
    expect(message).toContain('Suck Toy');
    expect(message).not.toContain('None');
  });

  it('names a level by its VALUE, so a sparse ladder stays correct', async () => {
    const sparse = { ...throatTraining, intensities: [throatTraining.intensities[2]] };
    const settings: Settings = {
      gameMode: 'solo',
      boardUpdated: false,
      room: 'PUBLIC',
      selectedActions: { throatTraining: { type: 'solo', levels: [3] } },
    } as Settings;

    const message = await getSettingsMessage(settings, [], convertDexieGroupsToActions([sparse]));

    expect(message).toContain('Deepthroat');
  });

  // Counts a custom tile when its intensity is one the player SELECTED. The
  // old rule compared against the level COUNT, so picking levels [1, 3] counted
  // tiles at 1 and 2 — an unselected level in, a selected one out.
  it('counts custom tiles at selected levels only', async () => {
    const settings = {
      gameMode: 'solo',
      boardUpdated: false,
      room: 'PUBLIC',
      selectedActions: { throatTraining: { type: 'solo', levels: [1, 3] } },
    } as Settings;
    const tile = (intensity: number) =>
      ({ group_id: 'g1', intensity, isCustom: 1, action: 'x' }) as never;
    // Tiles resolve to a group by id, so the row has to exist.
    await db.customGroups.put({ ...throatTraining, createdAt: new Date() } as never);

    const message = await getSettingsMessage(
      settings,
      [tile(1), tile(2), tile(3)],
      convertDexieGroupsToActions([throatTraining])
    );

    expect(message).toContain('customTilesLabel: 2');
  });

  describe('finish options', () => {
    const withFinishRange = (finishRange: [number, number]): Settings =>
      ({
        gameMode: 'solo',
        boardUpdated: false,
        room: 'PUBLIC',
        finishRange,
        selectedActions: { throatTraining: { type: 'solo', levels: [1] } },
      }) as Settings;

    const catalog = () => convertDexieGroupsToActions([throatTraining]);

    // A lone outcome used to print inline ("Finish options: cum"), which reads as
    // a wide row beside the pills the popover renders every other value as.
    it('lists a single 100% outcome as a sublist, same as three outcomes', async () => {
      const message = await getSettingsMessage(withFinishRange([0, 0]), [], catalog());

      expect(message).toContain('* finishSlider \r\n\r\n');
      expect(message).toContain('  - cum \r\n');
    });

    it('names each outcome with its percentage when the range is split', async () => {
      const message = await getSettingsMessage(withFinishRange([30, 50]), [], catalog());

      expect(message).toContain('  - noCum 30% \r\n');
      expect(message).toContain('  - ruined 20% \r\n');
      expect(message).toContain('  - cum 50% \r\n');
    });
  });

  it('sends nothing when no groups are selected', async () => {
    const settings = {
      gameMode: 'solo',
      boardUpdated: false,
      room: 'PUBLIC',
      finishRange: [0, 0],
      selectedActions: {},
    } as unknown as Settings;

    const message = await getSettingsMessage(
      settings,
      [],
      convertDexieGroupsToActions([throatTraining])
    );

    expect(message).toBe('');
  });

  describe('role wording', () => {
    const partnered = {
      throatTraining: { ...convertDexieGroupsToActions([throatTraining]).throatTraining },
    };
    partnered.throatTraining.dom = 'Receive Oral';
    partnered.throatTraining.sub = 'Give Oral';

    const withRole = (role: PlayerRole): Settings =>
      ({
        gameMode: 'online',
        boardUpdated: false,
        soloPlay: false,
        room: 'PUBLIC',
        role,
        selectedActions: { throatTraining: { type: 'sex', levels: [1] } },
      }) as Settings;

    it("uses the group's own wording for dom and sub", async () => {
      expect(await getSettingsMessage(withRole('dom'), [], partnered)).toContain('Receive Oral');
      expect(await getSettingsMessage(withRole('sub'), [], partnered)).toContain('Give Oral');
    });

    // Only the two sides have bespoke wording; a Switch player gets the
    // generic label rather than being silently shown one side's wording.
    it('falls back to the generic label for vers (Switch)', async () => {
      const message = await getSettingsMessage(withRole('vers'), [], partnered);

      expect(message).toContain('vers');
      expect(message).not.toContain('Receive Oral');
      expect(message).not.toContain('Give Oral');
    });
  });
});

describe('exportSettings', () => {
  it('drops personal Hands-Free preferences from the exported settings', () => {
    const formData: Settings = {
      gameMode: 'solo',
      boardUpdated: false,
      room: 'PUBLIC',
      handsFree: true,
      handsFreePreset: 'quick',
      readRoll: true,
      readRollBeforeHandsFree: false,
    };

    const exported = exportSettings(formData);

    expect(exported).not.toHaveProperty('handsFree');
    expect(exported).not.toHaveProperty('handsFreePreset');
    expect(exported).not.toHaveProperty('readRoll');
    expect(exported).not.toHaveProperty('readRollBeforeHandsFree');
  });

  it('still exports non-personal settings such as gameMode', () => {
    const formData: Settings = {
      gameMode: 'local',
      boardUpdated: false,
      room: 'PUBLIC',
    };

    const exported = exportSettings(formData);

    expect(exported.gameMode).toBe('local');
  });
});
