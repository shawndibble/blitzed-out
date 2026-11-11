import { KokoroTTS, TextSplitterStream } from 'kokoro-js';
import { webgpuUsable } from './gpuSupport';

// Kokoro ("HD" voices). Inference runs here so the UI thread never blocks while
// a line is generated.
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

type Scope = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
};
const scope = self as unknown as Scope;

// Insecure origins (plain http on a LAN IP) have no Cache API, and kokoro-js
// calls it unguarded to cache each voice file. An in-memory stand-in avoids a
// refetch per sentence and the warning; real caching resumes on https/localhost.
if (typeof caches === 'undefined') {
  const store = new Map<string, Response>();
  (self as unknown as { caches: unknown }).caches = {
    open: async () => ({
      match: async (url: RequestInfo | URL) => store.get(String(url))?.clone(),
      put: async (url: RequestInfo | URL, response: Response) => {
        store.set(String(url), response);
      },
    }),
  };
}

let modelPromise: Promise<KokoroTTS> | undefined;
let activeId = 0;

const status = (message: string): void => scope.postMessage({ type: 'status', message });

// Passing a bare string leaves kokoro's splitter open, so the last sentence
// is never emitted; closing it flushes the remaining text.
const sentencesOf = (text: string): TextSplitterStream => {
  const splitter = new TextSplitterStream();
  splitter.push(text);
  splitter.close();
  return splitter;
};

const peakOf = (samples: Float32Array): number =>
  samples.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0);

// The first inference pays one-time runtime/phonemizer setup, and it is also
// the cheapest proof the chosen backend can actually run the model. A backend
// can run without error yet emit silence, NaN or huge garbage values
// (Firefox's WebGPU gave peaks in the billions); real speech peaks below ~1.
const warmUp = async (model: KokoroTTS): Promise<void> => {
  let peak = 0;
  for await (const chunk of model.stream(sentencesOf('Ready.'), { voice: 'am_michael' })) {
    peak = Math.max(peak, peakOf(chunk.audio.audio));
  }
  if (!(peak > 0.001 && peak <= 2)) throw new Error(`model produced invalid audio (peak ${peak})`);
};

const withTimeout = <T>(work: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`no result after ${ms}ms`)), ms)
    ),
  ]);

// Shader compilation makes the first WebGPU run slow (~15s seen on Firefox).
const WEBGPU_WARMUP_TIMEOUT_MS = 60_000;

const loadModel = (): Promise<KokoroTTS> => {
  modelPromise ??= (async () => {
    scope.postMessage({ type: 'setup' });
    if (await webgpuUsable()) {
      try {
        status('loading model (webgpu fp32)');
        // WebGPU needs fp32 (q8 is only fast on WASM); the larger download is cached.
        const model = await KokoroTTS.from_pretrained(MODEL_ID, {
          dtype: 'fp32',
          device: 'webgpu',
        });
        const startedAt = performance.now();
        await withTimeout(warmUp(model), WEBGPU_WARMUP_TIMEOUT_MS);
        status(`webgpu warm-up done in ${Math.round(performance.now() - startedAt)}ms`);
        scope.postMessage({ type: 'ready' });
        return model;
      } catch (error) {
        status(`webgpu unusable (${error}), using wasm q8`);
      }
    }
    status('loading model (wasm q8)');
    const model = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'wasm' });
    const startedAt = performance.now();
    await warmUp(model);
    status(`wasm warm-up done in ${Math.round(performance.now() - startedAt)}ms`);
    scope.postMessage({ type: 'ready' });
    return model;
  })().catch((error) => {
    modelPromise = undefined; // allow retry after a network failure
    throw error;
  });
  return modelPromise;
};

type VoiceId = NonNullable<NonNullable<Parameters<KokoroTTS['stream']>[1]>['voice']>;

type Request =
  | { type: 'load'; voice?: string }
  | { type: 'speak'; id: number; text: string; voice: string }
  | { type: 'cancel'; id: number };

const reportError = (id: number | undefined, error: unknown): void =>
  scope.postMessage({
    type: 'error',
    id,
    message: error instanceof Error ? error.message : String(error),
  });

scope.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  if (request.type === 'cancel') {
    activeId = request.id;
    return;
  }
  if (request.type === 'load') {
    try {
      await loadModel();
      status('model ready');
    } catch (error) {
      reportError(undefined, error);
    }
    return;
  }

  activeId = request.id;
  try {
    const model = await loadModel();
    status('generating');
    scope.postMessage({ type: 'generating' });
    // Sentence-by-sentence so playback starts after the first sentence.
    const startedAt = performance.now();
    for await (const chunk of model.stream(sentencesOf(request.text), {
      voice: request.voice as VoiceId,
    })) {
      if (activeId !== request.id) return; // cancelled or superseded
      const samples = chunk.audio.audio;
      status(
        `sentence ready after ${Math.round(performance.now() - startedAt)}ms, peak ${peakOf(samples).toFixed(3)}`
      );
      scope.postMessage(
        { type: 'chunk', id: request.id, samples, rate: chunk.audio.sampling_rate },
        [samples.buffer]
      );
    }
    if (activeId === request.id) scope.postMessage({ type: 'done', id: request.id });
  } catch (error) {
    reportError(request.id, error);
  }
};
