import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useSearchParams } from 'react-router-dom';
import GameSettingsWizard from '@/views/GameSettingsWizard';

interface GameSettingsDialogProps {
  open: boolean;
  close?: (() => void) | null;
}

export default function GameSettingsDialog({ open, close }: GameSettingsDialogProps): JSX.Element | null {
  const isMobile = useBreakpoint();
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');

  if (hasImport) {
    return null;
  }

  return (
    <Dialog fullScreen={isMobile} open={open} maxWidth="md">
      <DialogTitle>
        <Trans i18nKey="gameSettings" />
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>
        <GameSettingsWizard close={typeof close === 'function' ? close : undefined} />
      </DialogContent>
    </Dialog>
  );
}
