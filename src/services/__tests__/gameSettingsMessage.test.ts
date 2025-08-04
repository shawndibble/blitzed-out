import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Settings } from '@/types/Settings';
import { getSettingsMessage } from '../gameSettingsMessage';
import i18next from 'i18next';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    t: vi.fn(),
    resolvedLanguage: 'en',
  },
}));

describe('gameSettingsMessage - Finish Options Formatting', () => {
  const mockTranslations = {
    gameSettingsHeading: 'Game Settings',
    normal: 'Normal',
    finishSlider: 'Finish options:',
    noCum: 'No Orgasm:',
    ruined: 'Ruined Orgasm:',
    cum: 'Normal Orgasm:',
    customTilesLabel: 'Game Tiles',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock translations
    (i18next.t as any).mockImplementation((key: string) => {
      return mockTranslations[key as keyof typeof mockTranslations] || key;
    });
  });

  const createMockSettings = (finishRange: [number, number]): Settings => ({
    room: 'TEST',
    gameMode: 'local',
    finishRange,
    selectedActions: {
      teasing: { levels: [1], type: 'sex' as const },
    },
    boardUpdated: false,
  });

  const mockActionsList = {
    teasing: {
      label: 'Teasing',
      actions: {
        'teasing-1': { text: 'Light teasing', intensity: 1 },
      },
    },
  };

  describe('Single finish option at 100%', () => {
    it('should display single no-orgasm option inline without bullets or percentage', async () => {
      const settings = createMockSettings([100, 100]); // No Orgasm: 100%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options: No Orgasm');
      expect(result).not.toContain('100%');
      expect(result).not.toContain('  -');
    });

    it('should display single ruined orgasm option inline without bullets or percentage', async () => {
      const settings = createMockSettings([0, 100]); // Ruined: 100%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options: Ruined Orgasm');
      expect(result).not.toContain('100%');
      expect(result).not.toContain('  -');
    });

    it('should display single normal orgasm option inline without bullets or percentage', async () => {
      const settings = createMockSettings([0, 0]); // Normal: 100%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options: Normal Orgasm');
      expect(result).not.toContain('100%');
      expect(result).not.toContain('  -');
    });
  });

  describe('Multiple finish options with percentages', () => {
    it('should display multiple options with bullets and percentages', async () => {
      const settings = createMockSettings([33, 66]); // No: 33%, Ruined: 33%, Normal: 34%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options:');
      expect(result).toContain('  - No Orgasm: 33%');
      expect(result).toContain('  - Ruined Orgasm: 33%');
      expect(result).toContain('  - Normal Orgasm: 34%');
    });

    it('should display two options when one is 0%', async () => {
      const settings = createMockSettings([0, 50]); // Ruined: 50%, Normal: 50%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options:');
      expect(result).toContain('  - Ruined Orgasm: 50%');
      expect(result).toContain('  - Normal Orgasm: 50%');
      expect(result).not.toContain('No Orgasm');
    });

    it('should display two options for no-orgasm and normal', async () => {
      const settings = createMockSettings([40, 40]); // No: 40%, Normal: 60%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options:');
      expect(result).toContain('  - No Orgasm: 40%');
      expect(result).toContain('  - Normal Orgasm: 60%');
      expect(result).not.toContain('Ruined Orgasm');
    });
  });

  describe('Hidden 0% values', () => {
    it('should hide no-orgasm when 0%', async () => {
      const settings = createMockSettings([0, 50]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).not.toContain('No Orgasm: 0%');
      expect(result).not.toContain('No Orgasm');
    });

    it('should hide ruined orgasm when 0%', async () => {
      const settings = createMockSettings([50, 50]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).not.toContain('Ruined Orgasm: 0%');
      expect(result).not.toContain('Ruined Orgasm');
    });

    it('should hide normal orgasm when 0%', async () => {
      const settings = createMockSettings([50, 100]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).not.toContain('Normal Orgasm: 0%');
      expect(result).not.toContain('Normal Orgasm');
    });
  });

  describe('Single option not at 100%', () => {
    it('should display with bullets when multiple options present', async () => {
      const settings = createMockSettings([80, 80]); // No Orgasm: 80%, Normal: 20%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options:');
      expect(result).toContain('  - No Orgasm: 80%');
      expect(result).toContain('  - Normal Orgasm: 20%');
      expect(result).not.toContain('Ruined Orgasm');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined finishRange gracefully', async () => {
      const settings: Settings = {
        room: 'TEST',
        gameMode: 'local',
        selectedActions: {},
        boardUpdated: false,
        // finishRange is undefined
      };

      const result = await getSettingsMessage(settings, [], mockActionsList);
      expect(result).not.toContain('Finish options');
    });

    it('should handle empty finishRange gracefully', async () => {
      const settings = createMockSettings([0, 0]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('* Finish options: Normal Orgasm');
    });

    it('should properly format with double line break for markdown', async () => {
      const settings = createMockSettings([33, 66]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      // Check for proper markdown formatting with double line break
      expect(result).toMatch(/\* Finish options: \r\n\r\n/);
    });

    it('should remove colons from option text', async () => {
      const settings = createMockSettings([100, 100]);
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('No Orgasm');
      expect(result).not.toContain('No Orgasm:');
    });
  });

  describe('Boundary value testing', () => {
    it('should handle 1% values correctly', async () => {
      const settings = createMockSettings([1, 2]); // No: 1%, Ruined: 1%, Normal: 98%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('  - No Orgasm: 1%');
      expect(result).toContain('  - Ruined Orgasm: 1%');
      expect(result).toContain('  - Normal Orgasm: 98%');
    });

    it('should handle 99% values correctly', async () => {
      const settings = createMockSettings([99, 100]); // No: 99%, Ruined: 1%
      const result = await getSettingsMessage(settings, [], mockActionsList);

      expect(result).toContain('  - No Orgasm: 99%');
      expect(result).toContain('  - Ruined Orgasm: 1%');
      expect(result).not.toContain('Normal Orgasm');
    });
  });
});
