import useSound from 'use-sound';
import cardDealSound from '@/sounds/card-deal.mp3';
import { useSettingsStore } from '@/stores/settingsStore';

export function useCardSound(): () => void {
  const mySound = useSettingsStore((state) => state.settings.mySound);
  const [play] = useSound(cardDealSound, {
    volume: 0.5,
  });

  return mySound ? play : () => {};
}
