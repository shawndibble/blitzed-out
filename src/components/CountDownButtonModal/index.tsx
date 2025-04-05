import { Backdrop, Box, Button, Modal, Typography } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import useCountdown from '@/hooks/useCountdown';
import { useEffect, useState, useRef } from 'react';

interface CountDownButtonModalProps {
  textString: string;
  preventParentClose: () => void;
  noPadding?: boolean;
}

const style = () => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 180,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 2,
  textAlign: 'right',
});

export default function CountDownButtonModal({
  textString,
  preventParentClose,
  noPadding = false,
}: CountDownButtonModalProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  const [time, seconds] = textString.split(' ');
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(parseInt(time), true);

  useEffect(() => togglePause(), [togglePause]);

  const clickedButton = () => {
    preventParentClose();
    setOpen(true);
    setTimeLeft(parseInt(time));
    if (isPaused) togglePause();
  };

  // handle timeout
  const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (open) timeoutId.current = setTimeout(() => setOpen(false), parseInt(time) * 1000);
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [open, time]);

  const handleClose = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setOpen(false);
  };

  // end handle timeout of TransitionModal.

  return (
    <>
      <Button onClick={clickedButton} sx={{ p: noPadding ? 0 : 1 }} color="secondary">
        {textString}
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Box sx={style}>
          <CloseIcon close={handleClose} />
          <Typography variant="h2" sx={{ display: 'inline-block' }}>
            {timeLeft}
          </Typography>
          <Typography sx={{ ml: 2, display: 'inline-block' }}>{seconds}</Typography>
        </Box>
      </Modal>
    </>
  );
}
