import { t } from 'i18next';
import { useMemo, useCallback } from 'react';
import { orderedMessagesByType } from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import useUserList from '@/context/hooks/useUserList';

interface Message {
  uid: string;
  text?: string;
  timestamp: {
    toMillis: () => number;
  };
  [key: string]: any;
}

interface UserEntry {
  lastActive: number;
  displayName: string;
  [key: string]: any;
}

interface UserData {
  [key: string]: UserEntry;
}

interface OnlineUsers {
  [uid: string]: UserData;
}

interface Player {
  displayName: string;
  uid: string;
  isSelf: boolean;
  location: number;
  isFinished: boolean;
}

interface User {
  uid: string;
  [key: string]: any;
}

function filteredGameMessages(messages: Message[]): Message[] {
  const filteredMessages = orderedMessagesByType(messages, 'actions', 'DESC');
  return [...new Map(filteredMessages.map((m) => [m.uid, m])).values()];
}

// see if the realtime db connection is recent.
function isRecentlyConnected(userObj: UserData): boolean {
  const FIVE_MINUTES = 5 * 60 * 1000;
  if (!userObj || Object.keys(userObj).length === 0) return false;
  
  const entries = Object.values(userObj);
  if (entries.length === 0) return false;
  
  const mostRecentEntry = entries.sort((a, b) => b.lastActive - a.lastActive)[0];
  return mostRecentEntry && Date.now() - mostRecentEntry.lastActive < FIVE_MINUTES;
}

// Check if the user sent a message recently.
function isRecentlyActive(messages: Message[], onlineUid: string): boolean {
  if (!messages || messages.length === 0 || !onlineUid) return false;
  
  const TEN_MINUTES = 10 * 60 * 1000;
  const lastActivity = messages
    .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
    .find((m) => m.uid === onlineUid)
    ?.timestamp.toMillis();
  return lastActivity ? Date.now() - lastActivity < TEN_MINUTES : false;
}

export default function usePlayerList(room?: string): Player[] {
  const { user } = useAuth();
  const { messages, isLoading } = useMessages(room);
  const { onlineUsers } = useUserList();

  const getCurrentPlayers = useCallback((
    onlineUsers: OnlineUsers | null, 
    user: User | null, 
    messages: Message[], 
    isLoading: boolean
  ): Player[] => {
    if (isLoading || !onlineUsers || !user) return [];
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
        if (!data || Object.keys(data).length === 0) {
          return {
            displayName: 'Unknown',
            uid: onlineUid,
            isSelf: onlineUid === user?.uid,
            location: 0,
            isFinished: false
          };
        }
        
        const entries = Object.values(data);
        const mostRecentEntry = entries.length > 0 
          ? entries.sort((a, b) => b.lastActive - a.lastActive)[0]
          : { displayName: 'Unknown' };
          
        const { displayName = 'Unknown' } = mostRecentEntry;

        const userGameMessage = uniqueGameActions.find((message) => message.uid === onlineUid)?.text;
        const locationRegEx = /(?:#)[\d]*(?=:)/gs;
        let currentLocation = 0;
        
        if (userGameMessage && userGameMessage.match(locationRegEx)) {
          const match = userGameMessage.match(locationRegEx);
          if (match && match[0]) {
            currentLocation = Number(match[0].replace('#', ''));
          }
        }
        
        const location = currentLocation > 0 ? currentLocation - 1 : currentLocation;
        const isFinished = Boolean(userGameMessage?.includes(t('finish')));

        return {
          displayName,
          uid: onlineUid,
          isSelf: onlineUid === user?.uid,
          location,
          isFinished, // only the last tile has multiple percent values
        };
      });
  }, []);

  const players = useMemo(
    () => getCurrentPlayers(onlineUsers, user, [...messages], isLoading),
    [getCurrentPlayers, onlineUsers, user, messages, isLoading]
  );

  return players;
}
