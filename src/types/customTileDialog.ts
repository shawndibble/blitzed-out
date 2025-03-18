import { SyntheticEvent } from 'react';

export interface HandleChangeFunction {
  (panel: string): (event: SyntheticEvent, isExpanded: boolean) => void;
}
