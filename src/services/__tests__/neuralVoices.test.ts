import { describe, expect, it } from 'vitest';
import {
  NEURAL_VOICES,
  accentOf,
  defaultNeuralVoice,
  findNeuralVoice,
  isNeuralVoice,
  neuralVoicesFor,
  toVoiceName,
} from '../neuralVoices';

describe('neural voice catalog', () => {
  it('has unique voice names', () => {
    const names = NEURAL_VOICES.map(toVoiceName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('round-trips every voice through its stored name', () => {
    for (const voice of NEURAL_VOICES) {
      const name = toVoiceName(voice);
      expect(isNeuralVoice(name)).toBe(true);
      expect(findNeuralVoice(name)).toBe(voice);
    }
  });

  it('does not treat browser voices as neural', () => {
    expect(isNeuralVoice('Google US English')).toBe(false);
    expect(findNeuralVoice('Google US English')).toBeUndefined();
  });

  it('offers male and female English voices in both accents', () => {
    const english = neuralVoicesFor('en');
    for (const region of ['US', 'GB']) {
      for (const gender of ['male', 'female']) {
        expect(english.some((v) => v.region === region && v.gender === gender)).toBe(true);
      }
    }
  });

  it('defaults to a Fast male voice', () => {
    expect(defaultNeuralVoice('en')).toMatchObject({ engine: 'piper', gender: 'male' });
    expect(defaultNeuralVoice('hi')).toBeUndefined();
  });

  it('offers a Spanish-accented English male voice', () => {
    const voice = neuralVoicesFor('en').find(
      (v) => v.nativeLanguage === 'es' && v.gender === 'male'
    );
    expect(voice).toBeDefined();
    expect(accentOf(voice!)).toBe('l2:es');
    expect(voice!.id).toMatch(/^en_US-l2arctic-medium#\d+$/);
  });

  it('gives every accented speaker a distinct speaker index', () => {
    const speakers = NEURAL_VOICES.filter((v) => v.nativeLanguage).map((v) => v.id);
    expect(new Set(speakers).size).toBe(speakers.length);
  });
});
