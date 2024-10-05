import useMessages from '@/context/hooks/useMessages';
import latestMessageByType from '@/helpers/messages';
import { useEffect, useState } from 'react';
import useLocalStorage from './useLocalStorage';

export default function useSettingsToFormData(defaultSettings = {}, overrideSettings = {}) {
  const settings = useLocalStorage('gameSettings')[0];
  // default < localstorage < override.
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...settings,
    ...overrideSettings,
  });
  const { messages } = useMessages();

  // Import our private room settings into the form data.
  useEffect(() => {
    const message = latestMessageByType(messages, 'room');

    if (message?.settings) {
      setFormData((previousFormData) => ({
        ...previousFormData,
        ...JSON.parse(message.settings),
      }));
    }
  }, [messages]);

  return [formData, setFormData];
}
