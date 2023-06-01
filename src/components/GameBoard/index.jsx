import { useEffect, useState } from 'react';
import GameTile from './GameTile';
import './styles.css';
import useAuth from '../../hooks/useAuth';
import useLocalStorage from '../../hooks/useLocalStorage';
import Modal from '../Modal';
import { sendMessage } from '../../services/firebase';

export default function GameBoard({ roll, roomId }) {
    const { user } = useAuth();
    const total = 40;
    const gameBoard = useLocalStorage('customBoard')[0];
    const { displayName } = useLocalStorage('gameSettings')[0];

    const players = [
        {
            ...user,
            location: 0,
            isSelf: true
        }
    ];

    const [isModalOpen, setModalOpen] = useState(false);
    const [playerList, setPlayerList] = useState(players);
    const [tile, setTile] = useState(gameBoard[0]);

    function movePlayer(i) {
        setTimeout(() => {
            playerList.forEach(p => {
                if (p.isSelf) {
                    if (total >= p.location) return p.location++
                    p.location = total - 1;
                }
            });
            setPlayerList([...playerList]);
        }, i * 250);
    }

    useEffect(() => {
        playerList.forEach(p => {if (p.isSelf && displayName) p.displayName = displayName});
        setPlayerList([ ...playerList ]);
    //eslint-disable-next-line
    }, [displayName])

    useEffect(() => {
        const rollNumber = roll[0];
        if (rollNumber === 0) return;

        const currentLocation = playerList.find(p => p.isSelf).location;
        let newLocation = rollNumber + currentLocation;

        for (let i = 0; i < rollNumber && newLocation < total; i++) {
            movePlayer(i);
        }

        if (newLocation >= total) {
            newLocation = total;
            const remainingSpaces = total - 1 - currentLocation;
            for (let i = 0; i < remainingSpaces; i++) {
                movePlayer(i);
            }
        }

        setTile(gameBoard[newLocation]);
        let tlock = gameBoard[newLocation]; // b/c setTile takes a second.
        if (tlock.description !== 'START' && tlock.description !== 'FINISH') {
            setModalOpen(true);
        }

        let message = `Tile: #${newLocation + 1} \r\n Roll: ${rollNumber} \r\n Action: ${tlock.description}`;
        sendMessage(roomId, user, message);
        //eslint-disable-next-line
    }, [roll]);


    return (
        <>
            <div className='gameboard'>
                <ol>
                    {gameBoard?.map((entry, index) => <GameTile
                        key={`${index}+${total}`}
                        title={`#${index + 1}: ${entry.title}`}
                        description={entry.description}
                        players={playerList.filter(player => player.location === index)}
                    />
                    )}
                </ol>
            </div>
            <Modal
                title={tile.title}
                description={tile.description}
                setOpen={setModalOpen}
                open={isModalOpen}
            />
        </>
    );
}