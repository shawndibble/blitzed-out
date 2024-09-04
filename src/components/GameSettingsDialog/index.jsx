import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from 'components/CloseIcon';
import GameSettings from 'views/GameSettings';
import useBreakpoint from 'hooks/useBreakpoint';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function GameSettingsDialog({
  openSettingsDialog,
  closeSettings = () => null,
}) {
  const isMobile = useBreakpoint();
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');

  if (hasImport) {
    return null;
  }

  return (
    <Dialog fullScreen={isMobile} open={openSettingsDialog} maxWidth="md">
      <DialogTitle>
        <Trans i18nKey="gameSettings" />
        {typeof closeSettings === 'function' && (
          <CloseIcon close={closeSettings} />
        )}
      </DialogTitle>
      <DialogContent>
        <GameSettings closeDialog={closeSettings} />
      </DialogContent>
    </Dialog>
  );
}
