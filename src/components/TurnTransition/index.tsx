import { useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface TurnTransitionProps {
  playerName: string;
  show: boolean;
  onComplete: () => void;
  duration?: number; // default 3000ms
}

export default function TurnTransition({
  playerName,
  show,
  onComplete,
  duration = 3000,
}: TurnTransitionProps): JSX.Element {
  const theme = useTheme();

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <Fade in={show} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: theme.zIndex.modal - 1,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
          {playerName}&apos;s Turn
        </Typography>
      </Box>
    </Fade>
  );
}
