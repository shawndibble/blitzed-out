import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';
import { extractAction } from 'helpers/strings';
import { useEffect, useState } from 'react';

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
  open, text, displayName, handleClose,
}) {
  const { t } = useTranslation();
  const title = text?.match(/(?:#[\d]*:).*(?=\r)/gs);
  const description = extractAction(text);

  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    if (timeLeft === 0) {
      setTimeLeft(null);
    }

    // exit early when we reach 0
    if (!timeLeft) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    // eslint-disable-next-line consistent-return
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
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
            <Typography variant="caption"><Trans i18nKey="autoCloseModal" values={{ timeLeft }} /></Typography>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
