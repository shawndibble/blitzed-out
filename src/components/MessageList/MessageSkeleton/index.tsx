import { Skeleton, Divider } from '@mui/material';
import { memo } from 'react';

interface MessageSkeletonProps {
  count?: number;
}

function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="message">
          <div className="message-header">
            <div className="sender">
              <Skeleton variant="circular" width={18} height={18} sx={{ mr: 0.5 }} />
              <Skeleton variant="text" width={80} height={20} />
            </div>
            <div className="timestamp">
              <Skeleton variant="text" width={60} height={16} />
            </div>
          </div>
          <Divider sx={{ mb: 1 }} />
          <div className="message-message">
            <Skeleton variant="text" width="90%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="75%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="60%" height={16} />
          </div>
        </li>
      ))}
    </>
  );
}

export default memo(MessageSkeleton);
