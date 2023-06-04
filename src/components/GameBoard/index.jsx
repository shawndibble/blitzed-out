import GameTile from './GameTile';
import './styles.css';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function GameBoard({ playerList, tile }) {
    const gameBoard = useLocalStorage('customBoard')[0];
    
    if (!Array.isArray(gameBoard)) return null;

    return (
        <>
            <div className='gameboard'>
                <ol>
                    {gameBoard?.map((entry, index) => <GameTile
                        key={index}
                        title={`#${index + 1}: ${entry.title}`}
                        description={entry.description}
                        players={playerList.filter(player => player.location === index)}
                    />
                    )}
                </ol>
            </div>
        </>
    );
}