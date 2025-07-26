import { ttsManager } from './ttsManager';

export default async function speak(
  message: string,
  language: string,
  voicePreference?: string
): Promise<void> {
  try {
    // Use the new TTS manager which handles Google Cloud TTS + fallback
    await ttsManager.synthesizeSpeech(message, {
      voice: voicePreference,
      languageCode: language,
      pitch: -2.0, // Lower pitch for deeper voice (Google Cloud range: -20.0 to 20.0)
      rate: 1.0,
    });
  } catch (error) {
    console.error('TTS failed:', error);
    // Don't throw - just log the error to maintain backward compatibility
  }
}
