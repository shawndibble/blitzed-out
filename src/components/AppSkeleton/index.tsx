import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Simple, elegant loading screen that works for all application states
 * Replaces complex skeleton that didn't match actual UI flow
 */
export default function AppSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a', // Match app background
        color: '#f8fafc',
      }}
    >
      {/* Loading spinner */}
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: '#4f46e5', // Primary brand color
          mb: 3,
        }}
      />

      {/* Loading text */}
      <Typography
        variant="h6"
        sx={{
          opacity: 0.8,
          fontWeight: 400,
          letterSpacing: '0.02em',
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
}
