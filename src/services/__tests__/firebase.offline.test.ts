import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ type: 'firebase-app-mock' })),
}));

const { mockInitializeFirestore, mockPersistentLocalCache, mockPersistentMultipleTabManager } =
  vi.hoisted(() => ({
    mockInitializeFirestore: vi.fn(() => ({ type: 'firestore-mock' })),
    mockPersistentLocalCache: vi.fn(() => ({ type: 'persistent-local-cache' })),
    mockPersistentMultipleTabManager: vi.fn(() => ({ type: 'multi-tab-manager' })),
  }));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  persistentMultipleTabManager: mockPersistentMultipleTabManager,
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

describe('firebase offline persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    mockPersistentMultipleTabManager.mockReturnValue({ type: 'multi-tab-manager' });
    mockPersistentLocalCache.mockReturnValue({ type: 'persistent-local-cache' });
    mockInitializeFirestore.mockReturnValue({ type: 'firestore-mock' });
  });

  it('initializes Firestore with persistentLocalCache', async () => {
    await import('@/services/firebase');

    expect(mockInitializeFirestore).toHaveBeenCalledOnce();
    expect(mockPersistentLocalCache).toHaveBeenCalledOnce();
    expect(mockPersistentMultipleTabManager).toHaveBeenCalledOnce();
  });

  it('passes persistentLocalCache result to initializeFirestore', async () => {
    await import('@/services/firebase');

    const [, options] = mockInitializeFirestore.mock.calls[0] as unknown as [
      unknown,
      { localCache: unknown },
    ];
    expect(options).toEqual({
      localCache: { type: 'persistent-local-cache' },
    });
  });
});
