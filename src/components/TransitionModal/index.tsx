import { Button, Divider, Theme } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import CloseIcon from '@/components/CloseIcon';
import CountDownButtonModal from '@/components/CountDownButtonModal';
import GameOverDialog from '@/components/GameOverDialog';
import { extractAction, extractTime } from '@/helpers/strings';
import useCountdown from '@/hooks/useCountdown';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Player } from '@/types/player';

interface TransitionModalProps {
  open: boolean;
  text?: string;
  displayName?: string;
  handleClose: () => void;
  stopAutoClose?: () => void;
  nextPlayer: Player | null;
  isMyMessage?: boolean;
}

const style = (theme: Theme) => ({
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
  open,
  text = '',
  displayName = '',
  handleClose,
  stopAutoClose = () => null,
  nextPlayer = null,
  isMyMessage = false,
}: TransitionModalProps): JSX.Element {
  const { t } = useTranslation();
  const [isGameOverOpen, setGameOverDialog] = useState<boolean>(false);

  const title = text?.match(/(?:#[\d]*:).*(?=\n)/gs);

  const description = extractAction(text) || '';

  const numbers = extractTime(text, t('seconds'));

  const { timeLeft, togglePause } = useCountdown(20, false);
  const [showAutoCloseText, setAutoCloseText] = useState<boolean>(true);

  const player = typeof nextPlayer === 'string' ? nextPlayer : nextPlayer?.displayName;

  const preventClose = () => {
    togglePause();
    stopAutoClose();
    setAutoCloseText(false);
  };

  const openGameOver = useCallback(() => {
    preventClose();
    setGameOverDialog(true);
  }, []);

  const closeGameOver = useCallback(() => {
    setGameOverDialog(false);
  }, []);

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
              {showAutoCloseText ? (
                <Trans i18nKey="autoCloseModal" values={{ timeLeft }} />
              ) : (
                <Trans i18nKey="autoCloseStopped" />
              )}
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
              <Box textAlign="center">
                <Divider style={{ margin: '1rem 0 0.5rem' }} />
                <Typography variant="body1">
                  {typeof nextPlayer !== 'string' && nextPlayer.isSelf ? (
                    <Trans i18nKey="yourTurn" />
                  ) : (
                    <Trans i18nKey="nextPlayersTurn" values={{ player }} />
                  )}
                </Typography>
              </Box>
            )}
            {!!isMyMessage && text.includes(t('finish')) && (
              <Box textAlign="center">
                <Divider style={{ margin: '1rem 0 0.5rem' }} />
                <Button onClick={openGameOver}>
                  <Typography>{t('playAgain')}</Typography>
                </Button>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
      <GameOverDialog isOpen={isGameOverOpen} close={closeGameOver} />
    </div>
  );
}
