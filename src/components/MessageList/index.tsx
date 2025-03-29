import { AppBar, Tab, Tabs } from '@mui/material';
import { useCallback, useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';

import { a11yProps } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import useSendSettings from '@/hooks/useSendSettings';
import 'moment/locale/es';
import 'moment/locale/fr';
import { useTranslation } from 'react-i18next';
import Message from './Message';
import './styles.css';
import { Message as MessageType, MessageType as MsgType } from '@/types/Message';

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
  const { t, i18n } = useTranslation();

  const filterMessages = useCallback(
    (tabId: number): MessageType[] =>
      messages.filter((m) => {
        if (tabId === 1) return ['settings', 'room'].includes(m.type as MsgType);
        if (tabId === 2) return ['chat', 'media'].includes(m.type as MsgType);
        if (tabId === 3) return m.type === 'actions';
        return m;
      }),
    [messages]
  );

  const updatedMessages = useMemo(() => filterMessages(currentTab), [filterMessages, currentTab]);

  useEffect(() => {
    if (isLoading) return;
    filterMessages(currentTab);
  }, [messages, isLoading, i18n.resolvedLanguage, filterMessages, currentTab]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  });

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    filterMessages(newValue);
  };

  return (
    <div className="message-list-container" ref={containerRef}>
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
      <ul className="message-list">
        {updatedMessages.map((x) => (
          <Message
            key={x.id}
            message={x}
            isOwnMessage={x.uid === user.uid}
            isTransparent={isTransparent}
            currentGameBoardSize={currentGameBoardSize}
            room={room}
          />
        ))}
      </ul>
    </div>
  );
}
