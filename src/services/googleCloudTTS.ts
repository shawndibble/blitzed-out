import { TTSService, TTSVoice, TTSOptions, TTSResponse } from '@/types/tts';

// Google Cloud TTS implementation
export class GoogleCloudTTSService implements TTSService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/tts') {
    this.baseUrl = baseUrl;
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: options.voice || 'en-US-Neural2-D', // Default male voice
          languageCode: options.languageCode || 'en-US',
          audioEncoding: options.audioEncoding || 'MP3',
          speakingRate: options.rate || 1.0,
          pitch: options.pitch || 0.0,
          volumeGainDb: options.volumeGainDb || 0.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
      }

      const audioContent = await response.arrayBuffer();
      const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioContent,
        audioUrl,
        cleanup: () => URL.revokeObjectURL(audioUrl),
      };
    } catch (error) {
      console.error('Google Cloud TTS error:', error);
      throw error;
    }
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    try {
      const url = new URL(`${this.baseUrl}/voices`, window.location.origin);
      if (languageCode) {
        url.searchParams.set('languageCode', languageCode);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch Google Cloud voices:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    // Check if we can reach the TTS API
    return typeof fetch !== 'undefined';
  }
}

// Predefined high-quality Google Cloud voices
export const GOOGLE_CLOUD_VOICES: Record<string, TTSVoice[]> = {
  'en-US': [
    {
      name: 'en-US-Neural2-D',
      languageCode: 'en-US',
      gender: 'MALE',
      displayName: 'Neural2 David (Male)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'en-US-Neural2-F',
      languageCode: 'en-US',
      gender: 'FEMALE',
      displayName: 'Neural2 Emma (Female)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'en-US-Neural2-A',
      languageCode: 'en-US',
      gender: 'MALE',
      displayName: 'Neural2 Adam (Male)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'en-US-Neural2-C',
      languageCode: 'en-US',
      gender: 'FEMALE',
      displayName: 'Neural2 Clara (Female)',
      provider: 'google',
      quality: 'neural2',
    },
  ],
  'es-US': [
    {
      name: 'es-US-Neural2-A',
      languageCode: 'es-US',
      gender: 'FEMALE',
      displayName: 'Neural2 Penélope (Female)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'es-US-Neural2-B',
      languageCode: 'es-US',
      gender: 'MALE',
      displayName: 'Neural2 Patricio (Male)',
      provider: 'google',
      quality: 'neural2',
    },
  ],
  'fr-FR': [
    {
      name: 'fr-FR-Neural2-A',
      languageCode: 'fr-FR',
      gender: 'FEMALE',
      displayName: 'Neural2 Céline (Female)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'fr-FR-Neural2-B',
      languageCode: 'fr-FR',
      gender: 'MALE',
      displayName: 'Neural2 Antoine (Male)',
      provider: 'google',
      quality: 'neural2',
    },
  ],
  'zh-CN': [
    {
      name: 'cmn-CN-Wavenet-A',
      languageCode: 'zh-CN',
      gender: 'FEMALE',
      displayName: 'Wavenet 小美 (Female)',
      provider: 'google',
      quality: 'wavenet',
    },
    {
      name: 'cmn-CN-Wavenet-B',
      languageCode: 'zh-CN',
      gender: 'MALE',
      displayName: 'Wavenet 小明 (Male)',
      provider: 'google',
      quality: 'wavenet',
    },
  ],
  'hi-IN': [
    {
      name: 'hi-IN-Neural2-A',
      languageCode: 'hi-IN',
      gender: 'FEMALE',
      displayName: 'Neural2 Aditi (Female)',
      provider: 'google',
      quality: 'neural2',
    },
    {
      name: 'hi-IN-Neural2-B',
      languageCode: 'hi-IN',
      gender: 'MALE',
      displayName: 'Neural2 Abhishek (Male)',
      provider: 'google',
      quality: 'neural2',
    },
  ],
};

// Helper function to get voices for a language
export function getGoogleVoicesForLanguage(languageCode: string): TTSVoice[] {
  // Map app language codes to Google language codes
  const languageMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-US',
    fr: 'fr-FR',
    zh: 'zh-CN',
    hi: 'hi-IN',
  };

  const googleLangCode = languageMap[languageCode] || languageCode;
  return GOOGLE_CLOUD_VOICES[googleLangCode] || GOOGLE_CLOUD_VOICES['en-US'];
}
