import React from 'react';
import Linkify from 'react-linkify';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import './styles.css';
import { Link } from '@mui/material';

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
    const { displayName, text } = message;
    return (
        <li className={['message', isOwnMessage && 'own-message'].join(' ')}>
            <h4 className="sender">{displayName}</h4>
            <div><Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                <Link href={decoratedHref} key={key} color="inherit" underline="always" target="_blank" rel="noreferrer">{decoratedText}</Link>
            )}>
                {text}
            </Linkify></div>
        </li>
    );
}