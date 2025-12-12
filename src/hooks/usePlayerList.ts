import { t } from 'i18next';
import { useMemo } from 'react';
import { orderedMessagesByType } from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import { useUserListStore } from '@/stores/userListStore';
import { Message } from '@/types/Message';

interface Player {
  displayName: string;
  uid: string;
  isSelf: boolean;
  location: number;
  isFinished: boolean;
  status: 'active' | 'idle' | 'away';
  lastActivity: Date;
}

function filteredGameMessages(messages: Message[]): Message[] {
  const filteredMessages = orderedMessagesByType(messages, 'actions', 'DESC');
  // Keep first occurrence (newest) for each uid by only adding if not already present
  const uniqueMap = new Map<string, Message>();
  for (const m of filteredMessages) {
    if (!uniqueMap.has(m.uid)) {
      uniqueMap.set(m.uid, m);
    }
  }
  return [...uniqueMap.values()];
}

export default function usePlayerList(): Player[] {
  const { user } = useAuth();
  const { messages, isLoading } = useMessages();
  const { onlineUsers } = useUserListStore();

  const players = useMemo(() => {
    if (isLoading || !user) return [];

    const uniqueGameActions = filteredGameMessages(messages);

    return Object.values(onlineUsers)
      .map((userInfo) => {
        // Extract game location from messages
        const userGameMessage = uniqueGameActions.find(
          (message) => message.uid === userInfo.uid
        )?.text;

        const locationRegEx = /(?:#)[\d]*(?=:)/gs;
        let currentLocation = 0;

        if (userGameMessage && userGameMessage.match(locationRegEx)) {
          const match = userGameMessage.match(locationRegEx);
          if (match && match[0]) {
            currentLocation = Number(match[0].replace('#', ''));
          }
        }

        // Messages show 1-indexed position, convert to 0-indexed for GameBoard
        const location = currentLocation > 0 ? currentLocation - 1 : currentLocation;
        const isFinished = Boolean(userGameMessage?.includes(t('finish')));

        return {
          displayName: userInfo.displayName || 'Unknown',
          uid: userInfo.uid,
          isSelf: userInfo.uid === user.uid,
          location: userInfo.gameState?.location || location,
          isFinished: userInfo.gameState?.isFinished || isFinished,
          status: userInfo.status || 'away',
          lastActivity: userInfo.lastSeen || new Date(0),
        };
      })
      .sort((a, b) => {
        // Sort by: self first, then active status, then by name
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [user, onlineUsers, messages, isLoading]);

  return players;
}
