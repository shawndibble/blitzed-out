import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { sendMessage } from '@/services/firebase';
import { useCallback } from 'react';
import useAuth from '@/context/hooks/useAuth';

interface RouteParams {
  id: string;
}

export default function useReturnToStart(): () => Promise<void> {
  const { t } = useTranslation();
  const { id: room } = useParams<RouteParams>();
  const { user } = useAuth();

  let message = `${t('restartingGame')}\n`;
  message += `#1: ${t('start')}\n`;
  message += `${t('action')}: ${t('start')}`;
  
  const send = (): Promise<void> =>
    sendMessage({
      room,
      user,
      text: message,
      type: 'actions',
    });

  return useCallback(() => send(), [room, user, t]);
}
