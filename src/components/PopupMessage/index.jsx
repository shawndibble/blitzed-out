import { useEffect, useRef } from 'react';
import TransitionModal from 'components/TransitionModal';
import useSoundAndDialog from 'hooks/useSoundAndDialog';

export default function PopupMessage({ room }) {
  const [popupMessage, setPopupMessage] = useSoundAndDialog(room);

  // handle timeout of TransitionModal
  const timeoutId = useRef();

  useEffect(() => {
    if (popupMessage) {
      timeoutId.current = setTimeout(() => setPopupMessage(false), 12000);
    }
    return () => clearTimeout(timeoutId.current);
  }, [popupMessage]);

  const closeTransitionModal = () => {
    clearTimeout(timeoutId.current);
    setPopupMessage(false);
  };

  const stopAutoClose = () => clearTimeout(timeoutId.current);
  // end handle timeout of TransitionModal.

  return (
    popupMessage?.text && (
      <TransitionModal
        text={popupMessage?.text}
        displayName={popupMessage?.displayName}
        setOpen={setPopupMessage}
        open={!!popupMessage || !!popupMessage?.text}
        handleClose={closeTransitionModal}
        stopAutoClose={stopAutoClose}
      />
    )
  );
}
