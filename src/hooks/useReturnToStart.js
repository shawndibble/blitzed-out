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

  const send = useCallback((): Promise<void> => {
    const message = `${t('restartingGame')}\n#1: ${t('start')}\n${t('action')}: ${t('start')}`;
    
    return sendMessage({
      room,
      user,
      text: message,
      type: 'actions',
    });
  }, [room, user, t]);

  return send;
}
