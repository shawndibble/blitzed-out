import { ReactNode } from 'react';

export interface RollOptionsMenuProps {
  options: Map<string, string> | Record<string, string>;
  selectedRoll: string;
  handleMenuItemClick: (value: string) => void;
}
