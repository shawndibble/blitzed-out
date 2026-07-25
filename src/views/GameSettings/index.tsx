import './styles.css';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  FocusEvent,
  FormEvent,
  JSX,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { customAlphabet } from 'nanoid';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { buildActionsScopeSummary } from './actionsScopeSummary';
import { buildReturnToRoomUrl } from './returnToRoomUrl';
import ActionsSection from './sections/ActionsSection';
import CustomTileDialog from '@/views/CustomTileDialog';
import DisplaySection from './sections/DisplaySection';
import JumpNav, { JumpNavEntry } from './components/JumpNav';
import RoomSection from './sections/RoomSection';
import SetupSection from './sections/SetupSection';
import { carrySelectedActions, hasRoomSettings } from './setupQuestions';
import SettingsSection from './components/SettingsSection';
import SizePaceSection from './sections/SizePaceSection';
import SoundSection from './sections/SoundSection';
import ToastAlert from '@/components/ToastAlert';
import { SettingGroup, SettingRow } from './components/SettingRow';
import type { ActionEntry } from '@/types';
import type { PlayerGender } from '@/types/localPlayers';
import { deriveParticipationContentMode, isPublicRoom, usesSoloActions } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import { useSettings } from '@/stores/settingsStore';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import validateFormData from './validateForm';

const generateRoomCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

/**
 * Page order, which the jump rail follows exactly. "You" is setup-scoped rather
 * than only-me: it is identity you establish alongside the questions, and
 * scoping it to only-me put a second "Only me" group in the rail, far from where
 * the section actually sits.
 */
const SECTIONS: JumpNavEntry[] = [
  { id: 'section-setup', labelKey: 'sectionSetup', scope: 'setup' },
  { id: 'section-you', labelKey: 'sectionYou', scope: 'setup' },
  { id: 'section-room', labelKey: 'sectionRoomPlayers', scope: 'room' },
  { id: 'section-actions', labelKey: 'sectionActions', scope: 'board' },
  { id: 'section-size-pace', labelKey: 'sectionSizePace', scope: 'board' },
  { id: 'section-sound', labelKey: 'sectionSoundVoice', scope: 'me' },
  { id: 'section-display', labelKey: 'sectionDisplayLanguage', scope: 'me' },
];

/**
 * Advanced settings page (route: /:id/settings). One scrollable page, all
 * settings, grouped by scope. Reached only deliberately — the wizard is the
 * default entry for a new game — so this page optimises for no surprises
 * rather than for teaching.
 *
 * It opens with the two questions that drive everything below it (see
 * `setupQuestions.ts`), accented rather than pinned: they were sticky purely so
 * they wouldn't be skipped, and at three rows that cost 40% of a mobile
 * viewport. Identity follows in its own section so it can disappear whole in
 * Shared Device, where the roster owns it. A sticky header (Update top-right)
 * spans the full width; a jump rail (desktop) or chip row (mobile) navigates
 * within the page, following page order exactly. Every section stays open.
 */
export default function GameSettings(): JSX.Element {
  const { id: roomParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeStep = searchParams.get('resumeStep');
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useBreakpoint();

  const [settings, updateSettings] = useSettings();
  const [alert, setAlert] = useState<string | null>(null);
  const [openCustomTile, setOpenCustomTile] = useState<boolean>(false);
  const [formData, setFormData] = useSettingsToFormData();

  const { submit: submitSettings, isSubmitting } = useSubmitGameSettings();

  // Partnered play draws from the local content set; solo participation from
  // the online set. Passing gameMode directly would hand With Others the solo
  // catalog (the wizard derives content the same way).
  const isSoloActionsScope = usesSoloActions(formData.gameMode, formData.soloPlay);
  const contentGameMode = deriveParticipationContentMode(formData.gameMode, formData.soloPlay);
  const { isLoading, actionsList, loadedGameMode } = useUnifiedActionList(contentGameMode, true);
  const { hasLocalPlayers } = useLocalPlayers();

  // Identity is per-player in Shared Device (the roster collects each player's
  // own name, anatomy and role), so it has nothing to offer there. Gated on the
  // chosen topology, not on whether a roster exists yet — otherwise the moot
  // rows linger until the first player is added.
  const isSharedDevice = formData.gameMode === 'local';
  const showRoomSection = hasRoomSettings(formData.room);
  const hiddenSectionIds = [
    ...(isSharedDevice ? ['section-you'] : []),
    ...(showRoomSection ? [] : ['section-room']),
  ];
  const sections = SECTIONS.filter((section) => !hiddenSectionIds.includes(section.id));

  // Mode switches reload the action catalog; only the very first load blanks
  // the page. Later reloads keep the page up (the picker briefly shows the
  // previous catalog instead of a loading flash).
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!isLoading) hasLoadedOnceRef.current = true;
  }, [isLoading]);

  // The two content catalogs share group keys with the same label but different
  // types and different action text ("Bating" is self-play online and partnered
  // locally), so carrying a selection across a catalog change would silently
  // rewrite the board. The selection is therefore re-pointed at the new catalog
  // once it arrives.
  //
  // Keyed on `contentGameMode` itself, not on the participation control: the
  // content mode also flips from the device and company answers (Shared Device
  // forces partnered content, the public room forces solo), so wiring this to
  // one toggle left the same silent rewrite reachable from the rows either side
  // of it — and left dropped groups behind as zombie cards keyed by their raw
  // group name.
  const pendingCarryRef = useRef<{
    targetMode: string;
    selection: Record<string, ActionEntry>;
    labels: Record<string, string>;
  } | null>(null);
  const [droppedLabels, setDroppedLabels] = useState<string[]>([]);

  // Snapshot on the render the mode changes, while `actionsList` is still the
  // outgoing catalog — the labels of groups about to be dropped exist nowhere
  // else, since by definition they are absent from the incoming one.
  const carriedContentModeRef = useRef(contentGameMode);
  useEffect(() => {
    if (carriedContentModeRef.current === contentGameMode) return;
    carriedContentModeRef.current = contentGameMode;

    const selection = formData.selectedActions ?? {};
    if (!Object.keys(selection).length) return;
    pendingCarryRef.current = {
      targetMode: contentGameMode,
      selection,
      labels: Object.fromEntries(
        Object.keys(selection).map((key) => [key, actionsList[key]?.label ?? key])
      ),
    };
  }, [contentGameMode, formData.selectedActions, actionsList]);

  useEffect(() => {
    const pending = pendingCarryRef.current;
    // `loadedGameMode` is the guard that `isLoading` can't be: on the render
    // right after the flip, isLoading is still stale-false over the old catalog.
    if (!pending || isLoading || loadedGameMode !== pending.targetMode) return;
    pendingCarryRef.current = null;

    const { kept, droppedKeys } = carrySelectedActions(pending.selection, actionsList);
    if (droppedKeys.length) {
      setDroppedLabels(droppedKeys.map((key) => pending.labels[key] ?? key));
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      selectedActions: kept,
      boardUpdated: true,
    }));
  }, [isLoading, loadedGameMode, actionsList, setFormData]);

  // The URL is the source of truth for the room the user is actually in;
  // formData.room is only the pending choice until Update. Toggles and mode
  // switches restore the current private room from the URL — a fresh code is
  // generated once per visit, and only when coming from the public room.
  const generatedRoomRef = useRef<string | null>(null);
  const getPrivateRoom = useCallback((): string => {
    if (roomParam && !isPublicRoom(roomParam)) return roomParam.toUpperCase();
    generatedRoomRef.current ??= generateRoomCode();
    return generatedRoomRef.current;
  }, [roomParam]);

  const boardUpdated = (): void => updateSettings({ ...settings, boardUpdated: true });

  const enabledActionCount = Object.keys(formData.selectedActions || {}).length;

  const returnToRoom = useCallback((): void => {
    const room = (formData.room || roomParam || 'PUBLIC').toUpperCase();
    navigate(buildReturnToRoomUrl(room, resumeStep));
  }, [navigate, formData.room, roomParam, resumeStep]);

  // A completed Update always shows the finished game — never resume the
  // wizard, even if Advanced was reached via its "Advanced Setup" link (which
  // left resumeStep in the URL for the Back button to carry). Only Back
  // (returnToRoom, above) means "resume where I left off".
  const goToRoomAfterSave = useCallback((): void => {
    const room = (formData.room || roomParam || 'PUBLIC').toUpperCase();
    navigate(buildReturnToRoomUrl(room, null));
  }, [navigate, formData.room, roomParam]);

  const handleNavigate = useCallback((id: string): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      try {
        await submitSettings(formData, actionsList);
        goToRoomAfterSave();
      } catch {
        setAlert(t('settingsSaveError'));
      }
      return null;
    },
    [formData, actionsList, t, setAlert, submitSettings, goToRoomAfterSave]
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
      {/* Sticky header stack: title bar (+ chip nav on mobile), full width */}
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
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
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
        </Container>
        {isMobile && <JumpNav entries={sections} onNavigate={handleNavigate} />}
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8, pt: 2 }}>
        {hasLocalPlayers && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Trans i18nKey="localPlayerMode.activeNotice" />
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {!isMobile && <JumpNav entries={sections} onNavigate={handleNavigate} />}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SettingsSection id="section-setup" scope="setup" title={t('sectionSetup')}>
              <SetupSection
                formData={formData}
                setFormData={setFormData}
                getPrivateRoom={getPrivateRoom}
              />
            </SettingsSection>

            {!isSharedDevice && (
              <SettingsSection id="section-you" scope="setup" title={t('sectionYou')}>
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
              </SettingsSection>
            )}

            {showRoomSection && (
              <SettingsSection id="section-room" scope="room" title={t('sectionRoomPlayers')}>
                <RoomSection formData={formData} setFormData={setFormData} />
              </SettingsSection>
            )}

            <SettingsSection
              id="section-actions"
              scope="board"
              title={t('sectionActions')}
              summary={buildActionsScopeSummary(t, enabledActionCount, isSoloActionsScope)}
            >
              <ActionsSection
                formData={formData}
                setFormData={setFormData}
                actionsList={actionsList}
                onManageCustomTiles={() => setOpenCustomTile(true)}
              />
            </SettingsSection>

            <SettingsSection id="section-size-pace" scope="board" title={t('sectionSizePace')}>
              <SizePaceSection formData={formData} setFormData={setFormData} />
            </SettingsSection>

            <SettingsSection id="section-sound" scope="me" title={t('sectionSoundVoice')}>
              <SoundSection formData={formData} setFormData={setFormData} />
            </SettingsSection>

            <SettingsSection id="section-display" scope="me" title={t('sectionDisplayLanguage')}>
              <DisplaySection
                formData={formData}
                setFormData={setFormData}
                boardUpdated={boardUpdated}
              />
            </SettingsSection>

            <Box sx={{ display: 'flex', mt: 3, justifyContent: 'flex-end' }}>
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
      {/* Dropped groups are announced rather than silently removed — the whole
          point of the carry pass is that a participation flip must never
          rewrite the board behind the user's back. */}
      <Snackbar
        open={droppedLabels.length > 0}
        autoHideDuration={8000}
        onClose={() => setDroppedLabels([])}
        message={t('actionsDroppedForParticipation', { labels: droppedLabels.join(', ') })}
      />
      <ToastAlert open={!!alert} close={() => setAlert(null)}>
        {alert as ReactNode}
      </ToastAlert>
    </Box>
  );
}
