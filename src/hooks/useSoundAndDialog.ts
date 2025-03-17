import { useEffect, useState, useMemo, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import diceSound from '@/sounds/roll-dice.mp3';
import messageSound from '@/sounds/message.mp3';
import moment from 'moment';
import useSound from 'use-sound';
import speak from '@/services/textToSpeech';
import { extractAction } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface Message {
  uid: string;
  type: string;
  text?: string;
  timestamp: {
    toDate: () => Date;
  };
  [key: string]: any;
}

interface Settings {
  playerDialog?: boolean;
  othersDialog?: boolean;
  mySound?: boolean;
  otherSound?: boolean;
  chatSound?: boolean;
  readRoll?: boolean;
  [key: string]: any;
}

interface DialogResult {
  message: Message | false;
  setMessage: React.Dispatch<React.SetStateAction<Message | false>>;
  isMyMessage: boolean;
}

export default function useSoundAndDialog(): DialogResult {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { messages } = useMessages();
  const [popupMessage, setPopupMessage] = useState<Message | false>(false);
  const [playDiceSound] = useSound(diceSound);
  const [playMessageSound] = useSound(messageSound);
  const [settings] = useLocalStorage<Settings>('gameSettings');

  const { playerDialog, othersDialog, mySound, otherSound, chatSound, readRoll } = settings || {};

  const latestMessage = useMemo(() => [...messages].pop(), [messages]);

  const speakText = useCallback((text: string | undefined, language: string): void => {
    if (text) speak(text, language);
  }, []);

  const newMessage = useMemo(
    () =>
      latestMessage
        ? moment(latestMessage.timestamp?.toDate()).diff(moment(), 'seconds') >= -2
        : false,
    [latestMessage]
  );

  const myMessage = useMemo(() => latestMessage?.uid === user?.uid, [latestMessage, user]);
  const showPlayerDialog = Boolean(playerDialog && myMessage);
  const showOthersDialog = Boolean(othersDialog && !myMessage);
  const playDiceSoundCondition =
    ((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions';
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
        speakText(text, i18n.resolvedLanguage || 'en');
      }

      if (playMessageSoundCondition) {
        playMessageSound();
      }
    }
  }, [
    i18n.resolvedLanguage,
    latestMessage,
    myMessage,
    showPlayerDialog,
    showOthersDialog,
    playDiceSoundCondition,
    speakTextCondition,
    playMessageSoundCondition,
    playDiceSound,
    playMessageSound,
    speakText,
    newMessage,
  ]);

  return {
    message: popupMessage,
    setMessage: setPopupMessage,
    isMyMessage: Boolean(myMessage),
  };
}
