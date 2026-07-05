import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from '@/components/CloseIcon';
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
}: AppSettingsDialogProps): JSX.Element | null {
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');

  if (hasImport) {
    return null;
  }

  // Advanced settings is a full page, not a modal, at every breakpoint.
  return (
    <Dialog fullScreen open={open} onClose={close ?? undefined}>
      <DialogTitle>
        <Trans i18nKey="gameSettingsHeading" />
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>
        <GameSettings closeDialog={typeof close === 'function' ? close : undefined} />
      </DialogContent>
    </Dialog>
  );
}
