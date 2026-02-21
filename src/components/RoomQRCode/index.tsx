import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface RoomQRCodeProps {
  roomCode: string;
}

export default function RoomQRCode({ roomCode }: RoomQRCodeProps) {
  const { t } = useTranslation();

  if (!roomCode) return null;

  const roomUrl = `${window.location.origin}/${roomCode}`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: 2,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          backgroundColor: 'white',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <QRCodeSVG value={roomUrl} size={120} level="M" aria-label={t('scanToJoin')} role="img" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('scanToJoin')}
      </Typography>
    </Box>
  );
}
