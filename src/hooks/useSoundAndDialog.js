import {
  useEffect, useState, useMemo, useCallback,
} from 'react';
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
  const { messages } = useMessages(room);
  const [popupMessage, setPopupMessage] = useState(false);
  const [playDiceSound] = useSound(diceSound);
  const [playMessageSound] = useSound(messageSound);
  const {
    playerDialog, othersDialog, mySound, otherSound, chatSound, readRoll,
  } = useLocalStorage('gameSettings')[0];

  const latestMessage = useMemo(() => [...messages].pop(), [messages]);

  const speakText = useCallback((text, language) => {
    speak(text, language);
  }, []);

  const newMessage = moment(latestMessage?.timestamp?.toDate()).diff(moment(), 'seconds') >= -2;
  const myMessage = latestMessage?.uid === user?.uid;
  const showPlayerDialog = playerDialog && myMessage;
  const showOthersDialog = othersDialog && !myMessage;
  const playDiceSoundCondition = ((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions';
  const speakTextCondition = myMessage && readRoll && latestMessage?.type === 'actions';
  const playMessageSoundCondition = chatSound && latestMessage?.type === 'chat';

  useEffect(() => {
    moment.locale(i18n.resolvedLanguage);

    if (newMessage && latestMessage?.type === 'actions' && (showPlayerDialog || showOthersDialog)) {
      setPopupMessage(latestMessage);
    }

    if (newMessage && latestMessage) {
      if (playDiceSoundCondition) {
        playDiceSound();
      }

      if (speakTextCondition) {
        const text = extractAction(latestMessage?.text);
        speakText(text, i18n.resolvedLanguage);
      }

      if (playMessageSoundCondition) {
        playMessageSound();
      }
    }
  }, [
    messages,
    i18n.resolvedLanguage,
    latestMessage,
    myMessage,
    showPlayerDialog,
    showOthersDialog,
    playDiceSoundCondition,
    speakTextCondition,
    playMessageSoundCondition,
  ]);

  return [popupMessage, setPopupMessage];
}
