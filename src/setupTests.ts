import '@testing-library/jest-dom';

import { afterEach, beforeEach, vi } from 'vitest';
// Configure React Testing Library
import { cleanup, configure } from '@testing-library/react';

import React from 'react';

// Setup fake-indexeddb for Dexie/IndexedDB tests
import 'fake-indexeddb/auto';

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
const originalLog = console.log;
const originalWarn = console.warn;

beforeEach(() => {
  // Suppress all console.log in tests to reduce noise
  console.log = vi.fn();

  // Suppress all console.warn in tests
  console.warn = vi.fn();

  // Suppress specific console.error patterns
  console.error = (...args: any[]) => {
    if (
      (typeof args[0] === 'string' &&
        args[0].includes('Warning: An update to') &&
        args[0].includes('was not wrapped in act')) ||
      args[0].includes('Warning: React does not recognize') ||
      args[0].includes('Warning: validateDOMNesting') ||
      args[0].includes('Unknown event handler property') ||
      args[0].includes('No user logged in') ||
      args[0].includes('Error syncing') ||
      args[0].includes('Missing Firebase environment variables') ||
      args[0].includes('Could not extract image ID') ||
      args[0].includes('Found tile') ||
      args[0].includes('Error during group ID audit') ||
      args[0].includes('Error finding existing tile') ||
      args[0].includes('Error batch matching tiles') ||
      args[0].includes('Unexpected error in test') ||
      args[0].includes('Fullscreen API is not supported') ||
      args[0].includes('Note: iOS Safari')
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
  onChildAdded: vi.fn(),
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
  const anatomyMappingsEn = {
    male: {
      genital: 'dick',
      hole: 'hole',
      chest: 'chest',
      pronoun_subject: 'he',
      pronoun_object: 'him',
      pronoun_possessive: 'his',
      pronoun_reflexive: 'himself',
    },
    female: {
      genital: 'pussy',
      hole: 'pussy',
      chest: 'breasts',
      pronoun_subject: 'she',
      pronoun_object: 'her',
      pronoun_possessive: 'her',
      pronoun_reflexive: 'herself',
    },
    'non-binary': {
      genital: 'genitals',
      hole: 'hole',
      chest: 'chest',
      pronoun_subject: 'they',
      pronoun_object: 'them',
      pronoun_possessive: 'their',
      pronoun_reflexive: 'themselves',
    },
  };

  const mockTranslationsByLocale: any = {
    en: {
      theCurrentPlayer: 'the current player',
      aDominant: 'a dominant',
      aSubmissive: 'a submissive',
      anotherPlayer: 'another player',
      anatomy: {
        penetrativeKeywords: ['deep', 'throat', 'penetrate', 'inside', 'enters'],
        genericAnatomyTerms: {
          genital: 'genitals',
          hole: 'hole',
          chest: 'chest',
          pronoun_subject: 'they',
          pronoun_object: 'them',
          pronoun_possessive: 'their',
          pronoun_reflexive: 'themselves',
        },
        anatomyMappings: anatomyMappingsEn,
        straponTerms: {
          strapon: 'strapon',
        },
      },
    },
    es: {
      anatomy: {
        penetrativeKeywords: ['profundo', 'garganta', 'penetrar', 'dentro', 'entra'],
        anatomyMappings: {
          male: {
            genital: 'polla',
            hole: 'agujero',
            chest: 'pecho',
            pronoun_subject: 'él',
            pronoun_object: 'él',
            pronoun_possessive: 'su',
            pronoun_reflexive: 'sí mismo',
          },
          female: {
            genital: 'coño',
            hole: 'coño',
            chest: 'pechos',
            pronoun_subject: 'ella',
            pronoun_object: 'ella',
            pronoun_possessive: 'su',
            pronoun_reflexive: 'sí misma',
          },
          'non-binary': {
            genital: 'genitales',
            hole: 'agujero',
            chest: 'pecho',
            pronoun_subject: 'elle',
            pronoun_object: 'elle',
            pronoun_possessive: 'su',
            pronoun_reflexive: 'sí misme',
          },
        },
        straponTerms: {
          strapon: 'arnés',
        },
      },
    },
    fr: {
      anatomy: {
        anatomyMappings: {
          male: {
            genital: 'bite',
            hole: 'trou',
            chest: 'torse',
            pronoun_subject: 'il',
            pronoun_object: 'lui',
            pronoun_possessive: 'son',
            pronoun_reflexive: 'lui-même',
          },
          female: {
            genital: 'chatte',
            hole: 'chatte',
            chest: 'seins',
            pronoun_subject: 'elle',
            pronoun_object: 'elle',
            pronoun_possessive: 'sa',
            pronoun_reflexive: 'elle-même',
          },
          'non-binary': {
            genital: 'organes génitaux',
            hole: 'trou',
            chest: 'torse',
            pronoun_subject: 'iel',
            pronoun_object: 'iel',
            pronoun_possessive: 'son',
            pronoun_reflexive: 'soi-même',
          },
        },
        straponTerms: {
          strapon: 'gode-ceinture',
        },
      },
    },
    zh: {
      anatomy: {
        penetrativeKeywords: ['深', '喉', '插入', '里面', '进入'],
        anatomyMappings: {
          male: {
            genital: '鸡巴',
            hole: '洞',
            chest: '胸部',
            pronoun_subject: '他',
            pronoun_object: '他',
            pronoun_possessive: '他的',
            pronoun_reflexive: '他自己',
          },
          female: {
            genital: '阴蒂',
            hole: '阴道',
            chest: '乳房',
            pronoun_subject: '她',
            pronoun_object: '她',
            pronoun_possessive: '她的',
            pronoun_reflexive: '她自己',
          },
          'non-binary': {
            genital: '生殖器',
            hole: '洞',
            chest: '胸部',
            pronoun_subject: '他们',
            pronoun_object: '他们',
            pronoun_possessive: '他们的',
            pronoun_reflexive: '他们自己',
          },
        },
        straponTerms: {
          strapon: '假阳具',
        },
      },
    },
    hi: {
      anatomy: {
        penetrativeKeywords: ['गहरा', 'गला', 'घुसना', 'अंदर', 'प्रवेश'],
        anatomyMappings: {
          male: {
            genital: 'लिंग',
            hole: 'छेद',
            chest: 'छाती',
            pronoun_subject: 'वह',
            pronoun_object: 'उसे',
            pronoun_possessive: 'उसका',
            pronoun_reflexive: 'स्वयं',
          },
          female: {
            genital: 'योनि',
            hole: 'योनि',
            chest: 'स्तन',
            pronoun_subject: 'वह',
            pronoun_object: 'उसे',
            pronoun_possessive: 'उसका',
            pronoun_reflexive: 'स्वयं',
          },
          'non-binary': {
            genital: 'जननांग',
            hole: 'छेद',
            chest: 'छाती',
            pronoun_subject: 'वे',
            pronoun_object: 'उन्हें',
            pronoun_possessive: 'उनका',
            pronoun_reflexive: 'स्वयं',
          },
        },
        straponTerms: {
          strapon: 'स्ट्रैपऑन',
        },
      },
    },
  };

  const mockI18n = {
    init: vi.fn(() => Promise.resolve()),
    use: vi.fn(),
    t: vi.fn((key: string, options?: any) => {
      const locale = options?.lng || 'en';
      const translations = mockTranslationsByLocale[locale] || mockTranslationsByLocale.en;

      // Handle namespace:key notation (e.g., 'anatomy:anatomyMappings')
      let namespace = null;
      let actualKey = key;
      if (key.includes(':')) {
        const parts = key.split(':');
        namespace = parts[0];
        actualKey = parts.slice(1).join(':');
      }

      // Build the full path including namespace
      const fullPath = namespace ? `${namespace}.${actualKey}` : actualKey;

      // Handle returnObjects option for nested structures
      if (options?.returnObjects) {
        const parts = fullPath.split('.');
        let value: any = translations;
        for (const part of parts) {
          value = value?.[part];
        }
        return value || {};
      }

      // Handle normal translations
      const parts = fullPath.split('.');
      let value: any = translations;
      for (const part of parts) {
        value = value?.[part];
      }
      return value !== undefined ? value : key;
    }),
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
  vi.useRealTimers(); // Reset to real timers
  console.error = originalError;
  console.log = originalLog;
  console.warn = originalWarn;
  cleanup(); // Clean up DOM between tests

  // Note: IndexedDB cleanup removed to prevent conflicts during parallel test execution
  // Each test that uses IndexedDB should handle its own cleanup or use mocks
});
