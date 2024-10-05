import { Backdrop, Box, Button, Modal, Typography } from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import useCountdown from '@/hooks/useCountdown';
import { useEffect, useState } from 'react';

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
}) {
  const [open, setOpen] = useState(false);

  const [time, seconds] = textString.split(' ');
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(time, true);

  useEffect(() => togglePause(), []);

  const clickedButton = () => {
    preventParentClose();
    setOpen(true);
    setTimeLeft(time);
    if (isPaused) togglePause();
  };

  // handle timeout
  let timeoutId;
  useEffect(() => {
    if (open) timeoutId = setTimeout(() => setOpen(false), time * 1000);
    return () => clearTimeout(timeoutId);
  }, [open]);

  const handleClose = () => {
    clearTimeout(timeoutId);
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
