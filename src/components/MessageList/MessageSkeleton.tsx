import { Skeleton, Box, Divider } from '@mui/material';

interface MessageSkeletonProps {
  count?: number;
}

export default function MessageSkeleton({ count = 3 }: MessageSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li key={`skeleton-${index}`} style={{ padding: '16px', listStyle: 'none' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={120} height={20} />
            <Box flexGrow={1} />
            <Skeleton variant="text" width={80} height={16} />
          </Box>
          <Divider sx={{ mb: 1 }} />
          <Box ml={5}>
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
        </li>
      ))}
    </>
  );
}
