import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from '@mui/material';
import { ChangeEvent, JSX, KeyboardEvent, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import { SCOPE_COLORS } from '../components/scopeColors';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';
import { languages } from '@/services/i18nHelpers';
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
  const { t, i18n } = useTranslation();
  const [, updateSettings] = useSettings();
  const [language, setLanguage] = useState<string>(i18n.resolvedLanguage || 'en');
  const [languageLoading, setLanguageLoading] = useState(false);
  const [roomBackgroundDraft, setRoomBackgroundDraft] = useState(formData.roomBackgroundURL || '');

  const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));
  const withOthers = formData.gameMode === 'online';
  const background = formData.background || 'color';

  const backgroundOptions: Record<string, string> = {};
  if (isPrivateRoom) backgroundOptions.useRoomBackground = t('useRoomBackground');
  backgroundOptions.color = t('color');
  backgroundOptions.gray = t('gray');
  backgroundOptions['metronome.gif'] = t('hypnoDick');
  backgroundOptions['pink-spiral.gif'] = t('pinkSpiral');
  backgroundOptions.custom = t('customURL');

  const boolSwitch = (field: string, defaultValue = false): JSX.Element => (
    <Switch
      checked={(formData[field] as boolean | undefined) ?? defaultValue}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: event.target.checked });
        updateSettings({ [field]: event.target.checked });
      }}
      slotProps={{ input: { 'aria-label': t(field) } }}
    />
  );

  const changeLanguage = async (value: string): Promise<void> => {
    setLanguageLoading(true);
    setLanguage(value);
    try {
      // Language change automatically triggers content re-seeding
      // (contentReadiness languageChanged listener), then the board rebuilds.
      await i18n.changeLanguage(value);
      boardUpdated();
    } catch {
      await i18n.changeLanguage(value);
      boardUpdated();
    } finally {
      setLanguageLoading(false);
    }
  };

  const handleBackgroundSelect = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    setFormData({ ...formData, background: value });
    if (value !== 'custom') updateSettings({ background: value });
  };

  // Only commit complete, valid URLs; partial values would render as a broken
  // background and spawn request storms while the user types.
  const debouncedCustomUrlUpdate = useDebounce((urlValue: string) => {
    updateSettings({ background: 'custom', backgroundURL: urlValue });
  }, 400);

  const handleCustomUrlChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const url = event.target.value;
    setFormData({ ...formData, background: 'custom', backgroundURL: url });
    if (url && isValidURL(url)) debouncedCustomUrlUpdate(url);
  };

  // Shared with the whole room (room scope), co-located here so both
  // backgrounds are decided in one place.
  const commitRoomBackgroundURL = (value: string): void => {
    const url = value.trim();
    if (url === '' || isValidURL(url)) {
      setFormData({ ...formData, roomBackgroundURL: url, roomUpdated: true });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SettingGroup>
        <SettingRow label={t('language')} description={t('languageCaption')}>
          <Select
            size="small"
            value={language}
            disabled={languageLoading}
            onChange={(event: SelectChangeEvent<string>) => changeLanguage(event.target.value)}
            aria-label={t('language')}
            endAdornment={languageLoading && <CircularProgress size={16} sx={{ mr: 2 }} />}
          >
            {Object.entries(languages).map(([key, obj]) => (
              <MenuItem value={key} key={key}>
                {(obj as { label: string }).label}
              </MenuItem>
            ))}
          </Select>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <SettingRow label={t('playerDialog')} description={t('playerDialogCaption')}>
          {boolSwitch('playerDialog')}
        </SettingRow>
        {withOthers && (
          <SettingRow label={t('othersDialog')}>{boolSwitch('othersDialog')}</SettingRow>
        )}
        <SettingRow label={t('showDiceAnimation')}>
          {boolSwitch('showDiceAnimation', true)}
        </SettingRow>
        <SettingRow label={t('hideBoardActions')} description={t('hideBoardActionsCaption')}>
          {boolSwitch('hideBoardActions')}
        </SettingRow>
        <SettingRow label={t('wakeLockEnabled')}>{boolSwitch('wakeLockEnabled', true)}</SettingRow>
      </SettingGroup>

      <SettingGroup>
        <SettingRow
          label={t('background')}
          description={
            background === 'useRoomBackground' ? t('backgroundUsesRoom') : t('backgroundCaption')
          }
        >
          <Select
            size="small"
            value={backgroundOptions[background] ? background : 'color'}
            onChange={handleBackgroundSelect}
            aria-label={t('background')}
          >
            {Object.entries(backgroundOptions).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </SettingRow>
        {background === 'custom' && (
          <SettingRow label={t('url')}>
            <TextField
              size="small"
              value={formData.backgroundURL || ''}
              onChange={handleCustomUrlChange}
              placeholder="https://example.com/background.gif"
              sx={{ width: { xs: '100%', sm: 280 } }}
              slotProps={{ htmlInput: { 'aria-label': t('url') } }}
            />
          </SettingRow>
        )}
        {isPrivateRoom && (
          <SettingRow
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                {t('roomBackground')}
                <Chip
                  label={t('scopeRoom')}
                  size="small"
                  sx={{
                    color: SCOPE_COLORS.room,
                    bgcolor: `${SCOPE_COLORS.room}20`,
                    fontSize: '0.6rem',
                    height: 18,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                />
              </Box>
            }
            description={t('roomBackgroundCaption')}
          >
            <TextField
              size="small"
              value={roomBackgroundDraft}
              placeholder="https://i.imgur.com/example.gif"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setRoomBackgroundDraft(event.target.value)
              }
              onBlur={() => commitRoomBackgroundURL(roomBackgroundDraft)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRoomBackgroundURL(roomBackgroundDraft);
                }
              }}
              sx={{ width: { xs: '100%', sm: 260 } }}
              slotProps={{ htmlInput: { 'aria-label': t('roomBackground') } }}
            />
          </SettingRow>
        )}
      </SettingGroup>
    </Box>
  );
}
