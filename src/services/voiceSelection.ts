import { languages } from './i18nHelpers';

export interface VoiceOption {
  name: string;
  label: string;
  language: string;
  gender?: 'male' | 'female' | 'unknown';
}

// Get available voices from browser
export function getAvailableVoices(): VoiceOption[] {
  const voices = window.speechSynthesis.getVoices();

  return voices.map((voice) => ({
    name: voice.name,
    label: voice.name,
    language: voice.lang,
    gender: detectGender(voice.name),
  }));
}

// Detect likely gender from voice name patterns
function detectGender(voiceName: string): 'male' | 'female' | 'unknown' {
  const name = voiceName.toLowerCase();

  // Male voice patterns
  const malePatterns = [
    'male',
    'man',
    'david',
    'mark',
    'george',
    'daniel',
    'alex',
    'tom',
    'john',
    'matthew',
    'paul',
    'robert',
    'michel',
    'thomas',
    'pierre',
    'carlos',
    'antonio',
    'masculine',
    'deep',
    'baritone',
  ];

  // Female voice patterns
  const femalePatterns = [
    'female',
    'woman',
    'susan',
    'anna',
    'karen',
    'sarah',
    'marie',
    'julie',
    'samantha',
    'victoria',
    'zoe',
    'kate',
    'alice',
    'emma',
    'sophia',
    'maria',
    'feminine',
    'soprano',
    'alto',
  ];

  if (malePatterns.some((pattern) => name.includes(pattern))) {
    return 'male';
  }

  if (femalePatterns.some((pattern) => name.includes(pattern))) {
    return 'female';
  }

  return 'unknown';
}

// Get preferred voices for a language, prioritizing male voices
export function getPreferredVoicesForLanguage(language: string): VoiceOption[] {
  const allVoices = getAvailableVoices();
  const languageCode = language.split('-')[0]; // e.g., 'en' from 'en-US'

  // Filter voices by language
  const languageVoices = allVoices.filter((voice) =>
    voice.language.toLowerCase().startsWith(languageCode.toLowerCase())
  );

  // Sort by preference: male first, then female, then unknown
  const genderPriority = { male: 0, female: 1, unknown: 2 };

  return languageVoices.sort((a, b) => {
    const aPriority = genderPriority[a.gender || 'unknown'];
    const bPriority = genderPriority[b.gender || 'unknown'];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same gender, sort alphabetically
    return a.label.localeCompare(b.label);
  });
}

// Get default voice for language (maintains backward compatibility)
export function getDefaultVoiceForLanguage(language: string): string | null {
  // First try the voice specified in languages config
  const configuredVoice = languages[language]?.voice;
  if (configuredVoice) {
    const voices = getAvailableVoices();
    const found = voices.find((v) => v.name === configuredVoice);
    if (found) {
      return configuredVoice;
    }
  }

  // Fall back to preferred voice for language
  const preferredVoices = getPreferredVoicesForLanguage(language);
  return preferredVoices.length > 0 ? preferredVoices[0].name : null;
}

// Play sample text with selected voice
export function playSampleWithVoice(voiceName: string, language: string): void {
  const sampleTexts: Record<string, string> = {
    en: 'Take a drink and enjoy the game.',
    es: 'Toma un trago y disfruta del juego.',
    fr: 'Prenez une boisson et profitez du jeu.',
    zh: '喝一杯，享受游戏。',
    hi: 'एक पेय लें और खेल का आनंद लें।',
  };

  const languageCode = language.split('-')[0];
  const sampleText = sampleTexts[languageCode] || sampleTexts.en;

  const utterance = new SpeechSynthesisUtterance();
  utterance.text = sampleText;
  utterance.pitch = 0.5; // Match the pitch from main TTS service

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.name === voiceName);

  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

// Wait for voices to be loaded
export function waitForVoices(): Promise<VoiceOption[]> {
  return new Promise((resolve) => {
    const voices = getAvailableVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const handleVoicesChanged = () => {
      const updatedVoices = getAvailableVoices();
      if (updatedVoices.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(updatedVoices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  });
}
