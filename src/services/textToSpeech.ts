import { logger } from '@/utils/logger';
import { tts } from './tts';

export default async function speak(
  message: string,
  voicePreference?: string,
  pitch: number = 1.0
): Promise<void> {
  try {
    await tts.speak(message, voicePreference, pitch);
  } catch (error) {
    logger.error('TTS failed:', error);
    // Don't throw - just log the error to maintain backward compatibility
  }
}
