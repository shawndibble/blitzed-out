import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppBar, Tab, Tabs } from '@mui/material';

import useAuth from 'hooks/useAuth';
import useMessages from 'hooks/useMessages';
import { a11yProps } from 'helpers/strings';
import { useTranslation } from 'react-i18next';
import 'moment/locale/es';
import 'moment/locale/fr';
import './styles.css';
import useSendSettings from 'hooks/useSendSettings';
import Message from './Message';

export default function MessageList({
  room,
  isTransparent,
  currentGameBoardSize = 40,
}) {
  const containerRef = React.useRef(null);
  const { user } = useAuth();
  const { messages, isLoading } = useMessages(room);
  useSendSettings(user, messages, isLoading);

  const [currentTab, setTab] = useState(0);
  const { t, i18n } = useTranslation();

  const filterMessages = useCallback(
    (tabId) =>
      messages.filter((m) => {
        if (tabId === 1) return m.type === 'settings';
        if (tabId === 2) return ['chat', 'media'].includes(m.type);
        if (tabId === 3) return m.type === 'actions';
        return m;
      }),
    [messages]
  );

  const updatedMessages = useMemo(
    () => filterMessages(currentTab),
    [filterMessages, currentTab]
  );

  useEffect(() => {
    if (isLoading) return;
    filterMessages(currentTab);
  }, [messages, isLoading, i18n.resolvedLanguage]);

  React.useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  });

  const handleChange = (_, newValue) => {
    setTab(newValue);
    filterMessages(newValue);
  };

  return (
    <div className='message-list-container' ref={containerRef}>
      <AppBar position='sticky'>
        <Tabs
          variant='fullWidth'
          value={currentTab}
          onChange={handleChange}
          aria-label='chat filter'
          className='message-tabs'
        >
          <Tab label={t('all')} {...a11yProps('all')} />
          <Tab label={t('setting')} {...a11yProps('settings')} />
          <Tab label={t('chat')} {...a11yProps('chat')} />
          <Tab label={t('actions')} {...a11yProps('actions')} />
        </Tabs>
      </AppBar>
      <ul className='message-list'>
        {updatedMessages.map((x) => (
          <Message
            key={x.id}
            message={x}
            isOwnMessage={x.uid === user.uid}
            locale={i18n.resolvedLanguage}
            isTransparent={isTransparent}
            currentGameBoardSize={currentGameBoardSize}
            room={room}
          />
        ))}
      </ul>
    </div>
  );
}
