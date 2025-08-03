// Simple game sound utilities following VoiceSelect pattern
export interface GameSound {
  id: string;
  name: string;
  frequency: number;
  type: OscillatorType;
  duration: number;
}

export const AVAILABLE_SOUNDS: GameSound[] = [
  { id: 'bell', name: 'Bell', frequency: 800, type: 'sine', duration: 200 },
  { id: 'chime', name: 'Chime', frequency: 1000, type: 'triangle', duration: 300 },
  { id: 'ding', name: 'Ding', frequency: 1200, type: 'square', duration: 150 },
  { id: 'buzz', name: 'Buzz', frequency: 400, type: 'sawtooth', duration: 250 },
  { id: 'beep', name: 'Beep', frequency: 600, type: 'sine', duration: 100 },
  { id: 'chirp', name: 'Chirp', frequency: 1500, type: 'sine', duration: 80 },
];

// Simple sound playback (like how VoiceSelect plays TTS)
export async function playSound(sound: GameSound): Promise<boolean> {
  try {
    // Check if sound is valid
    if (!sound || !sound.frequency || !sound.type || !sound.duration) {
      return false;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = sound.frequency;
    oscillator.type = sound.type;

    // Handle both real AudioContext and mock
    if (gainNode.gain.setValueAtTime) {
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + sound.duration / 1000
      );
    } else {
      // Fallback for testing environment
      gainNode.gain.value = 0.3;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + sound.duration / 1000);

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, sound.duration + 100);

    return true;
  } catch (error) {
    console.warn('Sound playback failed:', error);
    return false;
  }
}

export function getRandomSound(): GameSound {
  return AVAILABLE_SOUNDS[Math.floor(Math.random() * AVAILABLE_SOUNDS.length)];
}

export function getSoundById(id: string): GameSound | null {
  if (!id) {
    return null;
  }
  return AVAILABLE_SOUNDS.find((sound) => sound.id === id) || null;
}
