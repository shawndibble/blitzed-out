// Simple Text-to-Speech service using browser voices only
export interface VoiceOption {
  name: string;
  displayName: string;
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
    }));
  }

  // Get the first available voice (async version)
  async getPreferredVoiceAsync(): Promise<string | null> {
    const voices = await this.getAvailableVoicesAsync();
    return voices.length > 0 ? voices[0].name : null;
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
