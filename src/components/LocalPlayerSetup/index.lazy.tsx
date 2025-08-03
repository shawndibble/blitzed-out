import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Lazy load the LocalPlayerSetup component
const LocalPlayerSetupLazy = lazy(() => import('./index'));

// Loading fallback component
export const LocalPlayerSetupLoading = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        {t('localPlayers.loading', 'Loading local players...')}
      </Typography>
    </Box>
  );
};

// Error boundary fallback
export const LocalPlayerSetupError = ({ error }: { error: Error }) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" color="error">
        {t('localPlayers.loadError', 'Failed to load local players')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {error.message}
      </Typography>
    </Box>
  );
};

// Props interface (re-exported from main component)
export interface LocalPlayerSetupProps {
  roomId: string;
  isPrivateRoom: boolean;
  onComplete: (players: any[], settings: any) => void;
  onCancel: () => void;
}

/**
 * Lazy-loaded wrapper for LocalPlayerSetup component.
 * Provides loading states and error handling while reducing initial bundle size.
 */
export const LocalPlayerSetup: React.FC<LocalPlayerSetupProps> = (props) => {
  return (
    <Suspense fallback={<LocalPlayerSetupLoading />}>
      <LocalPlayerSetupLazy {...props} />
    </Suspense>
  );
};

// Error boundary wrapper
export class LocalPlayerSetupErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LocalPlayerSetup error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <LocalPlayerSetupError error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Combined lazy component with error boundary
export const LocalPlayerSetupWithBoundary: React.FC<LocalPlayerSetupProps> = (props) => {
  return (
    <LocalPlayerSetupErrorBoundary>
      <LocalPlayerSetup {...props} />
    </LocalPlayerSetupErrorBoundary>
  );
};

export default LocalPlayerSetup;
