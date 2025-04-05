import { Box } from '@mui/material';
import './styles.css';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Check if the URL is a direct video file (MP4, WebM, etc.)
  const isDirectVideo = url && /\.(mp4|webm|ogg|mov)(\?.*)?$/.test(url);
  
  return (
    <Box
      className="main-container"
      sx={{
        backgroundImage: !isVideo && url ? `url(${url})` : 'none',
      }}
    >
      {isVideo && (
        isDirectVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            src={url || ''}
            className="video-background"
          />
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={url || ''}
            title="video"
            allowFullScreen
            allow="autoplay"
            style={{ border: 'none' }}
          />
        )
      )}
    </Box>
  );
}
