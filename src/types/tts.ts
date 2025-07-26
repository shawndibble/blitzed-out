export interface TTSVoice {
  name: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  displayName: string;
  provider: 'browser';
  quality: 'standard';
}

export interface TTSOptions {
  voice?: string;
  languageCode?: string;
  rate?: number;
  pitch?: number;
}

export interface TTSResponse {
  // Simplified for browser-only TTS - just an empty object
  [key: string]: never;
}

export interface TTSService {
  synthesizeSpeech(text: string, options?: TTSOptions): Promise<TTSResponse>;
  getAvailableVoices(languageCode?: string): Promise<TTSVoice[]>;
  isAvailable(): boolean;
}
