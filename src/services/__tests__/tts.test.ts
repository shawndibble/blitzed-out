import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TTSService } from '../tts';

function mockVoice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang } as SpeechSynthesisVoice;
}

function mockSpeechSynthesis(voices: SpeechSynthesisVoice[]): void {
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    getVoices: () => voices,
    addEventListener: () => {},
    removeEventListener: () => {},
    speak: () => {},
    cancel: () => {},
  };
}

describe('TTSService.getPreferredVoiceAsync', () => {
  let tts: TTSService;

  beforeEach(() => {
    tts = new TTSService();
  });

  it('returns null when no voices are available', async () => {
    mockSpeechSynthesis([]);
    expect(await tts.getPreferredVoiceAsync('en')).toBeNull();
  });

  it('falls back to the first voice when there is no locale hint', async () => {
    mockSpeechSynthesis([mockVoice('Some Voice', 'fr-FR'), mockVoice('Other Voice', 'en-US')]);
    expect(await tts.getPreferredVoiceAsync()).toBe('Some Voice');
  });

  it('prefers the exact voice name mapped for the locale', async () => {
    mockSpeechSynthesis([
      mockVoice('Google français', 'fr-FR'),
      mockVoice('Some Other French Voice', 'fr-CA'),
    ]);
    expect(await tts.getPreferredVoiceAsync('fr')).toBe('Google français');
  });

  it('falls back to a lang-prefix match when the exact mapped voice is absent', async () => {
    mockSpeechSynthesis([mockVoice('Some Other French Voice', 'fr-CA'), mockVoice('En', 'en-US')]);
    expect(await tts.getPreferredVoiceAsync('fr')).toBe('Some Other French Voice');
  });

  it('prefers a Google voice among lang-prefix matches', async () => {
    mockSpeechSynthesis([
      mockVoice('Regular French Voice', 'fr-CA'),
      mockVoice('Google français (Canada)', 'fr-CA'),
    ]);
    expect(await tts.getPreferredVoiceAsync('fr')).toBe('Google français (Canada)');
  });

  it('falls back to the first voice when the locale has no matches at all', async () => {
    mockSpeechSynthesis([mockVoice('English Voice', 'en-US')]);
    expect(await tts.getPreferredVoiceAsync('ja')).toBe('English Voice');
  });
});

describe('TTSService neural voices', () => {
  it.each(['kokoro:am_michael', 'piper:en_US-ryan-medium'])(
    'routes %s to the neural engine instead of speechSynthesis',
    async (voice) => {
      vi.resetModules();
      const speakNeural = vi.fn().mockResolvedValue(undefined);
      vi.doMock('../neuralTts', async (importOriginal) => ({
        ...(await importOriginal<typeof import('../neuralTts')>()),
        speakNeural,
      }));
      const { TTSService: Service } = await import('../tts');
      const speakSpy = vi.fn();
      (window as unknown as { speechSynthesis: unknown }).speechSynthesis = { speak: speakSpy };

      await new Service().speak('hello', voice);

      expect(speakNeural).toHaveBeenCalledWith('hello', voice, 0, undefined);
      expect(speakSpy).not.toHaveBeenCalled();
      vi.doUnmock('../neuralTts');
    }
  );
});
