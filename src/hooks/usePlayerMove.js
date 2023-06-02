import { useEffect, useState } from "react";
import { sendMessage } from "../services/firebase";
import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";

export default function usePlayerMove(roomId, setModalOpen, rollValue) {
    const { user } = useAuth();
    const gameBoard = useLocalStorage('customBoard')[0];
    const { displayName } = useLocalStorage('gameSettings')[0];

    const total = gameBoard.length;

    const players = [
        {
            ...user,
            location: 0,
            isSelf: true
        }
    ];
  
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

    function handleTextOutput(tile, rollNumber, newLocation) {
        if (tile?.description !== 'START' && tile?.description !== 'FINISH') {
            setModalOpen(true);
        }
    
        let message = `Tile: #${newLocation + 1}  |  Dice Roll: ${rollNumber} \r\nAction: ${tile?.description}`;
        sendMessage(roomId, user, message);
    }

    useEffect(() => {
        playerList.forEach(p => {if (p.isSelf && displayName) p.displayName = displayName});
        setPlayerList([ ...playerList ]);
    //eslint-disable-next-line
    }, [displayName])

    useEffect(() => {
        const rollNumber = rollValue[0];
        if (rollNumber === 0) return;

        const lastTile = total - 1;

        const currentLocation = playerList.find(p => p.isSelf).location;
        let newLocation = rollNumber + currentLocation;

        // animate to next tile.
        for (let i = 0; i < rollNumber && newLocation < total; i++) {
            movePlayer(i);
        }

        // animate to final tile.
        if (newLocation >= lastTile) {
            newLocation = lastTile;
            const remainingSpaces = lastTile - currentLocation;
            for (let i = 0; i < remainingSpaces; i++) {
                movePlayer(i);
            }
        }

        setTile(gameBoard[newLocation]);
        handleTextOutput(gameBoard[newLocation], rollNumber, newLocation)
        //eslint-disable-next-line
    }, [rollValue]);

    return { tile, playerList };
}