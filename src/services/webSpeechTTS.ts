import { TTSService, TTSVoice, TTSOptions, TTSResponse } from '@/types/tts';

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
        resolve({});
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    // Get voices directly from browser API
    const browserVoices = window.speechSynthesis.getVoices();

    return browserVoices
      .filter((voice) => !languageCode || voice.lang.startsWith(languageCode))
      .filter((voice) => this.isNaturalVoice(voice.name)) // Filter out robotic voices
      .map((voice) => ({
        name: voice.name,
        languageCode: voice.lang,
        gender: 'NEUTRAL' as const, // Simplified since we don't show gender in UI
        displayName: voice.name,
        provider: 'browser' as const,
        quality: 'standard' as const,
      }));
  }

  // Top 10 natural voices by language with quality rankings
  private getTopNaturalVoices(): Record<string, string[]> {
    return {
      // English - Top natural voices
      en: [
        'alex',
        'samantha',
        'google uk english male',
        'google uk english female',
        'google us english male',
        'google us english female',
        'victoria',
        'allison',
        'ava',
        'susan',
        'daniel',
        'karen',
        'moira',
        'fiona',
      ],

      // Spanish - Top natural voices
      es: [
        'google español',
        'google español de estados unidos',
        'monica',
        'jorge',
        'diego',
        'paulina',
        'juan',
        'esperanza',
        'carlos',
        'rosa',
      ],

      // French - Top natural voices
      fr: [
        'google français',
        'amelie',
        'thomas',
        'aurelie',
        'marie',
        'pierre',
        'brigitte',
        'bernard',
        'claire',
        'sylvie',
      ],

      // Chinese - Top natural voices
      zh: [
        'google 中文',
        'google 中文（中国大陆）',
        'ting-ting',
        'sin-ji',
        'mei-jia',
        'yu-shu',
        'li-mu',
        'ya-ling',
        'xiao-bao',
        'xiao-rong',
      ],

      // Hindi - Top natural voices
      hi: [
        'google हिन्दी',
        'lekha',
        'sangeeta',
        'veena',
        'rishi',
        'kalpana',
        'hemant',
        'kavita',
        'arun',
        'shilpa',
      ],
    };
  }

  // Filter for top natural voices based on our curated list
  private isNaturalVoice(voiceName: string): boolean {
    const name = voiceName.toLowerCase().trim();

    // Get all top voices across languages
    const topVoices = this.getTopNaturalVoices();
    const allTopVoices = Object.values(topVoices).flat();

    // Check if this voice is in our top natural voices list
    const isTopVoice = allTopVoices.some((voiceName) => name.includes(voiceName.toLowerCase()));

    if (isTopVoice) {
      return true;
    }

    // Known robotic patterns to exclude
    const roboticPatterns = [
      'microsoft',
      'speechsynthesis',
      'robot',
      'synthetic',
      'computer',
      'artificial',
      'generated',
      'default',
      'basic',
      'standard',
      'system',
      'built-in',
      'espeak',
      'festival',
      'cereproc',
    ];

    // Exclude robotic voices
    if (roboticPatterns.some((pattern) => name.includes(pattern))) {
      return false;
    }

    // For any other voices, be conservative and exclude them
    // (Focus only on our curated top voices)
    return false;
  }

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  // Get sample text for a language
  getSampleText(languageCode: string): string {
    const sampleTexts: Record<string, string> = {
      en: 'Take a drink and enjoy the game.',
      es: 'Toma un trago y disfruta del juego.',
      fr: 'Prenez une boisson et profitez du jeu.',
      zh: '喝一杯，享受游戏。',
      hi: 'एक पेय लें और खेल का आनंद लें।',
    };

    const langCode = languageCode.split('-')[0];
    return sampleTexts[langCode] || sampleTexts.en;
  }
}
