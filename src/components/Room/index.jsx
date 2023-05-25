import { useParams } from 'react-router-dom';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import GameBoard from '../GameBoard';
import './styles.css';
import Navigation from '../Navigation';

export default function Room() {
    const params = useParams();
    const room = params.id ?? 'public';

    return (
        <>
            <Navigation room={room} />
            <div class="container flex">
                <GameBoard />
            
                <div className="messages-container">
                    <MessageList roomId={room} />
                    <MessageInput roomId={room} />
                </div>
            </div>
        </>
    );
}