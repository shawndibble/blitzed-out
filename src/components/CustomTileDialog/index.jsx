import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Divider, IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import useWindowDimensions from 'hooks/useWindowDimensions';
import useLocalStorage from 'hooks/useLocalStorage';
import ToastAlert from 'components/ToastAlert';
import groupDataFolder from 'helpers/datafolder';
import AddCustomTile from './AddCustomTile';
import CustomTileHelp from './CustomTileHelp';
import ViewCustomTiles from './ViewCustomTiles';

export default function CustomTileDialog({
  boardUpdated, dataFolder, setOpen, open = false,
}) {
  const { t } = useTranslation();
  const { isMobile } = useWindowDimensions();
  const [submitMessage, setSubmitMessage] = useState({ message: '', type: 'info' });
  const [customTiles, setCustomTiles] = useLocalStorage('customTiles', []);

  const addCustomTile = (group, intensity, action) => {
    setCustomTiles([...customTiles, { group, intensity, action }]);
    boardUpdated();
  };

  const mappedGroups = groupDataFolder(dataFolder);

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          <Trans i18nKey="manageTiles" />
          <IconButton
            aria-label={t('close')}
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <CustomTileHelp />

          <AddCustomTile
            setSubmitMessage={setSubmitMessage}
            addCustomTile={addCustomTile}
            customTiles={customTiles}
            mappedGroups={mappedGroups}
          />

          {!!customTiles.length && (
            <>
              <Divider light sx={{ my: 2 }} />
              <ViewCustomTiles
                customTiles={customTiles}
                setCustomTiles={setCustomTiles}
                boardUpdated={boardUpdated}
                mappedGroups={mappedGroups}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
      <ToastAlert
        open={!!submitMessage.message}
        close={() => setSubmitMessage({ message: '', type: 'info' })}
        type={submitMessage.type}
      >
        {submitMessage.message}
      </ToastAlert>
    </>
  );
}
