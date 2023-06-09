import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Divider, IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import useWindowDimensions from 'hooks/useWindowDimensions';
import useLocalStorage from 'hooks/useLocalStorage';
import ToastAlert from 'components/ToastAlert';
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

  const addCustomTile = (category, action) => {
    // split at dash and trim whitespace
    const [group, intensity] = category.split(/[-]+/).map((s) => s.trim());
    setCustomTiles([...customTiles, { group, intensity, action }]);
    boardUpdated();
  };

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
            dataFolder={dataFolder}
          />

          {!!customTiles.length && (
            <>
              <Divider light sx={{ my: 2 }} />
              <ViewCustomTiles
                customTiles={customTiles}
                setCustomTiles={setCustomTiles}
                boardUpdated={boardUpdated}
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
