import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { Pause, PlayArrow, Replay } from '@mui/icons-material';
import { useEffect, useState } from 'react';

import CloseIcon from '@/components/CloseIcon';
import useBreakpoint from '@/hooks/useBreakpoint';
import useCountdown from '@/hooks/useCountdown';

interface CountDownButtonModalProps {
  textString: string;
  preventParentClose: () => void;
  noPadding?: boolean;
}

export default function CountDownButtonModal({
  textString,
  preventParentClose,
  noPadding = false,
}: CountDownButtonModalProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const isMobile = useBreakpoint();

  const [time, seconds] = textString.split(' ');
  const totalSeconds = parseInt(time, 10);
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(totalSeconds, true);

  useEffect(() => togglePause(), [togglePause]);

  const clickedButton = () => {
    preventParentClose();
    setOpen(true);
    setTimeLeft(totalSeconds);
    if (isPaused) togglePause();
  };

  // Close when countdown completes
  useEffect(() => {
    if (open && timeLeft <= 0) setOpen(false);
  }, [open, timeLeft]);

  const handleClose = () => setOpen(false);

  // end handle timeout of TransitionModal.

  return (
    <>
      <Button onClick={clickedButton} sx={{ p: noPadding ? 0 : 1 }} color="secondary">
        {textString}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={isMobile}
        maxWidth="xs"
        aria-labelledby="countdown-dialog-title"
      >
        <DialogTitle id="countdown-dialog-title" sx={{ pr: 6 }}>
          <CloseIcon close={handleClose} />
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              py: 1,
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))}
                size={96}
                thickness={4}
                color="primary"
                sx={{
                  '& .MuiCircularProgress-circle': {
                    transition: 'stroke-dashoffset 1000ms linear',
                  },
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h3" aria-live="polite">
                  {timeLeft}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {seconds}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={togglePause}
                color="primary"
                aria-label={isPaused ? 'resume countdown' : 'pause countdown'}
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
              <IconButton
                onClick={() => setTimeLeft(totalSeconds)}
                color="primary"
                aria-label="restart countdown"
              >
                <Replay />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
