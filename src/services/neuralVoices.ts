// Curated catalog of the in-browser neural voices. Piper ("Fast") runs well on
// any CPU; Kokoro ("HD") sounds richer but is only quick with a working GPU.
// Only single-speaker Piper models are listed because the runtime cannot pick a
// speaker inside a shared model. Gender and accent follow each voice's model
// card; a voice is left out rather than guessed when the card is unclear.
export type VoiceEngine = 'piper' | 'kokoro';
export type VoiceGender = 'male' | 'female';

export interface NeuralVoice {
  engine: VoiceEngine;
  /** Engine's own id, e.g. `en_US-ryan-medium` or `am_michael`. */
  id: string;
  name: string;
  /** App locale family (`en`, `es`, ...). */
  language: string;
  /** ISO region the accent belongs to (`US`, `GB`, ...). */
  region: string;
  gender: VoiceGender;
  /** Finer accent than the region, when the model card states one. */
  accent?: 'scottish' | 'northernEnglish';
  /** Set for a non-native speaker: their first language (ISO 639-1) shapes the accent. */
  nativeLanguage?: string;
}

export const ENGINE_PREFIX: Record<VoiceEngine, string> = { piper: 'piper:', kokoro: 'kokoro:' };

const piper = (
  id: string,
  name: string,
  language: string,
  region: string,
  gender: VoiceGender,
  accent?: NeuralVoice['accent']
): NeuralVoice => ({ engine: 'piper', id, name, language, region, gender, accent });

// English model trained on non-native speakers (L2-ARCTIC corpus). It is shared by
// several speakers, so the id carries the speaker index after `#`.
const L2_MODEL = 'en_US-l2arctic-medium';
const l2 = (
  speaker: number,
  code: string,
  nativeLanguage: string,
  gender: VoiceGender
): NeuralVoice => ({
  engine: 'piper',
  id: `${L2_MODEL}#${speaker}`,
  name: code,
  language: 'en',
  region: 'US',
  gender,
  nativeLanguage,
});

const kokoro = (id: string, name: string): NeuralVoice => ({
  engine: 'kokoro',
  id,
  name,
  language: 'en',
  region: id.startsWith('b') ? 'GB' : 'US',
  gender: id[1] === 'm' ? 'male' : 'female',
});

export const NEURAL_VOICES: readonly NeuralVoice[] = [
  piper('en_US-ryan-medium', 'Ryan', 'en', 'US', 'male'),
  piper('en_US-joe-medium', 'Joe', 'en', 'US', 'male'),
  piper('en_US-john-medium', 'John', 'en', 'US', 'male'),
  piper('en_US-bryce-medium', 'Bryce', 'en', 'US', 'male'),
  piper('en_US-norman-medium', 'Norman', 'en', 'US', 'male'),
  piper('en_US-kusal-medium', 'Kusal', 'en', 'US', 'male'),
  piper('en_US-hfc_male-medium', 'HFC', 'en', 'US', 'male'),
  piper('en_US-amy-medium', 'Amy', 'en', 'US', 'female'),
  piper('en_US-kristin-medium', 'Kristin', 'en', 'US', 'female'),
  piper('en_US-lessac-medium', 'Lessac', 'en', 'US', 'female'),
  piper('en_US-ljspeech-medium', 'LJ', 'en', 'US', 'female'),
  piper('en_US-hfc_female-medium', 'HFC', 'en', 'US', 'female'),
  piper('en_GB-alan-medium', 'Alan', 'en', 'GB', 'male'),
  piper('en_GB-northern_english_male-medium', 'Northern', 'en', 'GB', 'male', 'northernEnglish'),
  piper('en_GB-alba-medium', 'Alba', 'en', 'GB', 'female', 'scottish'),
  piper('en_GB-cori-medium', 'Cori', 'en', 'GB', 'female'),
  piper('en_GB-jenny_dioco-medium', 'Jenny', 'en', 'GB', 'female'),
  piper('es_ES-davefx-medium', 'Davefx', 'es', 'ES', 'male'),
  piper('es_MX-ald-medium', 'Ald', 'es', 'MX', 'male'),
  piper('fr_FR-tom-medium', 'Tom', 'fr', 'FR', 'male'),
  piper('fr_FR-siwis-medium', 'Siwis', 'fr', 'FR', 'female'),
  piper('de_DE-thorsten-medium', 'Thorsten', 'de', 'DE', 'male'),
  piper('de_DE-karlsson-low', 'Karlsson', 'de', 'DE', 'male'),
  piper('de_DE-kerstin-low', 'Kerstin', 'de', 'DE', 'female'),
  piper('de_DE-ramona-low', 'Ramona', 'de', 'DE', 'female'),
  piper('zh_CN-huayan-medium', 'Huayan', 'zh', 'CN', 'female'),
  l2(22, 'EBVS', 'es', 'male'),
  l2(6, 'ERMS', 'es', 'male'),
  l2(7, 'MBMPS', 'es', 'female'),
  l2(17, 'NJS', 'es', 'female'),
  l2(10, 'ASI', 'hi', 'male'),
  l2(2, 'SVBI', 'hi', 'female'),
  l2(21, 'ABA', 'ar', 'male'),
  l2(23, 'SKA', 'ar', 'female'),
  l2(20, 'BWC', 'zh', 'male'),
  l2(12, 'LXC', 'zh', 'female'),
  l2(16, 'HKK', 'ko', 'male'),
  l2(11, 'HJK', 'ko', 'female'),
  l2(8, 'HQTV', 'vi', 'male'),
  l2(4, 'PNV', 'vi', 'female'),
  kokoro('am_michael', 'Michael'),
  kokoro('am_adam', 'Adam'),
  kokoro('am_onyx', 'Onyx'),
  kokoro('am_fenrir', 'Fenrir'),
  kokoro('am_eric', 'Eric'),
  kokoro('am_liam', 'Liam'),
  kokoro('am_echo', 'Echo'),
  kokoro('am_puck', 'Puck'),
  kokoro('af_heart', 'Heart'),
  kokoro('af_bella', 'Bella'),
  kokoro('af_nicole', 'Nicole'),
  kokoro('af_sarah', 'Sarah'),
  kokoro('af_sky', 'Sky'),
  kokoro('af_nova', 'Nova'),
  kokoro('af_river', 'River'),
  kokoro('af_kore', 'Kore'),
  kokoro('af_alloy', 'Alloy'),
  kokoro('af_aoede', 'Aoede'),
  kokoro('af_jessica', 'Jessica'),
  kokoro('bm_george', 'George'),
  kokoro('bm_lewis', 'Lewis'),
  kokoro('bm_daniel', 'Daniel'),
  kokoro('bm_fable', 'Fable'),
  kokoro('bf_emma', 'Emma'),
  kokoro('bf_isabella', 'Isabella'),
  kokoro('bf_alice', 'Alice'),
  kokoro('bf_lily', 'Lily'),
];

export const toVoiceName = (voice: NeuralVoice): string =>
  `${ENGINE_PREFIX[voice.engine]}${voice.id}`;

export const engineOf = (name?: string): VoiceEngine | undefined =>
  (Object.keys(ENGINE_PREFIX) as VoiceEngine[]).find((engine) =>
    name?.startsWith(ENGINE_PREFIX[engine])
  );

export const isNeuralVoice = (name?: string): name is string => engineOf(name) !== undefined;

export const voiceIdOf = (name: string, engine: VoiceEngine): string =>
  name.slice(ENGINE_PREFIX[engine].length);

export const findNeuralVoice = (voiceName?: string): NeuralVoice | undefined =>
  NEURAL_VOICES.find((voice) => toVoiceName(voice) === voiceName);

export const neuralVoicesFor = (language: string): NeuralVoice[] =>
  NEURAL_VOICES.filter((voice) => voice.language === language);

/** Best starting voice for a language: a Fast male voice first, then whatever is listed. */
export const defaultNeuralVoice = (language: string): NeuralVoice | undefined => {
  const voices = neuralVoicesFor(language);
  return voices.find((voice) => voice.engine === 'piper' && voice.gender === 'male') ?? voices[0];
};

/** What the accent picker groups by: a non-native speaker's first language, else the region. */
export const accentOf = (voice: NeuralVoice): string =>
  voice.nativeLanguage ? `l2:${voice.nativeLanguage}` : voice.region;
