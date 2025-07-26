export interface TTSVoice {
  name: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  displayName: string;
  provider: 'google' | 'browser';
  quality: 'standard' | 'wavenet' | 'neural2';
}

export interface TTSOptions {
  voice?: string;
  languageCode?: string;
  rate?: number;
  pitch?: number;
  volumeGainDb?: number;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
}

export interface TTSResponse {
  audioContent: ArrayBuffer;
  audioUrl: string;
  cleanup: () => void;
}

export interface TTSService {
  synthesizeSpeech(text: string, options?: TTSOptions): Promise<TTSResponse>;
  getAvailableVoices(languageCode?: string): Promise<TTSVoice[]>;
  isAvailable(): boolean;
}
