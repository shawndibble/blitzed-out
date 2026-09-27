import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ type: 'firebase-app-mock', name: '[DEFAULT]' })),
}));

const { mockInitializeFirestore } = vi.hoisted(() => ({
  mockInitializeFirestore: vi.fn(() => ({ type: 'firestore-mock' })),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  memoryLocalCache: vi.fn(() => ({ kind: 'memory' })),
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
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
    fromDate: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
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

describe('firebase Firestore cache', () => {
  beforeEach(() => {
    vi.resetModules();
    mockInitializeFirestore.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('initializes Firestore with the in-memory cache, never IndexedDB persistence', async () => {
    await import('@/services/firebase/app');

    expect(mockInitializeFirestore).toHaveBeenCalledOnce();
    expect(mockInitializeFirestore).toHaveBeenCalledWith(expect.anything(), {
      localCache: { kind: 'memory' },
    });
  });

  it('deletes the legacy IndexedDB Firestore cache', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    const deleteDatabase = vi.spyOn(indexedDB, 'deleteDatabase');

    await import('@/services/firebase/app');

    expect(deleteDatabase).toHaveBeenCalledWith('firestore/[DEFAULT]/test-project/main');
  });
});
