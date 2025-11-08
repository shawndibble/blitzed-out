import type { PlayerGender } from './localPlayers';

export interface Player {
  uid: string;
  displayName: string;
  photoURL?: string;
  /** Player gender for anatomy placeholder replacement (optional for backward compatibility) */
  gender?: PlayerGender;
  isSelf: boolean;
  isFinished: boolean;
}
