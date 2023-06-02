import React from 'react';
import Linkify from 'react-linkify';
import useAuth from '../../hooks/useAuth';
import useMessages from '../../hooks/useMessages';
import './styles.css';
import { Divider, Link } from '@mui/material';
import moment from 'moment/moment';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageList({ roomId }) {
    const containerRef = React.useRef(null);
    const { user } = useAuth();
    const messages = useMessages(roomId);

    React.useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    });

    return (
        <div className="message-list-container" ref={containerRef}>
            <ul className="message-list">
                {messages.map((x) => (
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