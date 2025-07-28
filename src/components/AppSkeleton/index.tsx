import { Box, CircularProgress, Fade, Typography } from '@mui/material';

/**
 * Simple, elegant loading screen that works for all application states
 * Now matches the vibrant design system used throughout the app
 */
export default function AppSkeleton() {
  return (
    <Fade in timeout={300}>
      <Box
        className="gradient-background-vibrant"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Loading spinner with gradient */}
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              mb: 3,
              display: 'block',
              margin: '0 auto 1.5rem auto',
              '& .MuiCircularProgress-circle': {
                stroke: 'url(#ocean-gradient)',
              },
            }}
          />
          <svg width="0" height="0">
            <defs>
              <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0abde3" />
                <stop offset="50%" stopColor="#48dbfb" />
                <stop offset="100%" stopColor="#00d2d3" />
              </linearGradient>
            </defs>
          </svg>

          {/* Loading text with gradient */}
          <Typography
            variant="h6"
            className="gradient-text-ocean"
            sx={{
              fontWeight: 600,
              letterSpacing: '-0.025em',
            }}
          >
            Loading...
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
}
