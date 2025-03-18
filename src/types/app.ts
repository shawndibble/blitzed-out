import { ReactNode } from 'react';

export interface WindowWithAuth extends Window {
  authContext?: any;
}

export interface ProvidersProps {
  children: ReactNode;
}
