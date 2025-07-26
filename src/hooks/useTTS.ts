import { useState, useCallback, useRef, useEffect } from 'react';
import { TTSOptions, TTSResponse } from '@/types/tts';
import { ttsManager } from '@/services/ttsManager';

interface UseTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useTTS = (): UseTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentCleanupRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Stop Web Speech API if active
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }

    // Cleanup resources
    if (currentCleanupRef.current) {
      currentCleanupRef.current();
      currentCleanupRef.current = null;
    }

    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string, options: TTSOptions = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        // Stop any current playback
        stop();

        // Synthesize speech
        const response: TTSResponse = await ttsManager.synthesizeSpeech(text, options);

        setIsLoading(false);

        // If we got an audio URL (Google Cloud TTS), play it
        if (response.audioUrl) {
          const audio = new Audio(response.audioUrl);
          currentAudioRef.current = audio;
          currentCleanupRef.current = response.cleanup;

          audio.onloadstart = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            if (currentCleanupRef.current) {
              currentCleanupRef.current();
              currentCleanupRef.current = null;
            }
            currentAudioRef.current = null;
          };

          audio.onerror = () => {
            setError('Audio playback failed');
            setIsPlaying(false);
            if (currentCleanupRef.current) {
              currentCleanupRef.current();
              currentCleanupRef.current = null;
            }
          };

          await audio.play();
        } else {
          // Web Speech API case - just set playing state
          setIsPlaying(true);
          // The WebSpeechTTSService will handle the actual speech
          // and the promise resolves when speech ends
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'TTS failed';
        setError(errorMessage);
        setIsPlaying(false);
        setIsLoading(false);
        console.error('TTS Error:', err);
      }
    },
    [stop]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isPlaying,
    error,
    isLoading,
  };
};
