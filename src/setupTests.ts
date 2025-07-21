import { afterEach, vi, beforeEach } from 'vitest';

// Mock syncService to prevent auth context errors - must be before other imports
vi.mock('@/services/syncService', () => ({
  syncDataFromFirebase: () => Promise.resolve(true),
  syncAllDataToFirebase: () => Promise.resolve(true),
  startPeriodicSync: () => {},
  stopPeriodicSync: () => {},
}));

import '@testing-library/jest-dom';
import React from 'react';

// Configure React Testing Library
import { configure } from '@testing-library/react';
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 3000,
  computedStyleSupportsPseudoElements: false,
});

// Suppress React 18 act warnings in tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      (typeof args[0] === 'string' &&
        args[0].includes('Warning: An update to') &&
        args[0].includes('was not wrapped in act')) ||
      args[0].includes('Warning: React does not recognize') ||
      args[0].includes('Warning: validateDOMNesting')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Mock Firebase modules globally
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    }),
  })),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  linkWithCredential: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  push: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(),
    set: vi.fn(),
  })),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadString: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'TEST' }),
  };
});

// Mock i18next
vi.mock('i18next', () => {
  const mockI18n = {
    init: vi.fn(() => Promise.resolve()),
    use: vi.fn(),
    t: vi.fn((key: string) => key),
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(),
    language: 'en',
  };

  // Make the use method return the same instance for chaining
  mockI18n.use.mockReturnValue(mockI18n);

  return {
    default: mockI18n,
    t: mockI18n.t,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: {
    type: 'languageDetector',
    init: vi.fn(),
    detect: vi.fn(() => 'en'),
    cacheUserLanguage: vi.fn(),
  },
}));

// Mock i18next-resources-to-backend
vi.mock('i18next-resources-to-backend', () => ({
  default: vi.fn(() => ({
    type: 'backend',
    init: vi.fn(),
    read: vi.fn((language, namespace, callback) => {
      callback(null, { [language]: { [namespace]: {} } });
    }),
  })),
}));

// Mock use-sound
vi.mock('use-sound', () => ({
  default: () => [vi.fn(), { stop: vi.fn() }],
}));

// Mock window.matchMedia (for MUI responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  console.error = originalError;
});
