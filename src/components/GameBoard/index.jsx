import { useEffect, useState } from 'react';
import GameTile from '../GameTile';
import './styles.css';
import useAuth from '../../hooks/useAuth';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function GameBoard({ roll }) {
    const { user } = useAuth();
    const total = 40 ;
    const gameBoard = useLocalStorage('gameStorage', 'customBoard')[0];

    const players = [
        {
            ...user,
            location: 0,
            isSelf: true
        }
    ];

    const [playerList, setPlayerList] = useState(players);

    function movePlayer(i) {
        setTimeout(() => {
            playerList.forEach(p => {
                if(p.isSelf) {
                    if (total >= p.location) return p.location++ 
                    p.location = total - 1;
                }
            });
            setPlayerList([...playerList]);
        }, i * 250);
    }

    useEffect(() => {
        const rollNumber = roll[0];
        console.log('roll', rollNumber);
        const currentLocation = playerList.find(p => p.isSelf).location;
 
        for(let i = 0; i < rollNumber && rollNumber + currentLocation < total ; i++) {
            movePlayer(i);
        }

        if (rollNumber + currentLocation >= total) {
            const remainingSpaces = total - 1 - currentLocation;
            for (let i = 0; i < remainingSpaces; i++) {
                movePlayer(i);
            }
        }
    //eslint-disable-next-line
    }, [roll]);


    return (
        <div className='gameboard'>
            <ol>
                {gameBoard?.map((entry, index) => <GameTile
                        key={`${index}+${total}`}
                        title={`#${index+1}: ${entry.title}`}
                        description={entry.description}
                        players={playerList.filter(player => player.location === index)}
                    />
                )}
            </ol>
        </div>
    );
}