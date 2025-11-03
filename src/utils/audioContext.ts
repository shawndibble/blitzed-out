let audioContext: AudioContext | null = null;
let unlockAttempted = false;

export function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export async function unlockAudioContext(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return true;
    } catch (error) {
      console.warn('Failed to resume AudioContext:', error);
      return false;
    }
  }

  return ctx.state === 'running';
}

export function setupAudioUnlock(): void {
  if (unlockAttempted) return;
  unlockAttempted = true;

  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];

  const unlock = async () => {
    const success = await unlockAudioContext();
    if (success) {
      unlockEvents.forEach((event) => {
        document.removeEventListener(event, unlock);
      });
    }
  };

  unlockEvents.forEach((event) => {
    document.addEventListener(event, unlock, { once: false, passive: true });
  });
}
