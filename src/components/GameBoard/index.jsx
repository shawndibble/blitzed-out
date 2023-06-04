import GameTile from './GameTile';
import './styles.css';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function GameBoard({ playerList, tile }) {
    const gameBoard = useLocalStorage('customBoard')[0];

    if (!Array.isArray(gameBoard)) return null;

    const gameTiles = gameBoard.map((entry, index) => {
        const currentLocation = playerList.find(player => player.isSelf && player.location === index && index !== 0);
        return (
            <GameTile
                key={index}
                id={`tile-${index}`}
                title={`#${index + 1}: ${entry.title}`}
                description={entry.description}
                players={playerList.filter(player => player.location === index)}
                current={currentLocation}
            />
        );
    });

    return (
        <>
            <div className='gameboard'>
                <ol>{gameTiles}</ol>
            </div>
        </>
    );
}