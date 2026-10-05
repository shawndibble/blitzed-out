import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../safeStorage';

describe('persistStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps state updates working when localStorage is null (disabled WebView DOM storage)', () => {
    vi.stubGlobal('localStorage', null);
    const useStore = create<{ n: number; inc: () => void }>()(
      persist((set, get) => ({ n: 0, inc: () => set({ n: get().n + 1 }) }), {
        name: 'null-storage',
        storage: persistStorage,
      })
    );

    expect(() => useStore.getState().inc()).not.toThrow();
    expect(useStore.getState().n).toBe(1);
  });

  it('keeps state updates working when touching localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      removeItem: () => {},
    });
    const useStore = create<{ n: number; inc: () => void }>()(
      persist((set, get) => ({ n: 0, inc: () => set({ n: get().n + 1 }) }), {
        name: 'throwing-storage',
        storage: persistStorage,
      })
    );

    expect(() => useStore.getState().inc()).not.toThrow();
    expect(useStore.getState().n).toBe(1);
  });

  it('persists to localStorage when available', () => {
    const useStore = create<{ n: number; inc: () => void }>()(
      persist((set, get) => ({ n: 0, inc: () => set({ n: get().n + 1 }) }), {
        name: 'ok-storage',
        storage: persistStorage,
      })
    );
    useStore.getState().inc();
    expect(localStorage.getItem('ok-storage')).toContain('"n":1');
  });
});
