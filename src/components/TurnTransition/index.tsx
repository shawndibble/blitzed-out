import { useEffect, useRef } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface TurnTransitionProps {
  playerName: string;
  show: boolean;
  onComplete: () => void;
  duration?: number; // default 3000ms
  isCurrentUser?: boolean; // whether this is the current user's turn
}

export default function TurnTransition({
  playerName,
  show,
  onComplete,
  duration = 3000,
  isCurrentUser = false,
}: TurnTransitionProps): JSX.Element {
  const { t } = useTranslation();
  const onCompleteRef = useRef(onComplete);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  return (
    <Fade in={show} timeout={300}>
      <Box
        onClick={() => onCompleteRef.current()}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3500,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
          {isCurrentUser ? t('yourTurn') : t('playersTurn', { player: playerName })}
        </Typography>
      </Box>
    </Fade>
  );
}
