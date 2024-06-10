import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from 'components/CloseIcon';
import GameSettings from 'views/GameSettings';
import useBreakpoint from 'hooks/useBreakpoint';
import React from 'react';

export default function GameSettingsDialog({
  openSettingsDialog,
  closeSettings = () => null,
}) {
  const isMobile = useBreakpoint();

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
