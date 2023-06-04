import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useMessages from "./useMessages";
import { getUserList } from "../services/firebase";

export default function usePlayerList(roomId) {
    const { user } = useAuth();
    const messages = useMessages(roomId);

    const [onlineUsers, setOnlineUsers] = useState({});

    getUserList(roomId, setOnlineUsers, onlineUsers);

    const uniqueUserMessages = filteredMessages([...messages]);

    const players = Object.entries(onlineUsers).map(([onlineUid, value]) => {
        const displayName = Object.values(value)[0];
        const userGameMessage = uniqueUserMessages.find(message => message.uid === onlineUid)?.text;
        const location = userGameMessage ? Number(userGameMessage.match(/(?<=#)[\d]*(?=:)/gs)) - 1 : 0;

        return {
            displayName,
            uid: onlineUid,
            isSelf: onlineUid === user.uid,
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

function filteredMessages(messages) {
    const filteredMessages = messages.filter(m => m.isGameAction);
    return [...new Map(filteredMessages.map(m => [m['uid'], m])).values()];
}