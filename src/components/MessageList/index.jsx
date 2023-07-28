import React, { useEffect, useState } from 'react';
import useSound from 'use-sound';
import {
  AppBar, Divider, Tab, Tabs,
} from '@mui/material';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import TextAvatar from 'components/TextAvatar';
import TransitionModal from 'components/TransitionModal';
import useLocalStorage from 'hooks/useLocalStorage';
import useAuth from 'hooks/useAuth';
import useMessages from 'hooks/useMessages';
import diceSound from 'sounds/roll-dice.mp3';
import messageSound from 'sounds/message.mp3';
import { a11yProps } from 'helpers/strings';
import { Trans, useTranslation } from 'react-i18next';
import moment from 'moment/moment';
import 'moment/locale/es';
import 'moment/locale/fr';
import './styles.css';

export default function MessageList({ room }) {
  const containerRef = React.useRef(null);
  const { user } = useAuth();
  const messages = useMessages(room);
  const {
    playerDialog, othersDialog, mySound, otherSound, chatSound,
  } = useLocalStorage('gameSettings')[0];
  const [currentTab, setTab] = useState(0);
  const [updatedMessages, setMessages] = useState(messages);
  const [popupMessage, setPopupMessage] = useState(false);
  const [playDiceSound] = useSound(diceSound);
  const [playMessageSound] = useSound(messageSound);
  const { t, i18n } = useTranslation();

  const filterMessages = (tabId) => setMessages(messages.filter((m) => {
    if (tabId === 1) return m.type === 'settings';
    if (tabId === 2) return m.type === 'chat';
    if (tabId === 3) return m.type === 'actions';
    return m;
  }));

  useEffect(() => {
    moment.locale(i18n.resolvedLanguage);
    const latestMessage = [...messages].pop();

    // prevent dialog from showing on reload/page change.
    const newMessage = moment(latestMessage?.timestamp?.toDate()).diff(moment(), 'seconds') > -1;
    const showPlayerDialog = playerDialog && latestMessage?.uid === user?.uid;
    const showOthersDialog = othersDialog && latestMessage?.uid !== user?.uid;
    if (newMessage && latestMessage?.type === 'actions' && (showPlayerDialog || showOthersDialog)) {
      setPopupMessage(latestMessage);
    }

    if (newMessage && latestMessage) {
      const myMessage = latestMessage?.uid === user?.uid;
      if (((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions') {
        playDiceSound();
      }

      if (chatSound && latestMessage?.type === 'chat') {
        playMessageSound();
      }
    }

    filterMessages(currentTab);
    // eslint-disable-next-line
  }, [messages, i18n.resolvedLanguage]);

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
    <div className="message-list-container" ref={containerRef}>
      <AppBar position="sticky">
        <Tabs variant="fullWidth" value={currentTab} onChange={handleChange} aria-label="chat filter" className="message-tabs">
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
            locale={i18n.resolvedLanguage}
          />
        ))}
      </ul>
      <TransitionModal
        text={popupMessage?.text}
        displayName={popupMessage?.displayName}
        setOpen={setPopupMessage}
        open={!!popupMessage || !!popupMessage?.text}
      />
    </div>
  );
}

function Message({ message, isOwnMessage }) {
  const {
    id, displayName, text, uid, timestamp, type,
  } = message;

  let ago = moment(timestamp?.toDate()).fromNow();
  if (ago === 'in a few seconds') ago = 'a few seconds ago';

  return (
    <li className={['message', isOwnMessage && 'own-message'].join(' ')}>
      <div className="message-header">
        <div className="sender">
          <TextAvatar uid={uid} displayName={displayName} size="small" />
          {displayName}
        </div>
        <div className="timestampe">{ago}</div>
      </div>
      <Divider />
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text}
        </ReactMarkdown>
        {type === 'settings' && (<Link to={`?importBoard=${id}`}><Trans i18nKey="importBoard" /></Link>)}
      </div>
    </li>
  );
}
