import { TtsSession } from '@mintplex-labs/piper-tts-web';
import * as ort from 'onnxruntime-web/wasm';

// Piper (MIT) runs in this worker so inference never blocks the UI thread.
type Scope = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
};
const scope = self as unknown as Scope;

// The package's default runtime URL is an old onnxruntime build that no
// longer exists; the runtime files must match the version bundled here.
const WASM_PATHS = {
  ...TtsSession.WASM_LOCATIONS,
  onnxWasm: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`,
};

// The package always synthesizes speaker 0. Multi-speaker models take a `sid`
// input, so swap in the speaker the current request asked for.
let speakerId = 0;
// The typings expose InferenceSession as a factory; at runtime it is a class.
const sessionPrototype = (
  ort.InferenceSession as unknown as {
    prototype: { run: (feeds: Record<string, unknown>, ...rest: unknown[]) => unknown };
  }
).prototype;
const originalRun = sessionPrototype.run;
sessionPrototype.run = function (this: unknown, feeds, ...rest) {
  const patched =
    'sid' in feeds
      ? { ...feeds, sid: new ort.Tensor('int64', BigInt64Array.from([BigInt(speakerId)])) }
      : feeds;
  return originalRun.call(this, patched, ...rest);
};

// Voice ids are `<model>` or `<model>#<speaker index>`.
const parseVoice = (voice: string): { modelId: string; speaker: number } => {
  const [modelId, speaker] = voice.split('#');
  return { modelId, speaker: Number(speaker ?? 0) };
};

const status = (message: string): void => scope.postMessage({ type: 'status', message });

// Only the latest voice stays loaded; each model is tens of MB of memory.
let loaded: { voiceId: string; session: Promise<TtsSession> } | undefined;
let activeId = 0;

const loadSession = (voiceId: string): Promise<TtsSession> => {
  if (loaded?.voiceId === voiceId) return loaded.session;
  status(`loading piper voice ${voiceId}`);
  scope.postMessage({ type: 'setup' });
  // The package keeps one global session and silently reuses it for any voice.
  TtsSession._instance = null;
  const startedAt = performance.now();
  const session = TtsSession.create({ voiceId, wasmPaths: WASM_PATHS }).then(async (created) => {
    // First inference pays one-time setup; do it now rather than on the first line.
    await created.predict('Ready.');
    status(`piper ready in ${Math.round(performance.now() - startedAt)}ms`);
    scope.postMessage({ type: 'ready' });
    return created;
  });
  loaded = { voiceId, session };
  session.catch(() => {
    if (loaded?.session === session) loaded = undefined; // allow retry
  });
  return session;
};

// Sentence-by-sentence so playback starts after the first sentence.
const sentencesOf = (text: string): string[] =>
  (text.match(/[^.!?…\n]+[.!?…]*\s*/g) ?? [text]).map((s) => s.trim()).filter(Boolean);

const decodeWav = async (wav: Blob): Promise<{ samples: Float32Array; rate: number }> => {
  const view = new DataView(await wav.arrayBuffer());
  const headerBytes = 44; // fixed 16-bit mono PCM header written by the package
  const samples = new Float32Array((view.byteLength - headerBytes) / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(headerBytes + i * 2, true) / 32768;
  }
  return { samples, rate: view.getUint32(24, true) };
};

const reportError = (id: number | undefined, error: unknown): void =>
  scope.postMessage({
    type: 'error',
    id,
    message: error instanceof Error ? error.message : String(error),
  });

type Request =
  | { type: 'load'; voice: string }
  | { type: 'speak'; id: number; text: string; voice: string }
  | { type: 'cancel'; id: number };

scope.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  if (request.type === 'cancel') {
    activeId = request.id;
    return;
  }
  if (request.type === 'load') {
    try {
      await loadSession(parseVoice(request.voice).modelId);
    } catch (error) {
      reportError(undefined, error);
    }
    return;
  }

  activeId = request.id;
  try {
    const { modelId, speaker } = parseVoice(request.voice);
    const session = await loadSession(modelId);
    speakerId = speaker;
    scope.postMessage({ type: 'generating' });
    const startedAt = performance.now();
    for (const sentence of sentencesOf(request.text)) {
      if (activeId !== request.id) return; // cancelled or superseded
      const { samples, rate } = await decodeWav(await session.predict(sentence));
      if (activeId !== request.id) return;
      status(`sentence ready after ${Math.round(performance.now() - startedAt)}ms`);
      scope.postMessage({ type: 'chunk', id: request.id, samples, rate }, [samples.buffer]);
    }
    if (activeId === request.id) scope.postMessage({ type: 'done', id: request.id });
  } catch (error) {
    reportError(request.id, error);
  }
};
