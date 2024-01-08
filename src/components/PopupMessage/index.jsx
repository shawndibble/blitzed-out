import {
  memo, useCallback, useEffect, useRef,
} from 'react';
import TransitionModal from 'components/TransitionModal';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useTurnIndicator from 'hooks/useTurnIndicator';

const PopupMessage = memo(({ room }) => {
  const [message, setMessage] = useSoundAndDialog(room);
  const nextPlayer = useTurnIndicator(room, message);

  // handle timeout of TransitionModal
  const timeoutId = useRef();

  useEffect(() => {
    if (message) {
      timeoutId.current = setTimeout(() => setMessage(false), 12000);
    }
    return () => clearTimeout(timeoutId.current);
  }, [message]);

  const closeTransitionModal = useCallback(() => {
    clearTimeout(timeoutId.current);
    setMessage(false);
  }, []);

  const stopAutoClose = useCallback(() => clearTimeout(timeoutId.current), []);
  // end handle timeout of TransitionModal.

  return (
    message?.text && (
      <TransitionModal
        text={message?.text}
        displayName={message?.displayName}
        setOpen={setMessage}
        open={!!message || !!message?.text}
        handleClose={closeTransitionModal}
        stopAutoClose={stopAutoClose}
        nextPlayer={nextPlayer}
      />
    )
  );
});

export default PopupMessage;
