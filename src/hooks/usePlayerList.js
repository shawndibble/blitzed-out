import { useEffect, useMemo, useState } from 'react';
import { getUserList } from 'services/firebase';
import useAuth from './useAuth';
import useMessages from './useMessages';

function filteredGameMessages(messages) {
  const filteredMessages = messages.filter((m) => m.type === 'actions');
  return [...new Map(filteredMessages.map((m) => [m.uid, m])).values()];
}

// see if the realtime db connection is recent.
function isRecentlyConnected(userObj) {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const mostRecentEntry = Object.values(userObj).sort((a, b) => b.lastActive - a.lastActive)[0];
  return (Date.now() - mostRecentEntry.lastActive) < FIVE_MINUTES;
}

// Check if the user sent a message recently.
function isRecentlyActive(messages, onlineUid) {
  const TEN_MINUTES = 10 * 60 * 1000;
  const lastActivity = messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .find((m) => m.uid === onlineUid)?.timestamp.toMillis();
  return (Date.now() - lastActivity) < TEN_MINUTES;
}

function getCurrentPlayers(onlineUsers, user, messages) {
  const uniqueGameActions = filteredGameMessages(messages);

  return Object.entries(onlineUsers)
    .filter(([onlineUid, data]) => {
      // realtime database will remove users when they close their browser,
      // but we need to handle inactive users and those with connection problems.
      // For those who have been left behind:
      // * Check if the user recently connected in the last 5 minutes, but haven't sent a message
      // * Check if the user has done anything in the last 10 minutes.
      // * Check if the user is himself (should always list)
      const isSelf = onlineUid === user?.uid;
      return isRecentlyConnected(data) || isRecentlyActive(messages, onlineUid) || isSelf;
    })
    .map(([onlineUid, data]) => {
      const mostRecentEntry = Object.values(data).sort((a, b) => b.lastActive - a.lastActive)[0];
      const { displayName } = mostRecentEntry;
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

  const players = useMemo(
    () => getCurrentPlayers(onlineUsers, user, [...messages]),
    [onlineUsers, user, messages],
  );

  const [playerList, setPlayerList] = useState(players);

  useEffect(() => {
    if (JSON.stringify(playerList) !== JSON.stringify(players)) setPlayerList(players);
    // eslint-disable-next-line
  }, [players]);

  return [playerList, setPlayerList];
}
