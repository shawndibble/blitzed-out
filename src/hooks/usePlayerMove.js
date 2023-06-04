import { useEffect, useState } from "react";
import { sendMessage } from "../services/firebase";
import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import usePlayerList from "./usePlayerList";

export default function usePlayerMove(roomId, setModalOpen, rollValue) {
    const { user } = useAuth();
    const [playerList, setPlayerList] = usePlayerList(roomId);
    const gameBoard = useLocalStorage('customBoard')[0];
    const total = gameBoard.length;
    const [tile, setTile] = useState(gameBoard[0]);

    useEffect(() => {
        const rollNumber = rollValue[0];
        if (rollNumber === 0) return;

        const lastTile = total - 1;
        const currentLocation = playerList.find(p => p.isSelf).location;
        let newLocation = rollNumber + currentLocation;
        let preMessage = '';

        // restart game.
        if (currentLocation === lastTile) {
            preMessage = 'You already finished. Starting over.\r\n';
            newLocation = rollNumber;
        }

        // animate to next tile.
        for (let i = 0; i < rollNumber && newLocation < total; i++) {
            animateMovePlayer(i);
        }

        // animate to final tile.
        if (newLocation >= lastTile) {
            newLocation = lastTile;
            const remainingSpaces = lastTile - currentLocation;
            for (let i = 0; i < remainingSpaces; i++) {
                animateMovePlayer(i);
            }
        }

        setTile(gameBoard[newLocation]);
        handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage)
        //eslint-disable-next-line
    }, [rollValue]);

    function animateMovePlayer(i) {
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

    function handleTextOutput(tile, rollNumber, newLocation, preMessage) {
        if (tile?.description !== 'START' && tile?.description !== 'FINISH') {
            setModalOpen(true);
        }

        let message = `Roll: ${rollNumber}\r\n`;
        message += `#${newLocation + 1}: ${tile?.title}\r\n`;
        message += `Action: ${tile?.description}`;
        sendMessage(roomId, user, preMessage + message, true);
    }

    return { tile, playerList };
}