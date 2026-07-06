import './styles.css';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { FocusEvent, FormEvent, JSX, ReactNode, useCallback, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import ActionsSection from './sections/ActionsSection';
import CustomTileDialog from '@/views/CustomTileDialog';
import DisplaySection from './sections/DisplaySection';
import JumpNav, { JumpNavEntry } from './components/JumpNav';
import ModeBar from './components/ModeBar';
import RoomSection from './sections/RoomSection';
import SettingsSection from './components/SettingsSection';
import SizePaceSection from './sections/SizePaceSection';
import SoundSection from './sections/SoundSection';
import ToastAlert from '@/components/ToastAlert';
import { SettingGroup, SettingRow } from './components/SettingRow';
import type { PlayerGender } from '@/types/localPlayers';
import { isPublicRoom, usesSoloActions } from '@/helpers/strings';
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

/**
 * Advanced settings page (route: /:id/settings). One scrollable page, all
 * settings, grouped by scope (Room — everyone / Game board / Only me). A
 * sticky header (Update top-right) and global play-style mode bar span the
 * full width; a jump-rail (desktop) or chip row (mobile) navigates within
 * the page. Mobile sections collapse so the catalog stays short.
 */
export default function GameSettings(): JSX.Element {
  const { id: roomParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useBreakpoint();

  const [settings, updateSettings] = useSettings();
  const [alert, setAlert] = useState<string | null>(null);
  const [openCustomTile, setOpenCustomTile] = useState<boolean>(false);
  const [actionsPickerOpen, setActionsPickerOpen] = useState(false);
  const [formData, setFormData] = useSettingsToFormData();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-actions': true,
  });

  const { submit: submitSettings, isSubmitting } = useSubmitGameSettings();

  // Partnered play draws from the local content set; solo participation from
  // the online set. Passing gameMode directly would hand With Others the solo
  // catalog (the wizard derives content the same way).
  const contentGameMode = usesSoloActions(formData.gameMode, formData.soloPlay)
    ? 'online'
    : 'local';
  const { isLoading, actionsList } = useUnifiedActionList(contentGameMode, true);
  const { hasLocalPlayers } = useLocalPlayers();

  // Mode switches reload the action catalog; only the very first load blanks
  // the page. Later reloads keep the page up (the picker briefly shows the
  // previous catalog instead of a loading flash).
  const hasLoadedOnceRef = useRef(false);
  if (!isLoading) hasLoadedOnceRef.current = true;

  const boardUpdated = (): void => updateSettings({ ...settings, boardUpdated: true });

  const enabledActionCount = Object.keys(formData.selectedActions || {}).length;

  const returnToRoom = useCallback((): void => {
    navigate(`/${(formData.room || roomParam || 'PUBLIC').toUpperCase()}`);
  }, [navigate, formData.room, roomParam]);

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
      returnToRoom();
      return null;
    },
    [formData, actionsList, t, setAlert, submitSettings, returnToRoom]
  );

  const handleDisplayNameBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setFormData((prevFormData) => ({ ...prevFormData, displayName: event.target.value }));
    },
    [setFormData]
  );

  const handleGenderChange = useCallback(
    (gender: PlayerGender): void => {
      setFormData((prevFormData) => ({ ...prevFormData, gender }));
    },
    [setFormData]
  );

  if (!formData.room || (isLoading && !hasLoadedOnceRef.current)) {
    return (
      <Box sx={{ p: 4 }}>
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
    <Box
      component="form"
      method="post"
      onSubmit={handleSubmit}
      sx={{ minHeight: '100vh', bgcolor: 'background.default' }}
    >
      {/* Sticky header stack: title bar + mode bar (+ chip nav on mobile), full width */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1, sm: 2 }, py: 1 }}>
          <IconButton onClick={returnToRoom} aria-label={t('back', 'Back')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            <Trans i18nKey="gameSettingsHeading" />
          </Typography>
          {!isPublicRoom(formData.room) && (
            <Chip
              label={formData.room}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            <Trans i18nKey={isSubmitting ? 'buildingBoard' : 'update'} />
          </Button>
        </Box>
        <ModeBar formData={formData} setFormData={setFormData} />
        {isMobile && <JumpNav entries={SECTIONS} onNavigate={handleNavigate} />}
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8, pt: 2 }}>
        {hasLocalPlayers && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Trans i18nKey="localPlayerMode.activeNotice" />
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {!isMobile && <JumpNav entries={SECTIONS} onNavigate={handleNavigate} railTop={128} />}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!hasLocalPlayers && (
              <Box sx={{ mb: 3 }}>
                <SettingGroup>
                  <SettingRow label={t('displayName')}>
                    <TextField
                      size="small"
                      id="displayName"
                      defaultValue={user?.displayName || formData.displayName || ''}
                      required
                      onBlur={handleDisplayNameBlur}
                      sx={{ width: { xs: '100%', sm: 220 } }}
                      slotProps={{ htmlInput: { 'aria-label': t('displayName') } }}
                    />
                  </SettingRow>
                  <SettingRow label={t('anatomy', 'Anatomy')} description={t('anatomyCaption')}>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={formData.gender || 'non-binary'}
                      onChange={(_, value: PlayerGender | null) => {
                        if (value) handleGenderChange(value);
                      }}
                      aria-label={t('anatomy', 'Anatomy')}
                    >
                      <ToggleButton value="male">{t('localPlayers.gender.male')}</ToggleButton>
                      <ToggleButton value="female">{t('localPlayers.gender.female')}</ToggleButton>
                      <ToggleButton value="non-binary">
                        {t('localPlayers.gender.nonBinary')}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </SettingRow>
                </SettingGroup>
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
              action={
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setActionsPickerOpen(true)}
                >
                  {t('add', 'Add')}
                </Button>
              }
              expanded={!!expandedSections['section-actions']}
              onExpandedChange={handleExpandedChange}
            >
              <ActionsSection
                formData={formData}
                setFormData={setFormData}
                actionsList={actionsList}
                pickerOpen={actionsPickerOpen}
                onPickerOpenChange={setActionsPickerOpen}
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

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
              }}
            >
              <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
                <Trans i18nKey="customTilesLabel" />
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                <Trans i18nKey={isSubmitting ? 'buildingBoard' : 'update'} />
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

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
