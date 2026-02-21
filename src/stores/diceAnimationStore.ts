import { create } from 'zustand';

interface DiceAnimationStore {
  lastAnimationSoundTimestamp: number;
  setAnimationSoundPlayed: () => void;
  wasRecentAnimationSound: () => boolean;
}

export const useDiceAnimationStore = create<DiceAnimationStore>((set, get) => ({
  lastAnimationSoundTimestamp: 0,
  setAnimationSoundPlayed: () => set({ lastAnimationSoundTimestamp: Date.now() }),
  wasRecentAnimationSound: () => Date.now() - get().lastAnimationSoundTimestamp < 5000,
}));
