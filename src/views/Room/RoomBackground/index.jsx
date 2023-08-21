import { Box } from '@mui/material';
import { getExtention, getURLPath, isVideo } from 'helpers/strings';

export default function RoomBackground({ settings, room, roomBackgroundUrl }) {
  const {
    background, backgroundURL, roomBackground,
  } = settings;
  const backgroundSource = background !== 'custom' ? background : backgroundURL;
  const roomBackgroundSource = roomBackground === 'app' ? roomBackground : roomBackgroundUrl;

  const bgSource = room !== 'public' && roomBackground !== 'app' ? roomBackgroundSource : backgroundSource;
  const isVideoFile = isVideo(bgSource);
  const bgExtension = getExtention(bgSource);
  const sourcePath = getURLPath(bgSource);

  return (
    <Box className="main-container" sx={{ backgroundImage: !!bgExtension && !isVideoFile && `url(${sourcePath})` }}>
      {!!isVideoFile && (
        <video autoPlay loop muted>
          <source src={sourcePath} type={`video/${bgExtension}`} />
        </video>
      )}
    </Box>
  );
}
