import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useMessages from '../../hooks/useMessages';
import './styles.css';
import { AppBar, Divider, Tab, Tabs } from '@mui/material';
import moment from 'moment/moment';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageList({ roomId }) {
    const containerRef = React.useRef(null);
    const { user } = useAuth();
    const messages = useMessages(roomId);
    const [currentTab, setTab] = useState(0);
    const [updatedMessages, setMessages] = useState(messages);

    useEffect(() => {
        filterMessages(currentTab);
    // eslint-disable-next-line
    }, [messages]);

    React.useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    });

    const handleChange = (_, newValue) => {
        setTab(newValue);
        filterMessages(newValue);
    };

    const filterMessages = tabId => {
        return setMessages(messages.filter(m => {
            if (tabId === 1) return !m.isGameAction;
            if (tabId === 2) return m.isGameAction;
            return m;
        }));
    }

    return (
        <div className="message-list-container" ref={containerRef}>
            <AppBar position="sticky">
                <Tabs variant="fullWidth" value={currentTab} onChange={handleChange} aria-label="chat filter">
                    <Tab label="All" {...a11yProps(0)} />
                    <Tab label="Chat" {...a11yProps(1)} />
                    <Tab label="Actions" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <ul className="message-list">
                {updatedMessages.map((x) => (
                    <Message
                        key={x.id}
                        message={x}
                        isOwnMessage={x.uid === user.uid}
                    />
                ))}
            </ul>
        </div>
    );
}

function Message({ message, isOwnMessage }) {
    const { displayName, text, uid, timestamp } = message;

    let ago = moment(timestamp?.toDate()).fromNow()
    if (ago === 'in a few seconds') ago = 'a few seconds ago';

    return (
        <li className={['message', isOwnMessage && 'own-message'].join(' ')}>
            <div className="message-header">
                <div className="sender">{displayName} <small>#{uid.slice(-3)}</small></div>
                <div className="timestampe">{ago}</div>
            </div>
            <Divider />
            <div style={{whiteSpace: 'pre-wrap'}}><ReactMarkdown children={text} remarkPlugins={[remarkGfm]} /></div>
        </li>
    );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}