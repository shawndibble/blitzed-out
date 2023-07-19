import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';

const style = (theme) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  [theme.breakpoints.down('sm')]: {
    width: '90%',
  },
});

export default function TransitionModal({
  open, setOpen, text, displayName,
}) {
  const { t } = useTranslation();
  let timeoutId;
  if (open) timeoutId = setTimeout(() => setOpen(false), 8000);

  const title = text?.match(/(?:#[\d]*:).*(?=\r)/gs);

  // Since "action" can be different for other languages, grab the last line after the : instead.
  const textLines = text?.split(/\r?\n/) || [];
  const description = textLines[textLines.length - 1]?.split(':')[1];

  function handleClose() {
    clearTimeout(timeoutId);
    setOpen(false);
  }

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={() => handleClose()}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
              {`${title} ${t('for')} ${displayName}`}
            </Typography>
            <Typography id="transition-modal-description" variant="h4" sx={{ mt: 2 }}>
              {description}
            </Typography>
            <br />
            <Typography variant="caption"><Trans i18nKey="autoCloseModal" /></Typography>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
