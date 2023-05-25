import GameTile from '../GameTile';
import './styles.css';

export default function GameBoard() {
    const total = 40 ;
    const gameTiles = [...Array(total).keys()];

    return (
        <div className='gameboard'>
            <ol>
                {gameTiles.map((entry, index) => <GameTile key={entry} title={`${index+1} of ${total}`} description={entry} />)}
            </ol>
        </div>
    );
}