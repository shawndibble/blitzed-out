import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useSearchParams } from 'react-router-dom';
import GameSettings from '@/views/GameSettings';

interface AppSettingsDialogProps {
  open: boolean;
  close?: (() => void) | null;
  isMobile?: boolean;
}

export default function AppSettingsDialog({
  open,
  close,
  isMobile = false,
}: AppSettingsDialogProps): JSX.Element | null {
  const breakpointResult = useBreakpoint();
  const isSmallScreen = isMobile || breakpointResult;
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');

  if (hasImport) {
    return null;
  }

  return (
    <Dialog fullScreen={isSmallScreen} open={open} maxWidth="md">
      <DialogTitle>
        <Trans i18nKey="gameSettingsHeading" />
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>
        <GameSettings
          closeDialog={typeof close === 'function' ? close : undefined}
          initialTab={2} // Open directly to App Settings tab (index 2)
        />
      </DialogContent>
    </Dialog>
  );
}
