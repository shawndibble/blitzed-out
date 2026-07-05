import './styles.css';

import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { FocusEvent, FormEvent, JSX, KeyboardEvent, ReactNode, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import ActionsSection from './sections/ActionsSection';
import CustomTileDialog from '@/views/CustomTileDialog';
import DisplaySection from './sections/DisplaySection';
import GenderSelector from '@/components/GenderSelector';
import JumpNav, { JumpNavEntry } from './components/JumpNav';
import ModeBar from './components/ModeBar';
import RoomSection from './sections/RoomSection';
import SettingsSection from './components/SettingsSection';
import SizePaceSection from './sections/SizePaceSection';
import SoundSection from './sections/SoundSection';
import ToastAlert from '@/components/ToastAlert';
import type { PlayerGender } from '@/types/localPlayers';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import { useSettings } from '@/stores/settingsStore';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import validateFormData from './validateForm';

const SECTIONS: JumpNavEntry[] = [
  { id: 'section-room', labelKey: 'sectionRoomPlayers', scope: 'room' },
  { id: 'section-actions', labelKey: 'sectionActions', scope: 'board' },
  { id: 'section-size-pace', labelKey: 'sectionSizePace', scope: 'board' },
  { id: 'section-sound', labelKey: 'sectionSoundVoice', scope: 'me' },
  { id: 'section-display', labelKey: 'sectionDisplayLanguage', scope: 'me' },
];

interface GameSettingsProps {
  closeDialog?: () => void;
  onOpenSetupWizard?: () => void;
  /** Fires after a successful settings submit; lets the wizard mark the funnel
   * complete so finishing via Advanced Setup isn't logged as an abandonment. */
  onCompleted?: (groupCount: number) => void;
}

/**
 * Advanced settings: one scrollable page, all settings, grouped by scope
 * (Room — everyone / Game board / Only me). A global play-style mode bar
 * filters every section; a jump-rail (desktop) or chip row (mobile) navigates
 * within the single page. Mobile sections collapse so the catalog stays short.
 */
export default function GameSettings({
  closeDialog,
  onOpenSetupWizard,
  onCompleted,
}: GameSettingsProps): JSX.Element {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useBreakpoint();

  const [settings, updateSettings] = useSettings();
  const [alert, setAlert] = useState<string | null>(null);
  const [openCustomTile, setOpenCustomTile] = useState<boolean>(false);
  const [formData, setFormData] = useSettingsToFormData();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-actions': true,
  });

  const { submit: submitSettings } = useSubmitGameSettings();
  const { isLoading, actionsList } = useUnifiedActionList(formData?.gameMode, true);
  const { hasLocalPlayers } = useLocalPlayers();

  const boardUpdated = (): void => updateSettings({ ...settings, boardUpdated: true });

  const enabledActionCount = Object.keys(formData.selectedActions || {}).length;

  const handleExpandedChange = useCallback((id: string, expanded: boolean): void => {
    setExpandedSections((previous) => ({ ...previous, [id]: expanded }));
  }, []);

  const handleNavigate = useCallback((id: string): void => {
    setExpandedSections((previous) => ({ ...previous, [id]: true }));
    // Let the accordion expand before measuring the scroll target.
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<null> => {
      event.preventDefault();
      const { displayName, ...gameOptions } = formData;
      void displayName; // Intentionally excluded from validation

      const validationMessage = validateFormData(gameOptions, actionsList);
      if (validationMessage) {
        setAlert(t(validationMessage));
        return null;
      }

      await submitSettings(formData, actionsList);
      onCompleted?.(Object.keys(gameOptions.selectedActions || {}).length);

      if (typeof closeDialog === 'function') {
        closeDialog();
      }
      return null;
    },
    [formData, actionsList, t, setAlert, submitSettings, closeDialog, onCompleted]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setFormData((prevFormData) => ({ ...prevFormData, displayName: event.target.value }));
    },
    [setFormData]
  );

  const onEnterKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        setFormData((prevFormData) => ({
          ...prevFormData,
          displayName: (event.target as HTMLInputElement).value,
        }));
        handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
      }
    },
    [handleSubmit, setFormData]
  );

  const handleGenderChange = useCallback(
    (gender: PlayerGender): void => {
      setFormData((prevFormData) => ({ ...prevFormData, gender }));
    },
    [setFormData]
  );

  if (!formData.room || isLoading) {
    return (
      <Box>
        <Typography variant="h2">
          <Trans i18nKey="loading" />
          ...
        </Typography>
        <Typography variant="body1">
          <Trans i18nKey="clearStorage" />
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" method="post" onSubmit={handleSubmit} className="settings-box">
      <ModeBar formData={formData} setFormData={setFormData} />
      {isMobile && <JumpNav entries={SECTIONS} onNavigate={handleNavigate} />}

      {hasLocalPlayers && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Trans i18nKey="localPlayerMode.activeNotice" />
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', mt: 2 }}>
        {!isMobile && <JumpNav entries={SECTIONS} onNavigate={handleNavigate} />}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!hasLocalPlayers && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="displayName"
                label={t('displayName')}
                defaultValue={user?.displayName || formData.displayName || ''}
                required
                onBlur={handleBlur}
                onKeyDown={onEnterKey}
                margin="normal"
              />
              <Box sx={{ mt: 1 }}>
                <GenderSelector
                  selectedGender={formData.gender || 'non-binary'}
                  onGenderChange={handleGenderChange}
                />
              </Box>
            </Box>
          )}

          <SettingsSection
            id="section-room"
            scope="room"
            title={t('sectionRoomPlayers')}
            expanded={!!expandedSections['section-room']}
            onExpandedChange={handleExpandedChange}
          >
            <RoomSection formData={formData} setFormData={setFormData} />
          </SettingsSection>

          <SettingsSection
            id="section-actions"
            scope="board"
            title={t('sectionActions')}
            summary={t('enabledCount', { count: enabledActionCount })}
            expanded={!!expandedSections['section-actions']}
            onExpandedChange={handleExpandedChange}
          >
            <ActionsSection
              formData={formData}
              setFormData={setFormData}
              actionsList={actionsList}
            />
          </SettingsSection>

          <SettingsSection
            id="section-size-pace"
            scope="board"
            title={t('sectionSizePace')}
            expanded={!!expandedSections['section-size-pace']}
            onExpandedChange={handleExpandedChange}
          >
            <SizePaceSection formData={formData} setFormData={setFormData} />
          </SettingsSection>

          <SettingsSection
            id="section-sound"
            scope="me"
            title={t('sectionSoundVoice')}
            expanded={!!expandedSections['section-sound']}
            onExpandedChange={handleExpandedChange}
          >
            <SoundSection formData={formData} setFormData={setFormData} />
          </SettingsSection>

          <SettingsSection
            id="section-display"
            scope="me"
            title={t('sectionDisplayLanguage')}
            expanded={!!expandedSections['section-display']}
            onExpandedChange={handleExpandedChange}
          >
            <DisplaySection
              formData={formData}
              setFormData={setFormData}
              boardUpdated={boardUpdated}
            />
          </SettingsSection>
        </Box>
      </Box>

      <div className="flex-buttons">
        <div className="left-buttons">
          {onOpenSetupWizard && (
            <Button variant="outlined" type="button" onClick={onOpenSetupWizard}>
              <Trans i18nKey="setupWizard.title" />
            </Button>
          )}
          <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
            <Trans i18nKey="customTilesLabel" />
          </Button>
        </div>
        <Button variant="contained" type="submit">
          <Trans i18nKey="update" />
        </Button>
      </div>

      {openCustomTile && (
        <CustomTileDialog
          open={openCustomTile}
          setOpen={setOpenCustomTile}
          boardUpdated={boardUpdated}
          actionsList={actionsList}
        />
      )}
      <ToastAlert open={!!alert} close={() => setAlert(null)}>
        {alert as ReactNode}
      </ToastAlert>
    </Box>
  );
}
