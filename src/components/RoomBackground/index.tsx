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
      role="presentation"
      sx={{
        backgroundImage: !isVideo && url ? `url(${url})` : 'none',
      }}
    >
      {isVideo && (
        isDirectVideo ? (
          <video
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
            src={url || undefined}
            className="video-background"
          />
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={url || undefined}
            title="video"
            allowFullScreen
            allow="autoplay"
            style={{ border: 0 }}
          />
        )
      )}
    </Box>
  );
}
