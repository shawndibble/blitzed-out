import { TTSService, TTSVoice, TTSOptions, TTSResponse } from '@/types/tts';
import { GoogleCloudTTSService, getGoogleVoicesForLanguage } from './googleCloudTTS';
import { WebSpeechTTSService } from './webSpeechTTS';

export class TTSManager implements TTSService {
  private googleTTS: GoogleCloudTTSService;
  private webSpeechTTS: WebSpeechTTSService;
  private preferredService: 'google' | 'browser' = 'google';

  constructor() {
    this.googleTTS = new GoogleCloudTTSService();
    this.webSpeechTTS = new WebSpeechTTSService();
  }

  setPreferredService(service: 'google' | 'browser'): void {
    this.preferredService = service;
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    // Try Google Cloud TTS first if preferred and available
    if (this.preferredService === 'google') {
      try {
        return await this.googleTTS.synthesizeSpeech(text, options);
      } catch (error) {
        console.warn('Google Cloud TTS failed, falling back to Web Speech API:', error);

        // Fallback to Web Speech API
        if (this.webSpeechTTS.isAvailable()) {
          return await this.webSpeechTTS.synthesizeSpeech(text, options);
        }

        throw error;
      }
    } else {
      // Use Web Speech API if preferred
      if (this.webSpeechTTS.isAvailable()) {
        return await this.webSpeechTTS.synthesizeSpeech(text, options);
      } else {
        // Fallback to Google Cloud TTS
        return await this.googleTTS.synthesizeSpeech(text, options);
      }
    }
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    const voices: TTSVoice[] = [];

    // Get Google Cloud voices
    try {
      if (languageCode) {
        const googleVoices = getGoogleVoicesForLanguage(languageCode);
        voices.push(...googleVoices);
      } else {
        // Get all Google voices
        Object.values(getGoogleVoicesForLanguage('en')).forEach((voiceList) => {
          if (Array.isArray(voiceList)) {
            voices.push(...voiceList);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to get Google Cloud voices:', error);
    }

    // Get Web Speech API voices as fallback
    try {
      const webVoices = await this.webSpeechTTS.getAvailableVoices(languageCode);
      voices.push(...webVoices);
    } catch (error) {
      console.warn('Failed to get Web Speech voices:', error);
    }

    // Sort by quality (Google first, then browser)
    return voices.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider === 'google' ? -1 : 1;
      }

      // Within same provider, sort by quality
      const qualityOrder = { neural2: 0, wavenet: 1, standard: 2 };
      return qualityOrder[a.quality] - qualityOrder[b.quality];
    });
  }

  isAvailable(): boolean {
    return this.googleTTS.isAvailable() || this.webSpeechTTS.isAvailable();
  }

  // Get preferred voice for language (Google Cloud first, then fallback)
  async getPreferredVoice(
    languageCode: string,
    gender: 'male' | 'female' = 'male'
  ): Promise<string | null> {
    const voices = await this.getAvailableVoices(languageCode);

    // Prefer Google Cloud Neural2 male voices
    const googleVoice = voices.find(
      (v) =>
        v.provider === 'google' &&
        v.quality === 'neural2' &&
        v.gender === (gender.toUpperCase() as 'MALE' | 'FEMALE')
    );

    if (googleVoice) {
      return googleVoice.name;
    }

    // Fallback to any Google voice
    const anyGoogleVoice = voices.find((v) => v.provider === 'google');
    if (anyGoogleVoice) {
      return anyGoogleVoice.name;
    }

    // Final fallback to browser voice
    const browserVoice = voices.find((v) => v.provider === 'browser');
    return browserVoice?.name || null;
  }
}

// Singleton instance
export const ttsManager = new TTSManager();
