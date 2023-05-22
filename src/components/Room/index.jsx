import { Link, useParams } from 'react-router-dom';
import { MessageInput } from '../MessageInput';
import { MessageList } from '../MessageList';
import './styles.css';
import { GameBoard } from '../GameBoard';

function Room() {
    const params = useParams();
    const room = params.id ?? 'public';

    return (
        <>
            <h2>{room === 'public' ? 'Public Room' : `Room code: ${room}`}</h2>
            <div>
                <Link to="/settings">Game Settings</Link>
            </div>
                <GameBoard />
            <div>
                <div className="messages-container">
                    <MessageList roomId={room} />
                    <MessageInput roomId={room} />
                </div>
            </div>
        </>
    );
}

export { Room };