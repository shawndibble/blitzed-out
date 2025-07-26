import { TTSService, TTSVoice, TTSOptions, TTSResponse } from '@/types/tts';
import { WebSpeechTTSService } from './webSpeechTTS';

export class TTSManager implements TTSService {
  private webSpeechTTS: WebSpeechTTSService;

  constructor() {
    this.webSpeechTTS = new WebSpeechTTSService();
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    // Use Web Speech API (browser voices only)
    if (this.webSpeechTTS.isAvailable()) {
      return await this.webSpeechTTS.synthesizeSpeech(text, options);
    } else {
      throw new Error('Web Speech API not available');
    }
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    try {
      // Get only Web Speech API voices (filtered for top quality)
      const webVoices = await this.webSpeechTTS.getAvailableVoices(languageCode);

      // Sort by quality (higher quality scores first)
      return webVoices.sort((a, b) => {
        // Parse quality from voice name patterns (our curated list has quality scores)
        const getQualityScore = (voice: TTSVoice): number => {
          const name = voice.name.toLowerCase();

          // Premium voices (highest quality)
          if (name.includes('alex') || name.includes('samantha')) return 10;
          if (
            name.includes('google uk english') ||
            name.includes('google español') ||
            name.includes('google français') ||
            name.includes('google 中文') ||
            name.includes('google हिन्दी')
          )
            return 9;
          if (name.includes('victoria') || name.includes('monica')) return 9;
          if (
            name.includes('allison') ||
            name.includes('ava') ||
            name.includes('jorge') ||
            name.includes('thomas') ||
            name.includes('amelie')
          )
            return 8;
          if (
            name.includes('karen') ||
            name.includes('moira') ||
            name.includes('fiona') ||
            name.includes('juan') ||
            name.includes('esperanza') ||
            name.includes('pierre') ||
            name.includes('brigitte')
          )
            return 6;

          // Good quality voices
          return 5;
        };

        const qualityDiff = getQualityScore(b) - getQualityScore(a);
        if (qualityDiff !== 0) {
          return qualityDiff;
        }

        // Final sort: Alphabetical by display name
        return a.displayName.localeCompare(b.displayName);
      });
    } catch (error) {
      console.warn('Failed to get Web Speech voices:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return this.webSpeechTTS.isAvailable();
  }

  // Get preferred voice for language (best browser voice)
  async getPreferredVoice(languageCode: string): Promise<string | null> {
    const voices = await this.getAvailableVoices(languageCode);

    // Return the first (highest quality) voice for the language
    return voices.length > 0 ? voices[0].name : null;
  }

  // Get sample text for a language
  getSampleText(languageCode: string): string {
    return this.webSpeechTTS.getSampleText(languageCode);
  }
}

// Singleton instance
export const ttsManager = new TTSManager();
