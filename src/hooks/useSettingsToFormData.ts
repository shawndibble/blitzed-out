import useMessages from '@/context/hooks/useMessages';
import latestMessageByType from '@/helpers/messages';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useSettings } from '@/stores/settingsStore';
import { RoomMessage } from '@/types/Message';
import { Settings } from '@/types/Settings';

export default function useSettingsToFormData<T extends Settings>(
  defaultSettings: T = {} as T,
  overrideSettings: Partial<T> = {}
): [T, Dispatch<SetStateAction<T>>] {
  const [settings] = useSettings();
  // default < localstorage < override.
  const [formData, setFormData] = useState<T>({
    ...defaultSettings,
    ...(settings || {}),
    ...overrideSettings,
  } as T);
  const { messages } = useMessages();
  const [isInitialized, setIsInitialized] = useState(false);

  // Import our private room settings into the form data.
  useEffect(() => {
    const message = latestMessageByType(messages, 'room') as RoomMessage | undefined;

    if (message?.settings) {
      try {
        const messageSettings = JSON.parse(message.settings);

        setFormData((previousFormData) => {
          // Only apply message settings on initial load or if no user modifications exist
          if (!isInitialized) {
            setIsInitialized(true);
            return {
              ...previousFormData,
              ...messageSettings,
            };
          }

          // For subsequent updates, only merge settings that don't conflict with user selections
          // Preserve any action/consumption selections that have been made
          const hasUserSelections = Object.keys(previousFormData).some((key) => {
            const entry = previousFormData[key] as any;
            return entry?.type && ['solo', 'foreplay', 'sex', 'consumption'].includes(entry.type);
          });

          if (hasUserSelections) {
            // Merge non-action settings but preserve user action selections
            const nonActionSettings = Object.keys(messageSettings).reduce((acc, key) => {
              const entry = messageSettings[key];
              if (
                !entry?.type ||
                !['solo', 'foreplay', 'sex', 'consumption'].includes(entry.type)
              ) {
                acc[key] = entry;
              }
              return acc;
            }, {} as any);

            return {
              ...previousFormData,
              ...nonActionSettings,
            };
          }

          return {
            ...previousFormData,
            ...messageSettings,
          };
        });
      } catch (error) {
        console.error('Error parsing message settings:', error);
      }
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [messages, isInitialized]);

  return [formData, setFormData];
}
