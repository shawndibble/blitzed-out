import { ReactNode } from 'react';

export interface CustomTimerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (time: number, settings?: Partial<TimerSettings>) => void;
  children?: ReactNode;
}

interface TimerSettings {
  isRange: boolean;
  min: number;
  max: number;
}
