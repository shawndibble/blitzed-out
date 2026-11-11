// Simple Text-to-Speech service using browser voices only
import { logger } from '@/utils/logger';
import { languages } from './i18nHelpers';
import { type SpeechStage, speakNeural, stopNeural } from './neuralTts';
import { isNeuralVoice } from './neuralVoices';

export interface VoiceOption {
  name: string;
  displayName: string;
  lang: string;
}

export class TTSService {
  private voiceLoadPromise?: Promise<SpeechSynthesisVoice[]>;

  // Wait for voices to be loaded
  private async waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voiceLoadPromise) {
      return this.voiceLoadPromise;
    }

    this.voiceLoadPromise = new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();

      // If voices are already loaded, return them immediately
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Otherwise, wait for the voiceschanged event
      const handleVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve(voices);
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // Fallback timeout - resolve with whatever we have after 3 seconds
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      }, 3000);
    });

    return this.voiceLoadPromise;
  }

  // Get all available voices (simplified to show all browser voices)
  async getAvailableVoicesAsync(): Promise<VoiceOption[]> {
    const browserVoices = await this.waitForVoices();

    return browserVoices.map((voice) => ({
      name: voice.name,
      displayName: `${voice.name} (${voice.lang})`,
      lang: voice.lang,
    }));
  }

  // Best-matching voice for a locale (e.g. i18n's active language), falling
  // back to the first available voice when there's no hint or no match.
  async getPreferredVoiceAsync(localeHint?: string): Promise<string | null> {
    const voices = await this.getAvailableVoicesAsync();
    if (voices.length === 0) return null;

    if (localeHint) {
      const exactName = languages[localeHint]?.voice;
      const exactMatch = exactName && voices.find((voice) => voice.name === exactName);
      if (exactMatch) return exactMatch.name;

      const byLang = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith(localeHint.toLowerCase())
      );
      if (byLang.length > 0) {
        const google = byLang.find((voice) => voice.name.includes('Google'));
        return (google ?? byLang[0]).name;
      }
    }

    return voices[0].name;
  }

  // Speak text with specified voice
  async speak(
    text: string,
    voiceName?: string,
    pitch: number = 0,
    onStage?: (stage: SpeechStage) => void
  ): Promise<void> {
    if (isNeuralVoice(voiceName)) {
      try {
        return await speakNeural(text, voiceName, pitch, onStage);
      } catch (error) {
        logger.error('Neural TTS failed, using browser voice:', error);
        return this.speak(text, undefined, pitch);
      }
    }

    return new Promise((resolve, reject) => {
      onStage?.('playing');
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
    stopNeural();
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
