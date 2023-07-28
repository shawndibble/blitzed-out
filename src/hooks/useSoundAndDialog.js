import { useEffect, useState } from 'react';
import useLocalStorage from 'hooks/useLocalStorage';
import diceSound from 'sounds/roll-dice.mp3';
import messageSound from 'sounds/message.mp3';
import moment from 'moment';
import useSound from 'use-sound';
import speak from 'services/textToSpeech';
import { extractAction } from 'helpers/strings';
import useAuth from 'hooks/useAuth';
import useMessages from 'hooks/useMessages';
import { useTranslation } from 'react-i18next';

export default function useSoundAndDialog(room) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const messages = useMessages(room);
  const [popupMessage, setPopupMessage] = useState(false);
  const [playDiceSound] = useSound(diceSound);
  const [playMessageSound] = useSound(messageSound);
  const {
    playerDialog, othersDialog, mySound, otherSound, chatSound, readRoll,
  } = useLocalStorage('gameSettings')[0];

  useEffect(() => {
    moment.locale(i18n.resolvedLanguage);
    const latestMessage = [...messages].pop();

    // prevent dialog from showing on reload/page change.
    const newMessage = moment(latestMessage?.timestamp?.toDate()).diff(moment(), 'seconds') >= -2;
    const showPlayerDialog = playerDialog && latestMessage?.uid === user?.uid;
    const showOthersDialog = othersDialog && latestMessage?.uid !== user?.uid;
    if (newMessage && latestMessage?.type === 'actions' && (showPlayerDialog || showOthersDialog)) {
      setPopupMessage(latestMessage);
    }

    if (newMessage && latestMessage) {
      const myMessage = latestMessage?.uid === user?.uid;
      if (((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions') {
        playDiceSound();
      }

      if (myMessage && readRoll && latestMessage?.type === 'actions') {
        const text = extractAction(latestMessage?.text);
        speak(text, i18n.resolvedLanguage);
      }

      if (chatSound && latestMessage?.type === 'chat') {
        playMessageSound();
      }
    }
    // eslint-disable-next-line
  }, [messages, i18n.resolvedLanguage]);

  return [popupMessage, setPopupMessage];
}
