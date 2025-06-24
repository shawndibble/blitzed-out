import { vi } from 'vitest';

// Mock Firebase Auth User
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  isAnonymous: false,
  emailVerified: true,
  photoURL: null,
  providerId: 'firebase',
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-token' }),
};

export const mockAnonymousUser = {
  uid: 'anonymous-user-123',
  email: null,
  displayName: 'Anonymous User',
  isAnonymous: true,
  emailVerified: false,
  photoURL: null,
  providerId: 'firebase',
  getIdToken: vi.fn().mockResolvedValue('mock-anonymous-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-anonymous-token' }),
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
  signInAnonymously: vi.fn().mockResolvedValue({ user: mockAnonymousUser }),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  signInWithPopup: vi.fn().mockResolvedValue({ user: mockUser }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  signOut: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  linkWithCredential: vi.fn().mockResolvedValue({ user: mockUser }),
};

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      id: 'mock-doc-id',
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'mock-doc-id', name: 'Mock Document' }),
        id: 'mock-doc-id',
      }),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      onSnapshot: vi.fn((callback) => {
        callback({
          exists: () => true,
          data: () => ({ id: 'mock-doc-id', name: 'Mock Document' }),
          id: 'mock-doc-id',
        });
        return vi.fn(); // unsubscribe function
      }),
    })),
    add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    get: vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'mock-doc-1',
          data: () => ({ id: 'mock-doc-1', name: 'Mock Document 1' }),
        },
        {
          id: 'mock-doc-2',
          data: () => ({ id: 'mock-doc-2', name: 'Mock Document 2' }),
        },
      ],
    }),
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          docs: [],
        }),
      })),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        docs: [],
      }),
    })),
  })),
  doc: vi.fn(() => ({
    id: 'mock-doc-id',
    get: vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ id: 'mock-doc-id', name: 'Mock Document' }),
      id: 'mock-doc-id',
    }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
};

// Mock Realtime Database
export const mockDatabase = {
  ref: vi.fn(() => ({
    push: vi.fn().mockResolvedValue({ key: 'mock-push-key' }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((eventType, callback) => {
      callback({
        val: () => ({ mockData: 'test' }),
        key: 'mock-key',
      });
      return vi.fn(); // off function
    }),
    off: vi.fn(),
    once: vi.fn().mockResolvedValue({
      val: () => ({ mockData: 'test' }),
      key: 'mock-key',
    }),
    onDisconnect: vi.fn(() => ({
      remove: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
    })),
  })),
  goOffline: vi.fn(),
  goOnline: vi.fn(),
};

// Mock Storage
export const mockStorage = {
  ref: vi.fn(() => ({
    putString: vi.fn().mockResolvedValue({
      metadata: { name: 'test-file' },
      ref: { fullPath: 'test/path' },
    }),
    getDownloadURL: vi.fn().mockResolvedValue('https://mock-download-url.com/file'),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
};

// Firebase service functions
export const loginAnonymously = vi.fn().mockResolvedValue(mockAnonymousUser);
export const loginWithEmail = vi.fn().mockResolvedValue(mockUser);
export const loginWithGoogle = vi.fn().mockResolvedValue(mockUser);
export const registerWithEmail = vi.fn().mockResolvedValue(mockUser);
export const updateDisplayName = vi.fn().mockResolvedValue(mockUser);
export const resetPassword = vi.fn().mockResolvedValue(undefined);
export const convertAnonymousAccount = vi.fn().mockResolvedValue(mockUser);
export const logout = vi.fn().mockResolvedValue(undefined);

// Sync service functions
export const syncDataFromFirebase = vi.fn().mockResolvedValue(true);
export const syncAllDataToFirebase = vi.fn().mockResolvedValue(true);
export const startPeriodicSync = vi.fn();
export const stopPeriodicSync = vi.fn();

// Default export for easy importing
export default {
  mockAuth,
  mockFirestore,
  mockDatabase,
  mockStorage,
  mockUser,
  mockAnonymousUser,
  loginAnonymously,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  updateDisplayName,
  resetPassword,
  convertAnonymousAccount,
  logout,
  syncDataFromFirebase,
  syncAllDataToFirebase,
  startPeriodicSync,
  stopPeriodicSync,
};
