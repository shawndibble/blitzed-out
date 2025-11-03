import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('audioContext', () => {
  let mockAudioContext: any;
  let originalAudioContext: any;
  let audioContextModule: any;

  beforeEach(async () => {
    mockAudioContext = {
      state: 'suspended',
      resume: vi.fn().mockResolvedValue(undefined),
    };

    originalAudioContext = window.AudioContext;
    (window as any).AudioContext = function () {
      return mockAudioContext;
    };

    vi.resetModules();
    audioContextModule = await import('../audioContext');
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  describe('getAudioContext', () => {
    it('creates and returns an AudioContext', () => {
      const ctx = audioContextModule.getAudioContext();
      expect(ctx).toBe(mockAudioContext);
    });

    it('returns null if AudioContext is not supported', async () => {
      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = undefined;
      vi.resetModules();
      const module = await import('../audioContext');
      const ctx = module.getAudioContext();
      expect(ctx).toBeNull();
    });
  });

  describe('unlockAudioContext', () => {
    it('resumes suspended AudioContext', async () => {
      mockAudioContext.state = 'suspended';
      const result = await audioContextModule.unlockAudioContext();
      expect(mockAudioContext.resume).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns true if AudioContext is already running', async () => {
      mockAudioContext.state = 'running';
      const result = await audioContextModule.unlockAudioContext();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false if resume fails', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn().mockRejectedValue(new Error('Resume failed'));
      const result = await audioContextModule.unlockAudioContext();
      expect(result).toBe(false);
    });
  });

  describe('setupAudioUnlock', () => {
    it('registers event listeners for user interactions', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      audioContextModule.setupAudioUnlock();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );
    });
  });
});
