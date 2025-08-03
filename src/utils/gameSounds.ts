// Simple game sound utilities following VoiceSelect pattern
export interface GameSound {
  id: string;
  name: string;
  frequency: number;
  type: OscillatorType;
  duration: number;
  category: string;
  frequencies?: number[]; // For melodies with multiple notes
}

export interface SoundCategory {
  id: string;
  name: string;
  sounds: GameSound[];
}

// Classic System Alerts - inspired by iOS, Android, Windows, macOS
const CLASSIC_ALERTS: GameSound[] = [
  {
    id: 'tritone',
    name: 'Tri-tone',
    frequency: 1318,
    type: 'sine',
    duration: 400,
    category: 'classic',
    frequencies: [1318, 1568, 1175],
  },
  {
    id: 'rebound',
    name: 'Rebound',
    frequency: 800,
    type: 'triangle',
    duration: 350,
    category: 'classic',
  },
  {
    id: 'chime',
    name: 'Chime',
    frequency: 1000,
    type: 'sine',
    duration: 500,
    category: 'classic',
    frequencies: [1000, 1200, 1400],
  },
  { id: 'boop', name: 'Boop', frequency: 600, type: 'sine', duration: 150, category: 'classic' },
  {
    id: 'breeze',
    name: 'Breeze',
    frequency: 400,
    type: 'triangle',
    duration: 600,
    category: 'classic',
    frequencies: [400, 500, 600, 500],
  },
  { id: 'pong', name: 'Pong', frequency: 1100, type: 'square', duration: 200, category: 'classic' },
  {
    id: 'glass',
    name: 'Glass',
    frequency: 1800,
    type: 'sine',
    duration: 300,
    category: 'classic',
    frequencies: [1800, 1600, 1400],
  },
  {
    id: 'funk',
    name: 'Funk',
    frequency: 220,
    type: 'sawtooth',
    duration: 400,
    category: 'classic',
  },
];

// Musical Notes and Melodies
const MUSICAL_NOTES: GameSound[] = [
  { id: 'c4', name: 'C Note', frequency: 261.63, type: 'sine', duration: 300, category: 'musical' },
  { id: 'd4', name: 'D Note', frequency: 293.66, type: 'sine', duration: 300, category: 'musical' },
  { id: 'e4', name: 'E Note', frequency: 329.63, type: 'sine', duration: 300, category: 'musical' },
  { id: 'f4', name: 'F Note', frequency: 349.23, type: 'sine', duration: 300, category: 'musical' },
  { id: 'g4', name: 'G Note', frequency: 392.0, type: 'sine', duration: 300, category: 'musical' },
  {
    id: 'ascending',
    name: 'Ascending',
    frequency: 261.63,
    type: 'triangle',
    duration: 800,
    category: 'musical',
    frequencies: [261.63, 293.66, 329.63, 349.23],
  },
  {
    id: 'descending',
    name: 'Descending',
    frequency: 523.25,
    type: 'triangle',
    duration: 800,
    category: 'musical',
    frequencies: [523.25, 466.16, 415.3, 369.99],
  },
  {
    id: 'chord',
    name: 'Major Chord',
    frequency: 261.63,
    type: 'sine',
    duration: 600,
    category: 'musical',
    frequencies: [261.63, 329.63, 392.0],
  },
  {
    id: 'arpeggio',
    name: 'Arpeggio',
    frequency: 261.63,
    type: 'triangle',
    duration: 1000,
    category: 'musical',
    frequencies: [261.63, 329.63, 392.0, 523.25],
  },
];

// Notification Alerts - modern app-style sounds
const NOTIFICATION_ALERTS: GameSound[] = [
  {
    id: 'bell',
    name: 'Bell',
    frequency: 800,
    type: 'sine',
    duration: 200,
    category: 'notification',
  },
  {
    id: 'ding',
    name: 'Ding',
    frequency: 1200,
    type: 'square',
    duration: 150,
    category: 'notification',
  },
  {
    id: 'chirp',
    name: 'Chirp',
    frequency: 1500,
    type: 'sine',
    duration: 80,
    category: 'notification',
  },
  {
    id: 'beep',
    name: 'Beep',
    frequency: 600,
    type: 'sine',
    duration: 100,
    category: 'notification',
  },
  {
    id: 'tick',
    name: 'Tick',
    frequency: 2000,
    type: 'square',
    duration: 50,
    category: 'notification',
  },
  {
    id: 'ping',
    name: 'Ping',
    frequency: 1800,
    type: 'triangle',
    duration: 120,
    category: 'notification',
  },
  {
    id: 'bubble',
    name: 'Bubble',
    frequency: 800,
    type: 'sine',
    duration: 200,
    category: 'notification',
    frequencies: [800, 1200],
  },
  {
    id: 'pop',
    name: 'Pop',
    frequency: 1000,
    type: 'square',
    duration: 80,
    category: 'notification',
  },
];

// Game & Action Sounds - energetic and playful
const GAME_SOUNDS: GameSound[] = [
  { id: 'buzz', name: 'Buzz', frequency: 400, type: 'sawtooth', duration: 250, category: 'game' },
  {
    id: 'whoosh',
    name: 'Whoosh',
    frequency: 200,
    type: 'sawtooth',
    duration: 500,
    category: 'game',
    frequencies: [200, 150, 100],
  },
  {
    id: 'bloop',
    name: 'Bloop',
    frequency: 300,
    type: 'sine',
    duration: 400,
    category: 'game',
    frequencies: [300, 400, 350],
  },
  {
    id: 'zap',
    name: 'Zap',
    frequency: 1500,
    type: 'square',
    duration: 120,
    category: 'game',
    frequencies: [1500, 1000, 500],
  },
  {
    id: 'bounce',
    name: 'Bounce',
    frequency: 500,
    type: 'triangle',
    duration: 300,
    category: 'game',
    frequencies: [500, 700, 600, 800],
  },
  {
    id: 'powerup',
    name: 'Power Up',
    frequency: 440,
    type: 'square',
    duration: 600,
    category: 'game',
    frequencies: [440, 523, 659, 784],
  },
  {
    id: 'coin',
    name: 'Coin',
    frequency: 1046,
    type: 'square',
    duration: 300,
    category: 'game',
    frequencies: [1046, 1318],
  },
  {
    id: 'fanfare',
    name: 'Fanfare',
    frequency: 523,
    type: 'triangle',
    duration: 1200,
    category: 'game',
    frequencies: [523, 659, 784, 1046],
  },
];

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: 'classic', name: 'Classic System Alerts', sounds: CLASSIC_ALERTS },
  { id: 'musical', name: 'Musical Notes & Melodies', sounds: MUSICAL_NOTES },
  { id: 'notification', name: 'Notification Alerts', sounds: NOTIFICATION_ALERTS },
  { id: 'game', name: 'Game & Action Sounds', sounds: GAME_SOUNDS },
];

export const AVAILABLE_SOUNDS: GameSound[] = [
  ...CLASSIC_ALERTS,
  ...MUSICAL_NOTES,
  ...NOTIFICATION_ALERTS,
  ...GAME_SOUNDS,
];

// Enhanced sound playback with melody support
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

    // If sound has multiple frequencies (melody), play them sequentially
    if (sound.frequencies && sound.frequencies.length > 1) {
      return playMelody(audioContext, sound);
    }

    // Single note playback
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

// Play melody with multiple frequencies
async function playMelody(audioContext: AudioContext, sound: GameSound): Promise<boolean> {
  try {
    const frequencies = sound.frequencies!;
    const noteDuration = sound.duration / frequencies.length;
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    // Handle both real AudioContext and mock
    if (masterGain.gain.setValueAtTime) {
      masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    } else {
      masterGain.gain.value = 0.3;
    }

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();

      oscillator.connect(noteGain);
      noteGain.connect(masterGain);

      oscillator.frequency.value = frequency;
      oscillator.type = sound.type;

      const startTime = audioContext.currentTime + (index * noteDuration) / 1000;
      const endTime = startTime + noteDuration / 1000;

      // Handle both real AudioContext and mock
      if (noteGain.gain.setValueAtTime) {
        noteGain.gain.setValueAtTime(1, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, endTime);
      } else {
        noteGain.gain.value = 1;
      }

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });

    // Clean up after melody finishes
    setTimeout(() => {
      audioContext.close();
    }, sound.duration + 100);

    return true;
  } catch (error) {
    console.warn('Melody playback failed:', error);
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
