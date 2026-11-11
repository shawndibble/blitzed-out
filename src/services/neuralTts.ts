import { logger } from '@/utils/logger';
import { type VoiceEngine, engineOf, voiceIdOf } from './neuralVoices';

// Each engine runs in its own worker so only the one in use is downloaded.
// Playback is shared: workers stream sentence-sized audio chunks back, and they
// are queued on one AudioContext so speech starts after the first sentence.
const workers: Partial<Record<VoiceEngine, Worker>> = {};
let audioContext: AudioContext | undefined;
let requestId = 0;
// Engines whose model is still being set up (first use of a voice).
const loading = new Set<VoiceEngine>();

export type SpeechStage = 'setup' | 'generating' | 'playing';

let playback:
  | {
      id: number;
      engine: VoiceEngine;
      nextStart: number;
      pitch: number;
      sources: AudioBufferSourceNode[];
      onStage?: (stage: SpeechStage) => void;
      started: boolean;
    }
  | undefined;
let settle: { resolve: () => void; reject: (error: Error) => void } | undefined;

type WorkerEvent =
  | { type: 'setup' }
  | { type: 'ready' }
  | { type: 'generating' }
  | { type: 'status'; message: string }
  | { type: 'chunk'; id: number; samples: Float32Array; rate: number }
  | { type: 'done'; id: number }
  | { type: 'error'; id?: number; message: string };

const finish = (error?: Error): void => {
  const pending = settle;
  settle = undefined;
  if (error) pending?.reject(error);
  else pending?.resolve();
};

const schedule = (samples: Float32Array, rate: number): void => {
  if (!audioContext || !playback) return;
  const buffer = audioContext.createBuffer(1, samples.length, rate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  const start = Math.max(playback.nextStart, audioContext.currentTime);
  // Resampling shifts pitch and speed together (lower = slower), unlike Web Speech.
  source.playbackRate.value = playback.pitch;
  source.start(start);
  playback.nextStart = start + buffer.duration / playback.pitch;
  playback.sources.push(source);
};

const handleMessage = (engine: VoiceEngine, event: MessageEvent<WorkerEvent>): void => {
  const message = event.data;
  const own = playback?.engine === engine ? playback : undefined;
  switch (message.type) {
    case 'status':
      logger.info('Neural TTS:', message.message);
      return;
    case 'setup':
      loading.add(engine);
      own?.onStage?.('setup');
      return;
    case 'ready':
      loading.delete(engine);
      return;
    case 'generating':
      own?.onStage?.('generating');
      return;
    case 'error':
      loading.delete(engine);
      logger.error('Neural TTS failed:', message.message);
      if (message.id === undefined || message.id === playback?.id) {
        finish(new Error(message.message));
      }
      return;
  }
  if (message.id !== playback?.id) return;
  if (message.type === 'chunk') {
    if (!playback.started) {
      playback.started = true;
      playback.onStage?.('playing');
    }
    schedule(message.samples, message.rate);
    return;
  }
  const last = playback.sources.at(-1);
  if (last) last.onended = () => finish();
  else finish();
};

const createWorker = (engine: VoiceEngine): Worker =>
  engine === 'piper'
    ? new Worker(new URL('./piperTts.worker.ts', import.meta.url), { type: 'module' })
    : new Worker(new URL('./neuralTts.worker.ts', import.meta.url), { type: 'module' });

const getWorker = (engine: VoiceEngine): Worker => {
  let worker = workers[engine];
  if (!worker) {
    worker = createWorker(engine);
    worker.onmessage = (event: MessageEvent<WorkerEvent>) => handleMessage(engine, event);
    worker.onerror = (event) => {
      logger.error('Neural TTS worker failed:', event.message, event.filename, event.lineno);
      delete workers[engine]; // next attempt starts a fresh worker
      loading.delete(engine);
      finish(new Error(event.message || 'Neural TTS worker failed to load'));
    };
    workers[engine] = worker;
  }
  return worker;
};

// Starts the model download/init early so the first spoken line is not delayed.
export function preloadNeural(voiceName: string): void {
  const engine = engineOf(voiceName);
  if (engine) getWorker(engine).postMessage({ type: 'load', voice: voiceIdOf(voiceName, engine) });
}

export function stopNeural(): void {
  requestId += 1; // invalidates any generation still in flight
  Object.values(workers).forEach((worker) => worker.postMessage({ type: 'cancel', id: requestId }));
  playback?.sources.forEach((source) => {
    source.onended = null;
    try {
      source.stop();
    } catch {
      // never started
    }
  });
  playback = undefined;
  finish();
}

export async function speakNeural(
  text: string,
  voiceName: string,
  pitch: number = 1,
  onStage?: (stage: SpeechStage) => void
): Promise<void> {
  const engine = engineOf(voiceName);
  if (!engine) throw new Error(`Not a neural voice: ${voiceName}`);
  stopNeural();
  const id = requestId;
  audioContext ??= new AudioContext();
  await audioContext.resume(); // must happen inside the user's click gesture
  playback = {
    id,
    engine,
    onStage,
    started: false,
    nextStart: 0,
    // Callers use 0 for "unset"; keep the shift in a range that stays intelligible.
    pitch: pitch > 0 ? Math.min(2, Math.max(0.5, pitch)) : 1,
    sources: [],
  };
  // A preload may already be mid-setup, so its 'setup' message came before we listened.
  if (loading.has(engine)) onStage?.('setup');
  return new Promise<void>((resolve, reject) => {
    settle = { resolve, reject };
    getWorker(engine).postMessage({
      type: 'speak',
      id,
      text,
      voice: voiceIdOf(voiceName, engine),
    });
  });
}
