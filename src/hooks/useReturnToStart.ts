import { useTranslation } from 'react-i18next';
import { Params, useParams } from 'react-router-dom';
import { sendMessage } from '@/services/firebase/chat';
import { useCallback } from 'react';
import useAuth from '@/context/hooks/useAuth';
import { TurnFields } from '@/types/Message';

export default function useReturnToStart(): () => Promise<void> {
  const { t } = useTranslation();
  const { id: room } = useParams<Params>();
  const { user } = useAuth();

  const send = useCallback(async (): Promise<void> => {
    if (!user) return;
    const title = t('start');
    const message = `${t('restartingGame')}\n#1: ${title}\n${t('action')}: ${title}`;
    const turn: TurnFields = {
      kind: 'restart',
      roll: null,
      location: 0,
      title,
      description: title,
      finished: false,
    };

    await sendMessage({
      room,
      user,
      text: message,
      type: 'actions',
      turn,
    });
  }, [room, user, t]);

  return send;
}
