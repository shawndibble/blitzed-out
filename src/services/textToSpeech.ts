import { tts } from './tts';

export default async function speak(message: string, voicePreference?: string): Promise<void> {
  try {
    await tts.speak(message, voicePreference, -2.0);
  } catch (error) {
    console.error('TTS failed:', error);
    // Don't throw - just log the error to maintain backward compatibility
  }
}
