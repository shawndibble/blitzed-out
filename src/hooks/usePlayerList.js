import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useMessages from "./useMessages";
import { getUserList } from "../services/firebase";

export default function usePlayerList(roomId) {
    const { user } = useAuth();
    const messages = useMessages(roomId);

    const [onlineUsers, setOnlineUsers] = useState({});

    getUserList(roomId, setOnlineUsers, onlineUsers);

    const uniqueGameActions = filteredGameMessages([...messages]);

    const players = Object.entries(onlineUsers).map(([onlineUid, value]) => {
        const displayName = Object.values(value)[0];
        const userGameMessage = uniqueGameActions.find(message => message.uid === onlineUid)?.text;
        const currentLocation = userGameMessage ? Number(userGameMessage.match(/(?:#)[\d]*(?=:)/gs)[0].replace("#", '')) : 0;
        const location =  currentLocation > 0 ? currentLocation - 1 : currentLocation;

        return {
            displayName,
            uid: onlineUid,
            isSelf: onlineUid === user?.uid,
            location
        };
    });

    const [playerList, setPlayerList] = useState(players);

    useEffect(() => {
        if ( JSON.stringify(playerList) !== JSON.stringify(players)) setPlayerList(players);
    // eslint-disable-next-line
    }, [players]);

    return [playerList, setPlayerList];
}

function filteredGameMessages(messages) {
    const filteredMessages = messages.filter(m => m.isGameAction);
    return [...new Map(filteredMessages.map(m => [m['uid'], m])).values()];
}