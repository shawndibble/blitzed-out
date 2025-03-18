import { ReactNode } from 'react';

export interface CustomTimerDialogProps {
  open: boolean;
  close: () => void;
  children?: ReactNode;
}
