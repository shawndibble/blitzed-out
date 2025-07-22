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

  // Use settings directly with selectedActions structure only
  const initialFormData = {
    ...defaultSettings,
    ...settings,
    // Ensure selectedActions is always defined
    selectedActions: settings?.selectedActions || {},
    ...overrideSettings,
  } as T;

  const [formData, setFormData] = useState<T>(initialFormData);
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

          // For subsequent updates, preserve user action selections in selectedActions
          const hasUserSelections =
            previousFormData.selectedActions &&
            Object.keys(previousFormData.selectedActions).length > 0;

          if (hasUserSelections) {
            // Preserve selectedActions when merging new room settings
            return {
              ...previousFormData,
              ...messageSettings,
              selectedActions: previousFormData.selectedActions, // Keep user's selections
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
