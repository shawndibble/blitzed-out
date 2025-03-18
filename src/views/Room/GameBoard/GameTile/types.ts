import { ReactNode } from 'react';
import { Player } from '@/types/Message';

export interface GameTileProps {
  title: string;
  description: string;
  players: Player[];
  current: Player | null;
  isTransparent: boolean;
  className: string;
  id?: string;
}
