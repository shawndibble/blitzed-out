import { TTSService, TTSVoice, TTSOptions, TTSResponse } from '@/types/tts';
import { getAvailableVoices as getWebVoices } from '@/services/voiceSelection';

// Web Speech API implementation (fallback)
export class WebSpeechTTSService implements TTSService {
  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply options
      if (options.rate) utterance.rate = options.rate;
      if (options.pitch) utterance.pitch = options.pitch;

      // Set voice
      if (options.voice) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.name === options.voice);
        if (voice) utterance.voice = voice;
      }

      // Create a promise that resolves when speech ends
      utterance.onend = () => {
        // For Web Speech API, we don't have actual audio data
        // Return empty response that indicates speech completed
        resolve({
          audioContent: new ArrayBuffer(0),
          audioUrl: '',
          cleanup: () => {}, // No cleanup needed for Web Speech API
        });
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    const webVoices = getWebVoices();

    return webVoices
      .filter((voice) => !languageCode || voice.language.startsWith(languageCode))
      .map((voice) => ({
        name: voice.name,
        languageCode: voice.language,
        gender:
          voice.gender === 'male'
            ? ('MALE' as const)
            : voice.gender === 'female'
              ? ('FEMALE' as const)
              : ('NEUTRAL' as const),
        displayName: voice.label,
        provider: 'browser' as const,
        quality: 'standard' as const,
      }));
  }

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
}
