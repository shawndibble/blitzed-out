import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import useBreakpoint from 'hooks/useBreakpoint';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import GameSettingsWizard from 'views/GameSettingsWizard';

export default function GameSettingsDialog({ openSettingsDialog }) {
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
      </DialogTitle>
      <DialogContent>
        <GameSettingsWizard />
      </DialogContent>
    </Dialog>
  );
}
