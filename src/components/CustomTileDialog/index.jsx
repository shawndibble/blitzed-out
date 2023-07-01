import { useState } from 'react';
import {
  Dialog, DialogContent, DialogContentText, DialogTitle, Divider, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useWindowDimensions from 'hooks/useWindowDimensions';
import useLocalStorage from 'hooks/useLocalStorage';
import ToastAlert from 'components/ToastAlert';
import AddCustomTile from './AddCustomTile';
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
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Manage your custom tiles here.
            Note:
            You still need to have the coresponding setting enable for your custom tiles to show.
          </DialogContentText>
          <AddCustomTile
            setSubmitMessage={setSubmitMessage}
            addCustomTile={addCustomTile}
            customTiles={customTiles}
          />
          {!!customTiles.length && (<Divider light sx={{ my: 2 }} />)}
          <ViewCustomTiles customTiles={customTiles} setCustomTiles={setCustomTiles} />
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
