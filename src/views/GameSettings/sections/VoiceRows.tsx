import {
  Box,
  Button,
  Divider,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Dispatch, JSX, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingRow } from '../components/SettingRow';
import { VoiceOption, tts } from '@/services/tts';
import { type SpeechStage, preloadNeural } from '@/services/neuralTts';
import { webgpuKnownResult, webgpuUsable } from '@/services/gpuSupport';
import {
  NeuralVoice,
  VoiceEngine,
  VoiceGender,
  accentOf,
  defaultNeuralVoice,
  findNeuralVoice,
  neuralVoicesFor,
  toVoiceName,
} from '@/services/neuralVoices';
import { useTTS } from '@/hooks/useTTS';
import { Settings } from '@/types/Settings';

const PITCH_PRESETS: Record<string, number> = { low: 0.75, normal: 1.0, high: 1.5 };

const nearestPitchPreset = (pitch: number): string =>
  Object.entries(PITCH_PRESETS).reduce(
    (best, [key, value]) =>
      Math.abs(value - pitch) < Math.abs(PITCH_PRESETS[best] - pitch) ? key : best,
    'normal'
  );

interface VoiceRowsProps {
  formData: Settings;
  setFormData: Dispatch<SetStateAction<Settings>>;
  onVoiceChange: (voiceName: string) => void;
  onPitchChange: (pitch: number) => void;
}

function PitchRow({
  pitch,
  onChange,
}: {
  pitch: number;
  onChange: (pitch: number) => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <SettingRow label={t('pitch')} description={t('voicePitchHelp')}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={nearestPitchPreset(pitch)}
        onChange={(_: unknown, preset: string | null) => {
          if (preset) onChange(PITCH_PRESETS[preset]);
        }}
        aria-label={t('pitch')}
      >
        <ToggleButton value="low">{t('low')}</ToggleButton>
        <ToggleButton value="normal">{t('normal')}</ToggleButton>
        <ToggleButton value="high">{t('high')}</ToggleButton>
      </ToggleButtonGroup>
    </SettingRow>
  );
}

type SampleStage = SpeechStage | 'played' | null;

/** Plays a sample line and tracks which step it is on, for the status text. */
function useVoiceSample(): { stage: SampleStage; play: (voice: string, pitch: number) => void } {
  const { t } = useTranslation();
  const { speak } = useTTS();
  const [stage, setStage] = useState<SampleStage>(null);
  // A newer press interrupts an older one; only the latest may update the status.
  const runRef = useRef(0);
  useEffect(
    () => () => {
      runRef.current += 1;
    },
    []
  );

  const play = async (voice: string, pitch: number): Promise<void> => {
    const mine = ++runRef.current;
    const latest = (): boolean => runRef.current === mine;
    setStage(null);
    try {
      await speak(t('tts.sampleText', 'Take a drink and enjoy the game.'), {
        voice,
        pitch,
        onStage: (next) => latest() && setStage(next),
      });
      if (latest()) setStage('played');
    } catch {
      // Sample playback is best-effort; audio may be blocked until user interaction.
      if (latest()) setStage(null);
    }
  };
  return { stage, play };
}

function SampleRow({ stage, onPlay }: { stage: SampleStage; onPlay: () => void }): JSX.Element {
  const { t } = useTranslation();
  // Setup of a new voice can take several seconds; say so, so it doesn't look stuck.
  const status = {
    setup: (
      <>
        {t('voiceStageSetup')}
        <br />
        {t('voiceStageSetupNote')}
      </>
    ),
    generating: t('voiceStageGenerating'),
    playing: t('voiceStagePlaying'),
    played: t('voiceStagePlayed'),
  };
  return (
    <SettingRow
      label={t('voicePreview')}
      description={stage ? <span aria-live="polite">{status[stage]}</span> : undefined}
    >
      <Button size="small" variant="outlined" onClick={onPlay}>
        {t('playSample', 'Sample')}
      </Button>
    </SettingRow>
  );
}

// HD voices are only quick with a working GPU, so other browsers don't see them.
// `undefined` while the (fast, async) check runs, so a saved HD voice isn't
// replaced before we know whether it can be used.
function useHdSupported(): boolean | undefined {
  const [supported, setSupported] = useState<boolean | undefined>(webgpuKnownResult);
  useEffect(() => {
    let mounted = true;
    webgpuUsable().then((usable) => mounted && setSupported(usable));
    return () => {
      mounted = false;
    };
  }, []);
  return supported;
}

/** Voice + Pitch rows for text-to-speech, shown when "read my roll" is on. */
export default function VoiceRows(props: VoiceRowsProps): JSX.Element {
  const { i18n } = useTranslation();
  const hdSupported = useHdSupported();
  const language = i18n.language?.split('-')[0] ?? 'en';
  // Neural voices cover most app languages; the rest (e.g. Hindi) keep browser voices.
  if (neuralVoicesFor(language).length === 0) return <BrowserVoiceRows {...props} />;
  if (hdSupported === undefined) return <></>;
  return <NeuralVoiceRows {...props} language={language} hdSupported={hdSupported} />;
}

// Fixed so swapping the select for read-only text (or back) doesn't move the row.
const VOICE_FIELD_WIDTH = 168;

const ENGINE_GROUP_KEY: Record<VoiceEngine, string> = {
  piper: 'voiceGroupFast',
  kokoro: 'voiceGroupHd',
};

function NeuralVoiceRows({
  formData,
  setFormData,
  onVoiceChange,
  onPitchChange,
  language,
  hdSupported,
}: VoiceRowsProps & { language: string; hdSupported: boolean }): JSX.Element {
  const { t, i18n } = useTranslation();
  const sample = useVoiceSample();

  const allVoices = neuralVoicesFor(language).filter(
    (voice) => hdSupported || voice.engine !== 'kokoro'
  );
  const saved = findNeuralVoice(formData.voicePreference);
  // A voice from another language, an old browser voice, or an HD voice this
  // browser can't run well can't be used here.
  const current = saved && allVoices.includes(saved) ? saved : undefined;
  const selectedPitch = formData.voicePitch ?? 1.0;

  const chooseVoice = useCallback(
    (voice: NeuralVoice): void => {
      const voiceName = toVoiceName(voice);
      setFormData((prev) => ({ ...prev, voicePreference: voiceName }));
      onVoiceChange(voiceName);
    },
    [setFormData, onVoiceChange]
  );

  useEffect(() => {
    if (current) {
      preloadNeural(toVoiceName(current));
      return;
    }
    const fallback = defaultNeuralVoice(language);
    if (fallback) chooseVoice(fallback);
  }, [current, language, chooseVoice]);

  // Before the default voice is applied, show what it will be rather than an empty list.
  const shown = current ?? defaultNeuralVoice(language) ?? allVoices[0];
  const gender: VoiceGender = shown.gender;
  const region = accentOf(shown);
  const regions = [...new Set(allVoices.map(accentOf))];
  const genders = new Set(allVoices.map((voice) => voice.gender));
  const visible = allVoices.filter(
    (voice) => voice.gender === gender && accentOf(voice) === region
  );

  const accentName = (key: string): string => {
    const displayNames = (type: 'region' | 'language', code: string): string => {
      try {
        return new Intl.DisplayNames([i18n.language], { type }).of(code) ?? code;
      } catch {
        return code;
      }
    };
    // `l2:es` is English spoken with a Spanish accent, not a country.
    return key.startsWith('l2:')
      ? t('voiceNonNativeAccent', { language: displayNames('language', key.slice(3)) })
      : displayNames('region', key);
  };

  // Keep the engine group when switching so a change of gender or accent
  // doesn't also silently change how the voice is generated.
  const closest = (pool: NeuralVoice[]): NeuralVoice | undefined =>
    pool.find((voice) => voice.engine === current?.engine) ?? pool[0];

  const handleGender = (_: unknown, next: VoiceGender | null): void => {
    if (!next) return;
    const pool = allVoices.filter((voice) => voice.gender === next);
    const voice = closest(pool.filter((v) => accentOf(v) === region)) ?? closest(pool);
    if (voice) chooseVoice(voice);
  };

  const handleRegion = (event: SelectChangeEvent<string>): void => {
    const pool = allVoices.filter((voice) => accentOf(voice) === event.target.value);
    const voice = closest(pool.filter((v) => v.gender === gender)) ?? closest(pool);
    if (voice) chooseVoice(voice);
  };

  const voiceLabel = (voice: NeuralVoice): string =>
    voice.accent ? `${voice.name} · ${t(`voiceAccents.${voice.accent}`)}` : voice.name;

  const groups = (['piper', 'kokoro'] as const)
    .map((engine) => ({ engine, voices: visible.filter((voice) => voice.engine === engine) }))
    .filter((group) => group.voices.length > 0);
  // A divider and a bold heading make it clear where the Fast voices end and HD begins.
  const groupedItems = groups.flatMap(({ engine, voices }, index) => [
    ...(index > 0 ? [<Divider key={`${engine}-divider`} sx={{ my: 0.5 }} />] : []),
    <ListSubheader key={engine} sx={{ fontWeight: 700, lineHeight: '32px', color: 'primary.main' }}>
      {t(ENGINE_GROUP_KEY[engine])}
    </ListSubheader>,
    ...voices.map((voice) => (
      <MenuItem key={toVoiceName(voice)} value={toVoiceName(voice)}>
        {voiceLabel(voice)}
      </MenuItem>
    )),
  ]);

  return (
    <>
      <SettingRow
        label={t('voiceSelection')}
        description={regions.length > 1 ? t('voiceAccentHelp') : undefined}
        wrapControls
      >
        {/* One gender only (e.g. Spanish) leaves nothing to choose. */}
        {genders.size > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={gender}
            onChange={handleGender}
            aria-label={t('voiceGender')}
          >
            <ToggleButton value="male">{t('voiceMale')}</ToggleButton>
            <ToggleButton value="female">{t('voiceFemale')}</ToggleButton>
          </ToggleButtonGroup>
        )}
        {regions.length > 1 && (
          <Select
            size="small"
            value={region}
            onChange={handleRegion}
            aria-label={t('voiceAccent')}
            sx={{ maxWidth: 200 }}
          >
            {regions.map((code) => (
              <MenuItem key={code} value={code}>
                {accentName(code)}
              </MenuItem>
            ))}
          </Select>
        )}
        {visible.length === 1 ? (
          // Nothing to choose: show the voice as plain text, at the select's width so
          // the neighbouring controls don't shift when an accent leaves one option.
          <Box
            aria-label={t('voiceSelection')}
            sx={{
              width: VOICE_FIELD_WIDTH,
              px: 1.75,
              py: 0.6,
              fontSize: '0.85rem',
              color: 'text.secondary',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {voiceLabel(visible[0])}
          </Box>
        ) : (
          <Select
            size="small"
            value={current && visible.includes(current) ? toVoiceName(current) : ''}
            onChange={(event: SelectChangeEvent<string>) => {
              const voice = findNeuralVoice(event.target.value);
              if (voice) chooseVoice(voice);
            }}
            aria-label={t('voiceSelection')}
            sx={{ width: VOICE_FIELD_WIDTH }}
          >
            {groupedItems}
          </Select>
        )}
      </SettingRow>
      <PitchRow
        pitch={selectedPitch}
        onChange={(pitch) => {
          setFormData((prev) => ({ ...prev, voicePitch: pitch }));
          onPitchChange(pitch);
        }}
      />
      <SampleRow
        stage={sample.stage}
        onPlay={() => current && sample.play(toVoiceName(current), selectedPitch)}
      />
    </>
  );
}

/** Fallback for languages with no neural voices: the browser's own voices. */
function BrowserVoiceRows({
  formData,
  setFormData,
  onVoiceChange,
  onPitchChange,
}: VoiceRowsProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const sample = useVoiceSample();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedVoice = formData.voicePreference || '';
  const selectedPitch = formData.voicePitch ?? 1.0;

  // Tracks whether the current voice was auto-picked (so it can keep following
  // locale changes) or manually chosen (so it never gets silently overridden).
  const manuallySelectedRef = useRef<boolean>(Boolean(formData.voicePreference));
  const lastAutoLocaleRef = useRef<string | undefined>(undefined);

  // Functional update keeps this callback stable (no formData dependency) so
  // the voice-loading effect below only re-runs when the selected voice
  // actually changes — not on every unrelated GameSettings edit.
  const handleVoiceChange = useCallback(
    (voiceName: string, isManual: boolean = true): void => {
      manuallySelectedRef.current = isManual;
      setFormData((prev) => ({ ...prev, voicePreference: voiceName }));
      onVoiceChange(voiceName);
    },
    [setFormData, onVoiceChange]
  );

  useEffect(() => {
    let mounted = true;
    const localeHint = i18n.language?.split('-')[0];

    const loadVoices = async (): Promise<void> => {
      try {
        const availableVoices = await tts.getAvailableVoicesAsync();
        if (!mounted) return;

        // Google voices sound best; fall back to everything if none exist.
        const googleVoices = availableVoices.filter(
          (voice) => voice.displayName.includes('Google') || voice.name.includes('Google')
        );
        const voicesToUse = googleVoices.length > 0 ? googleVoices : availableVoices;
        setVoices(voicesToUse);

        // Re-run auto-selection when there's no valid voice yet, or when the
        // locale changed since the last auto-pick — but never override a
        // voice the user picked manually.
        const needsAutoSelect =
          !selectedVoice || !voicesToUse.some((voice) => voice.name === selectedVoice);
        const shouldFollowLocale =
          !manuallySelectedRef.current && lastAutoLocaleRef.current !== localeHint;

        if (voicesToUse.length > 0 && (needsAutoSelect || shouldFollowLocale)) {
          const preferredVoice = await tts.getPreferredVoiceAsync(localeHint);
          if (!mounted) return;
          const fallback = voicesToUse.some((voice) => voice.name === preferredVoice)
            ? (preferredVoice as string)
            : voicesToUse[0].name;
          lastAutoLocaleRef.current = localeHint;
          handleVoiceChange(fallback, false);
        }
      } catch {
        // Voice list unavailable; the rows below render an explanatory message.
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadVoices();
    return () => {
      mounted = false;
    };
  }, [selectedVoice, handleVoiceChange, i18n.language]);

  if (isLoading) {
    return (
      <SettingRow label={t('voiceSelection')}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('loadingVoices', 'Loading voices...')}
        </Typography>
      </SettingRow>
    );
  }

  if (voices.length === 0) {
    return (
      <SettingRow label={t('voiceSelection')}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('noVoicesAvailable', 'No voices available')}
        </Typography>
      </SettingRow>
    );
  }

  return (
    <>
      <SettingRow label={t('voiceSelection')}>
        <Select
          size="small"
          value={voices.some((voice) => voice.name === selectedVoice) ? selectedVoice : ''}
          onChange={(event: SelectChangeEvent<string>) => handleVoiceChange(event.target.value)}
          aria-label={t('voiceSelection')}
          sx={{ maxWidth: 240 }}
        >
          {voices.map((voice) => (
            <MenuItem key={voice.name} value={voice.name}>
              {voice.displayName.replace(/^Google\s+/i, '')}
            </MenuItem>
          ))}
        </Select>
      </SettingRow>
      <PitchRow
        pitch={selectedPitch}
        onChange={(pitch) => {
          setFormData((prev) => ({ ...prev, voicePitch: pitch }));
          onPitchChange(pitch);
        }}
      />
      <SampleRow
        stage={sample.stage}
        onPlay={() => {
          const voiceToPlay = selectedVoice || voices[0]?.name;
          if (voiceToPlay) sample.play(voiceToPlay, selectedPitch);
        }}
      />
    </>
  );
}
