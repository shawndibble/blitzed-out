import { useState, useCallback, useEffect } from 'react';
import { TTSOptions } from '@/types/tts';
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

  const stop = useCallback(() => {
    // Stop Web Speech API if active
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
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

        // Synthesize speech (Web Speech API only)
        setIsPlaying(true);
        await ttsManager.synthesizeSpeech(text, options);

        setIsLoading(false);
        setIsPlaying(false);
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
