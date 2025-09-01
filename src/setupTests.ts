import '@testing-library/jest-dom';

import { afterEach, beforeEach, vi } from 'vitest';
// Configure React Testing Library
import { cleanup, configure } from '@testing-library/react';

import React from 'react';

// Mock syncService to prevent auth context errors - must be before other imports
vi.mock('@/services/syncService', () => ({
  syncDataFromFirebase: () => Promise.resolve(true),
  syncCustomTilesToFirebase: () => Promise.resolve(true),
  syncCustomGroupsToFirebase: () => Promise.resolve(true),
  syncGameBoardsToFirebase: () => Promise.resolve(true),
  syncSettingsToFirebase: () => Promise.resolve(true),
  syncAllDataToFirebase: () => Promise.resolve(true),
  startPeriodicSync: () => {},
  stopPeriodicSync: () => {},
  isPeriodicSyncActive: () => false,
}));

configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 3000,
  computedStyleSupportsPseudoElements: false,
});

// Suppress React 18 act warnings and test-related warnings in tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      (typeof args[0] === 'string' &&
        args[0].includes('Warning: An update to') &&
        args[0].includes('was not wrapped in act')) ||
      args[0].includes('Warning: React does not recognize') ||
      args[0].includes('Warning: validateDOMNesting') ||
      args[0].includes('Unknown event handler property') ||
      args[0].includes('No user logged in') ||
      args[0].includes('Error syncing')
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
    onAuthStateChanged: vi.fn(() => {
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

// Mock Framer Motion globally to prevent unknown event handler warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<any, any>((props, ref) => {
      // Filter out framer-motion specific props that React doesn't recognize
      const {
        onUpdate: _onUpdate,
        onAnimationComplete: _onAnimationComplete,
        onAnimationStart: _onAnimationStart,
        onDrag: _onDrag,
        onDragEnd: _onDragEnd,
        onDragStart: _onDragStart,
        onHoverStart: _onHoverStart,
        onHoverEnd: _onHoverEnd,
        onTap: _onTap,
        onTapStart: _onTapStart,
        onTapCancel: _onTapCancel,
        onPan: _onPan,
        onPanStart: _onPanStart,
        onPanEnd: _onPanEnd,
        animate: _animate,
        initial: _initial,
        exit: _exit,
        transition: _transition,
        variants: _variants,
        custom: _custom,
        style,
        ...restProps
      } = props;
      return React.createElement('div', { ...restProps, ref, style });
    }),
    li: React.forwardRef<any, any>((props, ref) => {
      const {
        onUpdate: _onUpdate,
        onAnimationComplete: _onAnimationComplete,
        onAnimationStart: _onAnimationStart,
        onDrag: _onDrag,
        onDragEnd: _onDragEnd,
        onDragStart: _onDragStart,
        onHoverStart: _onHoverStart,
        onHoverEnd: _onHoverEnd,
        onTap: _onTap,
        onTapStart: _onTapStart,
        onTapCancel: _onTapCancel,
        onPan: _onPan,
        onPanStart: _onPanStart,
        onPanEnd: _onPanEnd,
        animate: _animate,
        initial: _initial,
        exit: _exit,
        transition: _transition,
        variants: _variants,
        custom: _custom,
        style,
        ...restProps
      } = props;
      return React.createElement('li', { ...restProps, ref, style });
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock all MUI icons globally using a factory pattern
vi.mock('@mui/icons-material', () => {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === 'string') {
          // Return a mock React component for any icon
          return () =>
            React.createElement('div', { 'data-testid': `mui-icon-${prop.toLowerCase()}` });
        }
        return undefined;
      },
    }
  );
});

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
  MigrationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock window.matchMedia (for MUI responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => {
    // Mock different breakpoints for testing
    const matches = (() => {
      if (query.includes('(max-width: 599.95px)')) return false; // xs
      if (query.includes('(max-width: 899.95px)')) return false; // sm and below
      if (query.includes('(max-width: 1199.95px)')) return false; // md and below
      if (query.includes('(max-width: 1535.95px)')) return false; // lg and below
      return false; // Default to desktop
    })();

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers(); // Clear any remaining timers
  console.error = originalError;
  cleanup(); // Clean up DOM between tests
});
