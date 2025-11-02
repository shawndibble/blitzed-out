import { useState, useEffect, useRef } from 'react';
import { IconButton, Drawer, Box } from '@mui/material';
import { Videocam, VideocamOff } from '@mui/icons-material';
import { useVideoCallStore } from '@/stores/videoCallStore';
import VideoCallPanel from './VideoCallPanel';

interface VideoSidebarProps {
  roomId: string;
  onToggle?: (isOpen: boolean) => void;
  onWidthChange?: (width: number) => void;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 320;

const VideoSidebar = ({ roomId, onToggle, onWidthChange }: VideoSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const { initialize, cleanup, isInitialized } = useVideoCallStore();
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_WIDTH);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);

    if (newState) {
      initialize(roomId);
    } else {
      if (isInitialized) {
        cleanup();
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + delta));
      setWidth(newWidth);
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <IconButton
        onClick={handleToggle}
        sx={{
          position: 'fixed',
          left: isOpen ? `${width + 16}px` : '16px',
          top: 80,
          zIndex: 900,
          bgcolor: 'background.paper',
          boxShadow: 2,
          transition: isResizing ? 'none' : 'left 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          '&:hover': {
            bgcolor: 'background.default',
          },
        }}
        aria-label={isOpen ? 'Close video sidebar' : 'Open video sidebar'}
      >
        {isOpen ? <VideocamOff /> : <Videocam />}
      </IconButton>

      {/* Drawer Sidebar */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={handleToggle}
        variant="persistent"
        sx={{
          width: isOpen ? width : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100vh - 64px)',
            zIndex: 900,
            backgroundColor: 'transparent',
            backgroundImage: 'none',
          },
        }}
      >
        <VideoCallPanel showLocalVideo={true} onEndCall={handleToggle} />

        {/* Resize Handle */}
        <Box
          onMouseDown={handleResizeStart}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'ew-resize',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'primary.main',
            },
            zIndex: 1000,
          }}
        />
      </Drawer>
    </>
  );
};

export default VideoSidebar;
