import { useEffect, useState } from 'react';
import { getUserList } from 'services/firebase';
import useAuth from './useAuth';
import useMessages from './useMessages';

function filteredGameMessages(messages) {
  const filteredMessages = messages.filter((m) => m.type === 'actions');
  return [...new Map(filteredMessages.map((m) => [m.uid, m])).values()];
}

function getCurrentPlayers(onlineUsers, user, messages) {
  const uniqueGameActions = filteredGameMessages(messages);

  return Object.entries(onlineUsers)
    .filter((data) => {
      // The realtime database will have values within the last few seconds,
      // but for those with a bad connection, we will give them a minute.
      const ONE_MINUTE = 60 * 1000;
      const mostRecentEntry = Object.values(data[1]).sort((a, b) => b.lastActive - a.lastActive)[0];
      return new Date() - new Date(Date(mostRecentEntry)) < ONE_MINUTE;
    })
    .map(([onlineUid, data]) => {
      const mostRecentEntry = Object.values(data).sort((a, b) => b.lastActive - a.lastActive)[0];
      const { displayName } = mostRecentEntry;
      console.log(displayName, Date(mostRecentEntry.lastActive));
      const userGameMessage = uniqueGameActions.find((message) => message.uid === onlineUid)?.text;
      const currentLocation = userGameMessage && userGameMessage.match(/(?:#)[\d]*(?=:)/gs)
        ? Number(userGameMessage.match(/(?:#)[\d]*(?=:)/gs)[0].replace('#', ''))
        : 0;
      const location = currentLocation > 0 ? currentLocation - 1 : currentLocation;

      return {
        displayName,
        uid: onlineUid,
        isSelf: onlineUid === user?.uid,
        location,
      };
    });
}

export default function usePlayerList(roomId) {
  const { user } = useAuth();
  const messages = useMessages(roomId);

  const [onlineUsers, setOnlineUsers] = useState({});
  getUserList(roomId, setOnlineUsers, onlineUsers);

  const players = getCurrentPlayers(onlineUsers, user, [...messages]);

  const [playerList, setPlayerList] = useState(players);

  useEffect(() => {
    if (JSON.stringify(playerList) !== JSON.stringify(players)) setPlayerList(players);
    // eslint-disable-next-line
  }, [players]);

  return [playerList, setPlayerList];
}
