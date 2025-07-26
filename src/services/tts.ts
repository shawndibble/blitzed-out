// Simple Text-to-Speech service using browser voices only
export interface VoiceOption {
  name: string;
  displayName: string;
}

// Curated high-quality voices by language
const QUALITY_VOICES: Record<string, string[]> = {
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

// Sample texts for different languages
const SAMPLE_TEXTS: Record<string, string> = {
  en: 'Take a drink and enjoy the game.',
  es: 'Toma un trago y disfruta del juego.',
  fr: 'Prenez une boisson et profitez du jeu.',
  zh: '喝一杯，享受游戏。',
  hi: 'एक पेय लें और खेल का आनंद लें।',
};

export class TTSService {
  // Get available voices for a language
  getAvailableVoices(languageCode?: string): VoiceOption[] {
    const browserVoices = window.speechSynthesis.getVoices();
    const langCode = languageCode?.split('-')[0] || 'en';
    const qualityVoiceNames = QUALITY_VOICES[langCode] || QUALITY_VOICES.en;

    return browserVoices
      .filter((voice) => {
        const name = voice.name.toLowerCase();
        return qualityVoiceNames.some((qualityName) => name.includes(qualityName.toLowerCase()));
      })
      .map((voice) => ({
        name: voice.name,
        displayName: voice.name,
      }));
  }

  // Get the best voice for a language
  getPreferredVoice(languageCode: string): string | null {
    const voices = this.getAvailableVoices(languageCode);
    return voices.length > 0 ? voices[0].name : null;
  }

  // Get sample text for a language
  getSampleText(languageCode: string): string {
    const langCode = languageCode.split('-')[0];
    return SAMPLE_TEXTS[langCode] || SAMPLE_TEXTS.en;
  }

  // Speak text with specified voice
  async speak(text: string, voiceName?: string, pitch: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;

      // Set voice if specified
      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech failed: ${event.error}`));

      window.speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech
  stop(): void {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
  }

  // Check if TTS is available
  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
}

// Singleton instance
export const tts = new TTSService();
