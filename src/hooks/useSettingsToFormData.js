import useMessages from '@/context/hooks/useMessages';
import latestMessageByType from '@/helpers/messages';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import useLocalStorage from './useLocalStorage';

interface Message {
  settings?: string;
  [key: string]: any;
}

interface FormData {
  [key: string]: any;
}

export default function useSettingsToFormData<T extends FormData>(
  defaultSettings: T = {} as T, 
  overrideSettings: Partial<T> = {}
): [T, Dispatch<SetStateAction<T>>] {
  const [settings] = useLocalStorage<T>('gameSettings');
  // default < localstorage < override.
  const [formData, setFormData] = useState<T>({
    ...defaultSettings,
    ...(settings || {} as T),
    ...overrideSettings,
  } as T);
  const { messages } = useMessages();

  // Import our private room settings into the form data.
  useEffect(() => {
    const message = latestMessageByType(messages, 'room') as Message | undefined;

    if (message?.settings) {
      try {
        setFormData((previousFormData) => ({
          ...previousFormData,
          ...JSON.parse(message.settings),
        }));
      } catch (error) {
        console.error('Error parsing message settings:', error);
      }
    }
  }, [messages]);

  return [formData, setFormData];
}
