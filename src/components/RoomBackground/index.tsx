import { Box } from '@mui/material';
import './styles.css';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  return (
    <Box
      className="main-container"
      sx={{
        backgroundImage: !isVideo && url ? `url(${url})` : 'none',
      }}
    >
      {isVideo && (
        <iframe
          width="100%"
          height="100%"
          src={url || ''}
          title="video"
          allowFullScreen
          allow="autoplay"
          style={{ border: 'none' }}
        />
      )}
    </Box>
  );
}
