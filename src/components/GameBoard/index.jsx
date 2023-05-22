import { GameTile } from '../GameTile';
import './styles.css';

function GameBoard() {
    const total = 40;
    return (
        <ol>
            {[...Array(total).keys()].map((entry) => <GameTile key={entry} title={`${entry+1} of ${total}`} description={entry} />)}
        </ol>
    );
}

export { GameBoard };