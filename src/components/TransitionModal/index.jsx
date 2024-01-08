import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';
import { extractAction, extractTime } from 'helpers/strings';
import useCountdown from 'hooks/useCountdown';
import { useState } from 'react';
import CloseIcon from 'components/CloseIcon';
import CountDownButtonModal from 'components/CountDownButtonMobal';
import { Divider } from '@mui/material';

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
  open, text, displayName, handleClose, stopAutoClose = () => null, nextPlayer = '',
}) {
  const { t } = useTranslation();
  const title = text?.match(/(?:#[\d]*:).*(?=\n)/gs);
  const description = extractAction(text) || '';
  const numbers = extractTime(text, t('seconds'));

  const { timeLeft, togglePause } = useCountdown(12, false);
  const [showAutoCloseText, setAutoCloseText] = useState(true);

  const preventClose = () => {
    togglePause();
    stopAutoClose();
    setAutoCloseText(false);
  };

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
            <CloseIcon close={handleClose} />

            <Typography id="transition-modal-description" variant="h4" sx={{ mt: 2 }}>
              {description}
            </Typography>
            <br />
            <Typography variant="caption">
              {showAutoCloseText
                ? <Trans i18nKey="autoCloseModal" values={{ timeLeft }} />
                : <Trans i18nKey="autoCloseStopped" />}
            </Typography>
            <br />
            {numbers?.length && (
              <>
                <Trans i18nKey="timers" />
                {numbers.map((textString) => (
                  <CountDownButtonModal
                    key={textString}
                    textString={textString}
                    preventParentClose={preventClose}
                  />
                ))}
              </>
            )}
            {!!nextPlayer && (
              <>
                <Divider style={{ margin: '1rem 0 0.5rem' }} />
                <Typography variant="body1">
                  <Trans i18nKey="nextPlayersTurn" values={{ nextPlayer }} />
                </Typography>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
