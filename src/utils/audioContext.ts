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
    } catch {
      return false;
    }
  }

  return ctx.state === 'running';
}

export function setupAudioUnlock(): void {
  if (unlockAttempted) return;

  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];

  const unlock = async () => {
    unlockAttempted = true;
    await unlockAudioContext();
  };

  unlockEvents.forEach((event) => {
    document.addEventListener(event, unlock, { passive: true, once: true });
  });
}
