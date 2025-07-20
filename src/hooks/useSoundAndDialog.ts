import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSettings } from '@/stores/settingsStore';
import diceSound from '@/sounds/roll-dice.mp3';
import messageSound from '@/sounds/message.mp3';
import moment from 'moment';
import useSound from 'use-sound';
import speak from '@/services/textToSpeech';
import { extractAction } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/Message';

export interface DialogResult {
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
  const [settings] = useSettings();

  const { playerDialog, othersDialog, mySound, otherSound, chatSound, readRoll } = settings || {};

  const latestMessage = useMemo(() => [...messages].pop(), [messages]);

  const speakText = useCallback((text: string | undefined, language: string): void => {
    if (text) speak(text, language);
  }, []);

  const newMessage = useMemo(() => {
    if (!latestMessage?.timestamp) return false;

    let messageDate: Date;

    try {
      // Handle different timestamp formats
      if (typeof latestMessage.timestamp.toDate === 'function') {
        // Firebase Timestamp format
        messageDate = latestMessage.timestamp.toDate();
      } else if (typeof latestMessage.timestamp === 'string') {
        // Serialized timestamp format
        messageDate = new Date(latestMessage.timestamp);
      } else if (typeof latestMessage.timestamp === 'number') {
        // Unix timestamp (milliseconds or seconds)
        const timestamp = latestMessage.timestamp;
        const timestampMs = timestamp < 32503680000 ? timestamp * 1000 : timestamp;
        messageDate = new Date(timestampMs);
      } else if (typeof latestMessage.timestamp === 'object' && latestMessage.timestamp.seconds) {
        // Firestore Timestamp serialized object format
        const timestampObj = latestMessage.timestamp as { seconds: number; nanoseconds?: number };
        messageDate = new Date(
          timestampObj.seconds * 1000 + (timestampObj.nanoseconds || 0) / 1000000
        );
      } else if (latestMessage.timestamp instanceof Date) {
        // Already a Date object
        messageDate = latestMessage.timestamp;
      } else {
        console.warn(
          'Unsupported timestamp format in useSoundAndDialog:',
          typeof latestMessage.timestamp,
          latestMessage.timestamp
        );
        return false;
      }

      return moment(messageDate).diff(moment(), 'seconds') >= -2;
    } catch (error) {
      console.warn('Failed to parse timestamp in useSoundAndDialog:', error);
      return false;
    }
  }, [latestMessage]);

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
