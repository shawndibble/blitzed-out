type DiceBoxConstructor = new (
  selector: string,
  options: Record<string, unknown>
) => {
  initialize: () => Promise<void>;
  roll: (notation: string) => Promise<unknown>;
  clear: () => void;
};

let preloadPromise: Promise<DiceBoxConstructor> | null = null;
let preloadedDiceBox: DiceBoxConstructor | null = null;

function startPreload(): Promise<DiceBoxConstructor> {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = import('@3d-dice/dice-box-threejs')
    .then((module) => {
      preloadedDiceBox = module.default as DiceBoxConstructor;
      return preloadedDiceBox;
    })
    .catch((error) => {
      preloadPromise = null;
      throw error;
    });

  return preloadPromise;
}

export function preloadDiceBox(): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => startPreload(), { timeout: 3000 });
  } else {
    setTimeout(() => startPreload(), 100);
  }
}

export async function getPreloadedDiceBox(): Promise<DiceBoxConstructor> {
  if (preloadedDiceBox) {
    return preloadedDiceBox;
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  return startPreload();
}
