import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSettings } from '@/stores/settingsStore';
import diceSound from '@/sounds/roll-dice.mp3';
import messageSound from '@/sounds/message.mp3';
import dayjs from 'dayjs';
import useSound from 'use-sound';
import speak from '@/services/textToSpeech';
import { extractAction } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/Message';
import { parseMessageTimestamp } from '@/helpers/timestamp';
import { setDayjsLocale } from '@/helpers/momentLocale';
import { setupAudioUnlock } from '@/utils/audioContext';

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

  const {
    playerDialog,
    othersDialog,
    mySound,
    otherSound,
    chatSound,
    readRoll,
    voicePreference,
    voicePitch,
  } = settings || {};

  const latestMessage = useMemo(() => [...messages].pop(), [messages]);

  const speakText = useCallback(
    async (text: string | undefined): Promise<void> => {
      if (text) {
        try {
          // Coerce voicePitch to number and clamp to Web Speech API valid range
          const pitch = typeof voicePitch === 'number' && !isNaN(voicePitch) ? voicePitch : 1.0;
          const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));
          await speak(text, voicePreference, clampedPitch);
        } catch (error) {
          console.error('Failed to speak text:', error);
        }
      }
    },
    [voicePreference, voicePitch]
  );

  const newMessage = useMemo(() => {
    if (!latestMessage?.timestamp) return false;

    const messageDate = parseMessageTimestamp(latestMessage.timestamp);
    if (!messageDate) {
      return false;
    }

    return dayjs(messageDate).diff(dayjs(), 'seconds') >= -2;
  }, [latestMessage]);

  const myMessage = useMemo(() => latestMessage?.uid === user?.uid, [latestMessage, user]);
  const showPlayerDialog = Boolean(playerDialog && myMessage);
  const showOthersDialog = Boolean(othersDialog && !myMessage);
  const playDiceSoundCondition =
    ((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions';
  const speakTextCondition = myMessage && readRoll && latestMessage?.type === 'actions';
  const playMessageSoundCondition = chatSound && latestMessage?.type === 'chat';

  useEffect(() => {
    setupAudioUnlock();
  }, []);

  useEffect(() => {
    setDayjsLocale(i18n.resolvedLanguage || i18n.language);
  }, [i18n.resolvedLanguage, i18n.language]);

  useEffect(() => {
    if (newMessage && latestMessage?.type === 'actions' && (showPlayerDialog || showOthersDialog)) {
      queueMicrotask(() => {
        setPopupMessage(latestMessage);
      });
    }
  }, [newMessage, latestMessage, showPlayerDialog, showOthersDialog]);

  useEffect(() => {
    if (newMessage && latestMessage) {
      if (playDiceSoundCondition) {
        playDiceSound();
      }

      if (speakTextCondition) {
        const text = extractAction(latestMessage?.text);
        speakText(text);
      }

      if (playMessageSoundCondition) {
        playMessageSound();
      }
    }
  }, [
    newMessage,
    latestMessage,
    playDiceSoundCondition,
    speakTextCondition,
    playMessageSoundCondition,
    playDiceSound,
    playMessageSound,
    speakText,
  ]);

  return {
    message: popupMessage,
    setMessage: setPopupMessage,
    isMyMessage: Boolean(myMessage),
  };
}
