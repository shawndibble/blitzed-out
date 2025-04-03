import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useSearchParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const GameSettings = lazy(() => import('@/views/GameSettings'));

interface AppSettingsDialogProps {
  open: boolean;
  close?: (() => void) | null;
  isMobile?: boolean;
}

export default function AppSettingsDialog({ open, close, isMobile = false }: AppSettingsDialogProps): JSX.Element | null {
  const isSmallScreen = isMobile || useBreakpoint();
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');

  if (hasImport) {
    return null;
  }

  return (
    <Dialog fullScreen={isSmallScreen} open={open} maxWidth="md">
      <DialogTitle>
        <Trans i18nKey="gameSettings" />
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>
        <Suspense fallback={<div>Loading...</div>}>
          <GameSettings 
            closeDialog={typeof close === 'function' ? close : undefined} 
            initialTab={2} // Open directly to App Settings tab (index 2)
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
