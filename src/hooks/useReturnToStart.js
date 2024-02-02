import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { sendMessage } from 'services/firebase';
import { useCallback } from 'react';
import useAuth from 'context/hooks/useAuth';

export default function useReturnToStart() {
  const { t } = useTranslation();
  const { id: room } = useParams();
  const { user } = useAuth();

  let message = `${t('restartingGame')}\n`;
  message += `#1: ${t('start')}\n`;
  message += `${t('action')}: ${t('start')}`;
  const send = () =>
    sendMessage({
      room,
      user,
      text: message,
      type: 'actions',
    });

  return useCallback(() => send(), []);
}
