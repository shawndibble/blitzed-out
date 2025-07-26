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
      .filter((voice) => this.isNaturalVoice(voice.name)) // Filter out robotic voices
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

  // Filter out robotic and low-quality voices
  private isNaturalVoice(voiceName: string): boolean {
    const name = voiceName.toLowerCase();

    // Known robotic/poor quality voice patterns to exclude
    const roboticPatterns = [
      'microsoft',
      'google',
      'speechsynthesis',
      'robot',
      'synthetic',
      'computer',
      'tts',
      'espeak',
      'festival',
      'mary',
      'mbrola',
      'cereproc',
      'loquendo',
      'nuance',
      'realspeak',
      'cereproc',
      'ivona',
      'amazon',
      'aws',
      'polly',
      'default',
      'basic',
      'standard',
      'system',
      'built-in',
    ];

    // Known high-quality voice patterns to include
    const naturalPatterns = [
      'alex',
      'allison',
      'ava',
      'samantha',
      'susan',
      'victoria',
      'karen',
      'daniel',
      'fred',
      'junior',
      'kathy',
      'princess',
      'ralph',
      'trinoids',
      'whisper',
      'good news',
      'bad news',
      'bahh',
      'bells',
      'boing',
      'bubbles',
      'cellos',
      'deranged',
      'hysterical',
      'pipe organ',
      'zarvox',
      'jorge',
      'juan',
      'diego',
      'monica',
      'paulina',
      'amelie',
      'aurelie',
      'mariska',
      'marie',
      'thomas',
      'xander',
      'yelda',
      'zosia',
    ];

    // If voice contains robotic patterns, exclude it
    if (roboticPatterns.some((pattern) => name.includes(pattern))) {
      return false;
    }

    // If voice contains natural patterns, include it
    if (naturalPatterns.some((pattern) => name.includes(pattern))) {
      return true;
    }

    // For other voices, use heuristics
    // Include voices that don't have obvious synthetic markers
    const syntheticMarkers = [
      'tts',
      'synthesis',
      'artificial',
      'generated',
      'robot',
      'computer',
      'machine',
      'automatic',
      'digital',
    ];

    return !syntheticMarkers.some((marker) => name.includes(marker));
  }

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
}
