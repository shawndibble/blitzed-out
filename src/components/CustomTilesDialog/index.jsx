import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Trans } from 'react-i18next';
import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import React from 'react';
import CustomTiles from '@/views/CustomTileDialog';
import useActionList from '@/hooks/useActionList';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';

export default function CustomTilesDialog({ open, close = null }) {
  const isMobile = useBreakpoint();
  const [formData] = useSettingsToFormData();
  const { isLoading, actionsList } = useActionList(formData?.gameMode);

  if (isLoading) return null;

  return (
    <Dialog fullScreen={isMobile} open={open} maxWidth="md">
      <DialogTitle>
        <Trans i18nKey="gameSettings" />
        {typeof close === 'function' && <CloseIcon close={close} />}
      </DialogTitle>
      <DialogContent>
        <CustomTiles
            setOpen={close}
            boardUpdated={() => null}
            actionsList={actionsList}
            open={open}
        />
      </DialogContent>
    </Dialog>
  );
}