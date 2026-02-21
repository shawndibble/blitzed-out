import { useEffect, useCallback } from 'react';
import { getAudioContext, unlockAudioContext } from '@/utils/audioContext';
import { useSettingsStore } from '@/stores/settingsStore';
import { AmbientSoundscape } from '@/types/Settings';

const SOUNDSCAPE_PATHS: Record<AmbientSoundscape, string> = {
  lounge: '/sounds/ambient/lounge.mp3',
  intimate: '/sounds/ambient/intimate.mp3',
  party: '/sounds/ambient/party.mp3',
};

class AmbientMusicService {
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSoundscape: AmbientSoundscape | null = null;
  private audioBuffers: Map<AmbientSoundscape, AudioBuffer> = new Map();
  private isPlaying = false;

  async loadSoundscape(name: AmbientSoundscape): Promise<AudioBuffer | null> {
    if (this.audioBuffers.has(name)) {
      return this.audioBuffers.get(name) || null;
    }

    const ctx = getAudioContext();
    if (!ctx) return null;

    try {
      const response = await fetch(SOUNDSCAPE_PATHS[name]);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(name, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  async play(soundscape: AmbientSoundscape, volume: number): Promise<void> {
    await unlockAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;

    if (this.isPlaying && this.currentSoundscape === soundscape) {
      this.setVolume(volume);
      return;
    }

    this.stop();

    const buffer = await this.loadSoundscape(soundscape);
    if (!buffer) return;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(ctx.destination);

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start(0);

    this.currentSoundscape = soundscape;
    this.isPlaying = true;
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignore errors from already stopped nodes
      }
      this.sourceNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.currentSoundscape = null;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSoundscape(): AmbientSoundscape | null {
    return this.currentSoundscape;
  }
}

export const ambientMusic = new AmbientMusicService();

export function useAmbientMusic() {
  const { settings, updateSettings } = useSettingsStore();
  const { ambientMusicEnabled, ambientSoundscape, ambientVolume } = settings;

  const effectiveVolume = ambientVolume ?? 0.3;
  const effectiveSoundscape = ambientSoundscape ?? 'lounge';

  useEffect(() => {
    if (ambientMusicEnabled && effectiveSoundscape) {
      ambientMusic.play(effectiveSoundscape, effectiveVolume);
    } else {
      ambientMusic.stop();
    }

    return () => {
      // Cleanup is handled by the service singleton
    };
  }, [ambientMusicEnabled, effectiveSoundscape, effectiveVolume]);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings({ ambientMusicEnabled: enabled });
    },
    [updateSettings]
  );

  const setSoundscape = useCallback(
    (soundscape: AmbientSoundscape) => {
      updateSettings({ ambientSoundscape: soundscape });
    },
    [updateSettings]
  );

  const setVolume = useCallback(
    (volume: number) => {
      updateSettings({ ambientVolume: volume });
      ambientMusic.setVolume(volume);
    },
    [updateSettings]
  );

  return {
    isEnabled: ambientMusicEnabled ?? false,
    soundscape: effectiveSoundscape,
    volume: effectiveVolume,
    isPlaying: ambientMusic.getIsPlaying(),
    setEnabled,
    setSoundscape,
    setVolume,
  };
}
