import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography,
} from '@mui/material';
import { Close, ExpandMore } from '@mui/icons-material';
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
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography>Custom Tiles Explained</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ mb: 2 }}>
                Custom tiles let you add your own variations to the game board.
                Utilize this dialog to add and remove tiles as you see fit.
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Custom tiles are added based on the kink and intensity you pick from
                the drop down. As such, you need to have that kink and intensity
                (or a higher intensity) selected for your custom tiles to show on the board.
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography>Ideas & Suggestions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="h6">Add new Activities</Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Come up with new activities that are not part of
                the existing list
              </Typography>

              <Typography variant="h6">Add harder tiles to easier intensities</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                When you pick higher
                intensity levels, the game will use the earlier intensity level and gradual move
                to whatyou picked. If you want harder tiles early on, add several to lower
                intensities.
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Example: You play Poppers - Advanced. Add advanced tiles to Poppers - Beginner
              </Typography>

              <Typography variant="h6">Combine activities into a single tile</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Combine multiple activites together in a single tile that normally would not
                go together.
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Example: Spit roast. Use a toy in your throat and ass at the same time.
              </Typography>
            </AccordionDetails>
          </Accordion>
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
