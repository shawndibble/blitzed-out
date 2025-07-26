import { AppBar, Tab, Tabs } from '@mui/material';
import { useCallback, useMemo, useState, useRef, useLayoutEffect } from 'react';

import { a11yProps } from '@/helpers/strings';
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

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [updatedMessages.length]); // Only scroll when new messages are added

  const handleChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  }, []);

  return (
    <div className="message-list-container">
      <AppBar position="sticky">
        <Tabs
          variant="fullWidth"
          value={currentTab}
          onChange={handleChange}
          aria-label="chat filter"
          className="message-tabs"
        >
          <Tab label={t('all')} {...a11yProps('all')} />
          <Tab label={t('setting')} {...a11yProps('settings')} />
          <Tab label={t('chat')} {...a11yProps('chat')} />
          <Tab label={t('actions')} {...a11yProps('actions')} />
        </Tabs>
      </AppBar>
      <div className="message-list-scroll" ref={containerRef}>
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
    </div>
  );
}
