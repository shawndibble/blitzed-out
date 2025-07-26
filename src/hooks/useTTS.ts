import { useState, useCallback, useEffect } from 'react';
import { tts } from '@/services/tts';

interface TTSOptions {
  voice?: string;
  pitch?: number;
}

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
    tts.stop();
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
        setIsPlaying(true);
        await tts.speak(text, options.voice, options.pitch);

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
