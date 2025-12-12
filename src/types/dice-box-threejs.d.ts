declare module '@3d-dice/dice-box-threejs' {
  export interface DiceBoxConfig {
    theme_customColorset?: {
      background: string;
      foreground: string;
    };
    theme_material?: 'glass' | 'plastic' | 'metal' | 'wood' | 'none';
    theme_colorset?: string;
    light_intensity?: number;
    gravity_multiplier?: number;
    baseScale?: number;
    strength?: number;
    sounds?: boolean;
    shadows?: boolean;
    onRollComplete?: (results: DiceRollResult) => void;
  }

  export interface DiceRollResult {
    notation: string;
    rolls: Array<{
      die: string;
      value: number;
    }>;
    total: number;
  }

  export default class DiceBox {
    constructor(container: string, config?: DiceBoxConfig);
    initialize(): Promise<void>;
    roll(notation: string): Promise<DiceRollResult>;
    clear(): void;
  }
}
