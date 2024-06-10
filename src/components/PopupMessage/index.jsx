import { useCallback, useEffect, useRef } from 'react';
import TransitionModal from 'components/TransitionModal';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useTurnIndicator from 'hooks/useTurnIndicator';
import { useTranslation } from 'react-i18next';
import React from 'react';

const PopupMessage = ({ room }) => {
  const { t } = useTranslation();
  const { message, setMessage, isMyMessage } = useSoundAndDialog(room);
  const nextPlayer = useTurnIndicator(room, message);

  // handle timeout of TransitionModal
  const timeoutId = useRef();

  useEffect(() => {
    if (message) {
      timeoutId.current = setTimeout(() => setMessage(false), 21000);
    }
    return () => clearTimeout(timeoutId.current);
  }, [message]);

  const closeTransitionModal = useCallback(() => {
    clearTimeout(timeoutId.current);
    setMessage(false);
  }, []);

  const stopAutoClose = useCallback(() => clearTimeout(timeoutId.current), []);
  // end handle timeout of TransitionModal.

  if (!message.text || message.text.includes(t('start'))) {
    return null;
  }

  return (
    <TransitionModal
      text={message?.text}
      displayName={message?.displayName}
      setOpen={setMessage}
      open={!!message || !!message?.text}
      handleClose={closeTransitionModal}
      stopAutoClose={stopAutoClose}
      nextPlayer={nextPlayer}
      isMyMessage={isMyMessage}
    />
  );
};

export default PopupMessage;
