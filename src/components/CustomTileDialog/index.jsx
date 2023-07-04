import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Divider, IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import useWindowDimensions from 'hooks/useWindowDimensions';
import useLocalStorage from 'hooks/useLocalStorage';
import ToastAlert from 'components/ToastAlert';
import AddCustomTile from './AddCustomTile';
import CustomTileHelp from './CustomTileHelp';
import ViewCustomTiles from './ViewCustomTiles';

export default function CustomTileDialog({ setOpen, open = false }) {
  const { isMobile } = useWindowDimensions();
  const [submitMessage, setSubmitMessage] = useState({ message: '', type: 'info' });
  const [customTiles, setCustomTiles] = useLocalStorage('customTiles', []);

  const addCustomTile = (category, action) => {
    // split at dash and trim whitespace
    const [group, intensity] = category.split(/[-]+/).map((s) => s.trim());
    setCustomTiles([...customTiles, { group, intensity, action }]);
  };

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          Manage Custom Tiles
          <IconButton
            aria-label="close"
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
          />

          {!!customTiles.length && (
            <>
              <Divider light sx={{ my: 2 }} />
              <ViewCustomTiles customTiles={customTiles} setCustomTiles={setCustomTiles} />
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
