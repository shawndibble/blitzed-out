import { Fab, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FilterList, Check } from '@mui/icons-material';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';

import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import useSendSettings from '@/hooks/useSendSettings';
import { useTranslation } from 'react-i18next';
import Message from './Message';
import MessageSkeleton from './MessageSkeleton';
import './styles.css';
import { MessageType as MsgType } from '@/types/Message';

interface MessageListProps {
  room: string;
  isTransparent?: boolean;
  currentGameBoardSize?: number;
}

export default function MessageList({
  room,
  isTransparent,
  currentGameBoardSize = 40,
}: MessageListProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { messages, isLoading } = useMessages();
  useSendSettings(user, messages, isLoading);

  const [currentTab, setTab] = useState<number>(0);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  // Memoize filtered messages directly to avoid creating a new function on each render
  const updatedMessages = useMemo(() => {
    return messages.filter((m) => {
      if (currentTab === 1) return ['settings', 'room'].includes(m.type as MsgType);
      if (currentTab === 2) return ['chat', 'media'].includes(m.type as MsgType);
      if (currentTab === 3) return m.type === 'actions';
      return true; // currentTab === 0 (all messages)
    });
  }, [messages, currentTab]);

  // Scroll to bottom when new messages are added
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    const latestMessageId = latestMessage?.id || null;

    // Only scroll if this is actually a new message
    if (latestMessageId && latestMessageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = latestMessageId;

      if (containerRef.current) {
        // Use multiple timing strategies to ensure scroll happens after DOM update
        const scrollToBottom = () => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        };

        // Immediate attempt
        scrollToBottom();

        // Backup attempts with different timing
        requestAnimationFrame(scrollToBottom);
        setTimeout(scrollToBottom, 10);
      }
    }
  }, [messages.length, messages]);

  const handleFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(event.currentTarget);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterAnchor(null);
  }, []);

  const handleFilterSelect = useCallback((filterIndex: number) => {
    setTab(filterIndex);
    setFilterAnchor(null);
  }, []);

  const filterOptions = [
    { label: t('all'), value: 0 },
    { label: t('setting'), value: 1 },
    { label: t('chat'), value: 2 },
    { label: t('actions'), value: 3 },
  ];

  return (
    <div className="message-list-container">
      <div className="message-list-scroll transparent-scrollbar" ref={containerRef}>
        <div className="message-list-scroll-content">
          <ul className="message-list">
            {isLoading && updatedMessages.length === 0 ? (
              <MessageSkeleton count={5} />
            ) : (
              updatedMessages.map((x) => {
                // Memoize isOwnMessage calculation outside render
                const isOwnMessage = x.uid === user.uid;
                return (
                  <Message
                    key={x.id}
                    message={x}
                    isOwnMessage={isOwnMessage}
                    isTransparent={isTransparent}
                    currentGameBoardSize={currentGameBoardSize}
                    room={room}
                  />
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* Filter Button Overlay */}
      <div className="message-filter-header">
        <Fab
          size="medium"
          color="primary"
          aria-label="filter messages"
          onClick={handleFilterClick}
          className="message-filter-fab"
          sx={{ transform: 'scale(0.8)' }}
        >
          <FilterList />
        </Fab>
      </div>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: '200px',
              minWidth: '120px',
            },
          },
        }}
      >
        {filterOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleFilterSelect(option.value)}
            selected={currentTab === option.value}
          >
            <ListItemIcon>{currentTab === option.value && <Check />}</ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
