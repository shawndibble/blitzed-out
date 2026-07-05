import { Card, CardContent } from '@mui/material';
import { ChangeEvent, JSX, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppBoolSwitch from '../AppSettings/AppBoolSwitch';
import BackgroundSelect from '@/components/BackgroundSelect';
import LanguageSelect from '../AppSettings/LanguageSelect';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';
import { Settings } from '@/types/Settings';
import { useSettings } from '@/stores/settingsStore';

function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

interface DisplaySectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  boardUpdated: () => void;
}

/** Personal display preferences: language, roll dialogs, animations, backgrounds. */
export default function DisplaySection({
  formData,
  setFormData,
  boardUpdated,
}: DisplaySectionProps): JSX.Element {
  const { t } = useTranslation();
  const [, updateSettings] = useSettings();
  const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));
  const withOthers = formData.gameMode === 'online';

  const backgrounds: Record<string, string> = {
    useRoomBackground: t('useRoomBackground'),
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    custom: t('customURL'),
  };

  const handleSwitch = useCallback(
    (event: ChangeEvent<HTMLInputElement>, field: string): void => {
      setFormData({ ...formData, [field]: event.target.checked });
      updateSettings({ [field]: event.target.checked });
    },
    [formData, setFormData, updateSettings]
  );

  // Debounced so the live background only updates once the user pauses typing,
  // not on every keystroke.
  const debouncedCustomUrlUpdate = useDebounce((urlKey: string, urlValue: string) => {
    updateSettings({ background: 'custom', [urlKey]: urlValue });
  }, 400);

  const handleBackgroundChange = useCallback(
    (
      backgroundKey: string,
      backgroundValue: string,
      backgroundURLKey?: string,
      backgroundURLValue?: string
    ): void => {
      // Only commit complete, valid URLs; partial values would render as a
      // broken background and spawn request storms while the user types.
      if (backgroundURLKey && typeof backgroundURLValue === 'string' && backgroundURLValue !== '') {
        if (isValidURL(backgroundURLValue)) {
          debouncedCustomUrlUpdate(backgroundURLKey, backgroundURLValue);
        }
        return;
      }

      const updates: Partial<Settings> = { [backgroundKey]: backgroundValue };
      if (backgroundURLKey && backgroundURLValue !== undefined) {
        updates[backgroundURLKey] = backgroundURLValue;
      }
      updateSettings(updates);
    },
    [updateSettings, debouncedCustomUrlUpdate]
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <LanguageSelect boardUpdated={boardUpdated} />
        <AppBoolSwitch field="playerDialog" formData={formData} handleSwitch={handleSwitch} />
        {withOthers && (
          <AppBoolSwitch field="othersDialog" formData={formData} handleSwitch={handleSwitch} />
        )}
        <AppBoolSwitch
          field="showDiceAnimation"
          formData={formData}
          handleSwitch={handleSwitch}
          defaultValue={true}
        />
        <AppBoolSwitch field="hideBoardActions" formData={formData} handleSwitch={handleSwitch} />
        <AppBoolSwitch
          field="wakeLockEnabled"
          formData={formData}
          handleSwitch={handleSwitch}
          defaultValue={true}
        />
        <BackgroundSelect
          formData={formData}
          setFormData={setFormData}
          backgrounds={backgrounds}
          isPrivateRoom={isPrivateRoom}
          onBackgroundChange={handleBackgroundChange}
        />
      </CardContent>
    </Card>
  );
}
