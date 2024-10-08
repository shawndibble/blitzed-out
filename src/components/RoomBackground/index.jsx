import { Box } from '@mui/material';
import React from 'react';

export default function RoomBackground({ url = null, isVideo = null }) {
  return (
    <Box className="main-container" sx={{ backgroundImage: !isVideo && `url(${url})` }}>
      {isVideo && (
        <iframe
          width="100%"
          height="100%"
          src={url}
          title="video"
          allowFullScreen
          allow="autoplay"
          style={{ border: 'none' }}
        />
      )}
    </Box>
  );
}
