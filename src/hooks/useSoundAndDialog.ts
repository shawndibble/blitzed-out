import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSoundAndDialogSettings } from '@/stores/gameSettings';
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
  const { mySound, otherSound, chatSound, readRoll, playerDialog, othersDialog } = useSoundAndDialogSettings();
  
  // Track processed messages to avoid duplicate text-to-speech
  const processedMessagesRef = useRef<Set<string>>(new Set());

  const latestMessage = useMemo(() => [...messages].pop(), [messages]);

  const speakText = useCallback((text: string | undefined, language: string): void => {
    if (text) speak(text, language);
  }, []);

  const myMessage = useMemo(() => latestMessage?.uid === user?.uid, [latestMessage, user]);
  const showPlayerDialog = Boolean(playerDialog && myMessage);
  const showOthersDialog = Boolean(othersDialog && !myMessage);
  const playDiceSoundCondition =
    ((myMessage && mySound) || (!myMessage && otherSound)) && latestMessage?.type === 'actions';
  const speakTextCondition = myMessage && readRoll && latestMessage?.type === 'actions';
  const playMessageSoundCondition = chatSound && latestMessage?.type === 'chat';

  useEffect(() => {
    moment.locale(i18n.resolvedLanguage);

    if (latestMessage?.type === 'actions' && (showPlayerDialog || showOthersDialog)) {
      setPopupMessage(latestMessage);
    }

    if (latestMessage) {
      // Create a unique ID for this message
      const messageId = `${latestMessage.id || latestMessage.timestamp?.toDate().getTime()}_${latestMessage.uid}`;
      
      // Check if we've already processed this message
      const alreadyProcessed = processedMessagesRef.current.has(messageId);
      
      if (!alreadyProcessed) {
        // Mark this message as processed
        processedMessagesRef.current.add(messageId);
        
        // Clean up old message IDs to prevent memory leaks (keep only last 100)
        if (processedMessagesRef.current.size > 100) {
          const messageIds = Array.from(processedMessagesRef.current);
          const toDelete = messageIds.slice(0, messageIds.length - 100);
          toDelete.forEach(id => processedMessagesRef.current.delete(id));
        }
        
        // Only process if it's a recent message (within 10 seconds)
        const isRecentMessage = moment(latestMessage.timestamp?.toDate()).diff(moment(), 'seconds') >= -10;
        
        if (isRecentMessage) {
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
  ]);

  return {
    message: popupMessage,
    setMessage: setPopupMessage,
    isMyMessage: Boolean(myMessage),
  };
}
