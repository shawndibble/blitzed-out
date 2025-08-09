import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { extractAction, extractTime } from '@/helpers/strings';
import { useCallback, useState } from 'react';

import CloseIcon from '@/components/CloseIcon';
import CountDownButtonModal from '@/components/CountDownButtonModal';
import GameOverDialog from '@/components/GameOverDialog';
import { Player } from '@/types/player';
import useBreakpoint from '@/hooks/useBreakpoint';
import useCountdown from '@/hooks/useCountdown';

interface TransitionModalProps {
  open: boolean;
  text?: string;
  displayName?: string;
  handleClose: () => void;
  stopAutoClose?: () => void;
  nextPlayer: Player | null;
  isMyMessage?: boolean;
}

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
  const isMobile = useBreakpoint();
  const [isGameOverOpen, setGameOverDialog] = useState<boolean>(false);

  const title = text?.match(/#\d*:.*(?=\n)/gs);

  const description = extractAction(text) || '';

  const numbers = extractTime(text, t('seconds'));

  const AUTO_CLOSE_SECONDS = 20;
  const { timeLeft, togglePause } = useCountdown(AUTO_CLOSE_SECONDS, false);
  const [showAutoCloseText, setAutoCloseText] = useState<boolean>(true);

  const player = nextPlayer?.displayName;

  const preventClose = useCallback(() => {
    togglePause();
    stopAutoClose();
    setAutoCloseText(false);
  }, [togglePause, stopAutoClose, setAutoCloseText]);

  const openGameOver = useCallback(() => {
    preventClose();
    setGameOverDialog(true);
  }, [preventClose]);

  const closeGameOver = useCallback(() => {
    setGameOverDialog(false);
  }, []);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        aria-labelledby="transition-dialog-title"
        aria-describedby="transition-dialog-description"
      >
        <DialogTitle id="transition-dialog-title" sx={{ pr: 6 }}>
          {`${title} ${t('for')} ${displayName}`}
          <CloseIcon close={handleClose} />
        </DialogTitle>
        <Box sx={{ px: 3 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, (timeLeft / AUTO_CLOSE_SECONDS) * 100))}
            sx={{
              height: 4,
              borderRadius: 2,
              mb: 1,
              '& .MuiLinearProgress-bar': {
                transition: 'transform 1000ms linear',
              },
            }}
            aria-label={t('autoCloseProgress')}
          />
        </Box>
        <DialogContent>
          <Typography id="transition-dialog-description" variant="h4" sx={{ mt: 1, mb: 1 }}>
            {description}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mb: 2 }}>
            {showAutoCloseText ? (
              <Trans i18nKey="autoCloseModal" values={{ timeLeft }} />
            ) : (
              <Trans i18nKey="autoCloseStopped" />
            )}
          </Typography>

          {numbers?.length && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Trans i18nKey="timers" />
              {numbers.map((textString) => (
                <CountDownButtonModal
                  key={textString}
                  textString={textString}
                  preventParentClose={preventClose}
                />
              ))}
            </Box>
          )}

          {!!nextPlayer && (
            <Box textAlign="center">
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                {nextPlayer.isSelf ? (
                  <Trans i18nKey="yourTurn" />
                ) : (
                  <Trans i18nKey="nextPlayersTurn" values={{ player }} />
                )}
              </Typography>
            </Box>
          )}
          {!!isMyMessage && text.includes(t('finish')) && (
            <Box textAlign="center">
              <Divider sx={{ my: 2 }} />
              <Button onClick={openGameOver}>
                <Typography>{t('playAgain')}</Typography>
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <GameOverDialog isOpen={isGameOverOpen} close={closeGameOver} />
    </div>
  );
}
