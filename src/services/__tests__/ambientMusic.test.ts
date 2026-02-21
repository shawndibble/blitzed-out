import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAudioContext = {
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  createGain: vi.fn(),
  createBufferSource: vi.fn(),
  decodeAudioData: vi.fn(),
  destination: {},
};

const mockGainNode = {
  gain: { value: 1 },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockSourceNode = {
  buffer: null,
  loop: false,
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('@/utils/audioContext', () => ({
  getAudioContext: vi.fn(() => mockAudioContext),
  unlockAudioContext: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      ambientMusicEnabled: false,
      ambientSoundscape: 'lounge',
      ambientVolume: 0.3,
    },
    updateSettings: vi.fn(),
  })),
}));

describe('AmbientMusicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.createBufferSource.mockReturnValue(mockSourceNode);
    mockAudioContext.decodeAudioData.mockResolvedValue({ duration: 30 });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should export ambientMusic singleton', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(ambientMusic).toBeDefined();
  });

  it('should have play method', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(typeof ambientMusic.play).toBe('function');
  });

  it('should have stop method', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(typeof ambientMusic.stop).toBe('function');
  });

  it('should have setVolume method', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(typeof ambientMusic.setVolume).toBe('function');
  });

  it('should have getIsPlaying method', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(typeof ambientMusic.getIsPlaying).toBe('function');
  });

  it('should have getCurrentSoundscape method', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(typeof ambientMusic.getCurrentSoundscape).toBe('function');
  });

  it('should start with isPlaying as false', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(ambientMusic.getIsPlaying()).toBe(false);
  });

  it('should start with no current soundscape', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(ambientMusic.getCurrentSoundscape()).toBeNull();
  });

  it('should clamp volume between 0 and 1', async () => {
    const { ambientMusic } = await import('../ambientMusic');

    mockGainNode.gain.value = 0.5;
    ambientMusic.setVolume(1.5);
    expect(mockGainNode.gain.value).toBe(0.5);

    ambientMusic.setVolume(-0.5);
    expect(mockGainNode.gain.value).toBe(0.5);
  });

  it('stop should not throw when not playing', async () => {
    const { ambientMusic } = await import('../ambientMusic');
    expect(() => ambientMusic.stop()).not.toThrow();
  });
});

describe('useAmbientMusic hook', () => {
  it('should export useAmbientMusic', async () => {
    const { useAmbientMusic } = await import('../ambientMusic');
    expect(typeof useAmbientMusic).toBe('function');
  });
});
