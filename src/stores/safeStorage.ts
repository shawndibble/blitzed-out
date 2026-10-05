import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// Some WebViews disable DOM storage: `localStorage` is null, or access
// throws. zustand's own guard only catches the throw, so a null storage
// crashes every set(). Fall back to a no-op; state stays in memory.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function resolveStorage(): StateStorage {
  try {
    return window.localStorage ?? noopStorage;
  } catch {
    return noopStorage;
  }
}

const guard =
  <K extends keyof StateStorage>(method: K) =>
  (...args: Parameters<StateStorage[K]>) => {
    try {
      return (resolveStorage()[method] as (...a: unknown[]) => unknown)(...args);
    } catch {
      return method === 'getItem' ? null : undefined;
    }
  };

export const persistStorage = createJSONStorage(
  () =>
    ({
      getItem: guard('getItem'),
      setItem: guard('setItem'),
      removeItem: guard('removeItem'),
    }) as StateStorage
);
