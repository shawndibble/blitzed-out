import { describe, expect, it } from 'vitest';

import { exportSettings } from '@/services/gameSettingsMessage';
import type { Settings } from '@/types/Settings';

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
