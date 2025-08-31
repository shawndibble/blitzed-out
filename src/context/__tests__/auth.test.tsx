import * as firebaseService from '@/services/firebase';
import * as syncService from '@/services/syncService';

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAnonymousUser, mockUser } from '@/__mocks__/firebase';

import { AuthProvider } from '../auth';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: mockOnAuthStateChanged,
  })),
}));

// Mock Firebase services
vi.mock('@/services/firebase', () => ({
  loginAnonymously: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  updateDisplayName: vi.fn(),
  resetPassword: vi.fn(),
  convertAnonymousAccount: vi.fn(),
  logout: vi.fn(),
}));

// Mock lazy Firebase loading to return the service mocks
vi.mock('@/utils/lazyFirebase', () => ({
  loadFirebase: () => Promise.resolve(firebaseService),
  preloadFirebase: vi.fn(),
}));

// Mock sync services
vi.mock('@/services/syncService', () => ({
  syncDataFromFirebase: vi.fn().mockResolvedValue(true),
  syncAllDataToFirebase: vi.fn().mockResolvedValue(true),
  startPeriodicSync: vi.fn(),
  stopPeriodicSync: vi.fn(),
}));

describe('AuthProvider', () => {
  let authStateChangedCallback: ((user: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangedCallback = null;

    // Mock requestIdleCallback if it doesn't exist
    if (typeof window !== 'undefined' && !('requestIdleCallback' in window)) {
      (window as any).requestIdleCallback = (callback: () => void) => {
        setTimeout(() => callback(), 0);
      };
    }

    // Setup mock for onAuthStateChanged to capture the callback and call it immediately
    mockOnAuthStateChanged.mockImplementation((callback) => {
      authStateChangedCallback = callback;
      // Simulate immediate call to callback as Firebase would do
      setTimeout(() => {
        callback(null); // Start with null user
      }, 0);
      // Return unsubscribe function
      return vi.fn();
    });

    // Firebase service mocks are handled at service level

    // Clear window auth context
    (window as any).authContext = undefined;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    (window as any).authContext = undefined;
    // Reset auth state callback
    authStateChangedCallback = null;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isAnonymous).toBe(false);
    });

    it('should set up auth state listener on mount', async () => {
      renderHook(() => useAuth(), { wrapper });

      // Wait for async initialization
      await waitFor(() => {
        expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
      });

      expect(typeof authStateChangedCallback).toBe('function');
    });

    it('should set up global auth context', async () => {
      renderHook(() => useAuth(), { wrapper });

      // Wait for async initialization
      await waitFor(() => {
        expect((window as any).authContext).toBeDefined();
      });

      expect((window as any).authContext.user).toBe(null);
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when auth state changes to authenticated user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
        expect(result.current.isAnonymous).toBe(false);
      });
    });

    it('should update user state when auth state changes to anonymous user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      await act(async () => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockAnonymousUser);
        expect(result.current.loading).toBe(false);
        expect(result.current.isAnonymous).toBe(true);
      });
    });

    it('should clear user state when auth state changes to null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First set a user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      // Then clear it
      await act(async () => {
        authStateChangedCallback?.(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.isAnonymous).toBe(false);
      });
    });

    it('should trigger data sync for authenticated non-anonymous users', async () => {
      vi.useFakeTimers();
      renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await act(async () => {
        // Need to advance past the 3000ms setTimeout (updated delay)
        vi.advanceTimersByTime(3000);
        await Promise.resolve();
      });

      expect(syncService.syncDataFromFirebase).toHaveBeenCalledTimes(1);
      expect(syncService.startPeriodicSync).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should not trigger data sync for anonymous users', async () => {
      vi.useFakeTimers();
      renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      await act(async () => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      await act(async () => {
        vi.advanceTimersByTime(1000); // Advance past the debounce timeout
        await Promise.resolve(); // Allow promises to resolve
      });

      expect(syncService.syncDataFromFirebase).not.toHaveBeenCalled();
      expect(syncService.startPeriodicSync).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should stop periodic sync when user logs out', async () => {
      renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // First set a user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      // Then clear it (logout)
      await act(async () => {
        authStateChangedCallback?.(null);
      });

      expect(syncService.stopPeriodicSync).toHaveBeenCalled();
    });

    it('should update global auth context when user changes', async () => {
      renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await waitFor(() => {
        expect((window as any).authContext.user).toEqual(mockUser);
      });
    });
  });

  describe('Anonymous Login', () => {
    it('should login anonymously with display name', async () => {
      const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);
      mockLoginAnonymously.mockResolvedValue(mockAnonymousUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('Test User');
      });

      expect(mockLoginAnonymously).toHaveBeenCalledWith('Test User');
      expect(loginResult).toEqual(mockAnonymousUser);
      expect(result.current.user).toEqual(mockAnonymousUser);
    });

    it('should login anonymously without display name', async () => {
      const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);
      mockLoginAnonymously.mockResolvedValue(mockAnonymousUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login();
      });

      expect(mockLoginAnonymously).toHaveBeenCalledWith('');
    });

    it('should handle anonymous login error', async () => {
      const errorMessage = 'Anonymous login failed';
      const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);
      mockLoginAnonymously.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Email/Password Authentication', () => {
    it('should login with email and password', async () => {
      const mockLoginWithEmail = vi.mocked(firebaseService.loginWithEmail);
      mockLoginWithEmail.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginEmail('test@example.com', 'password123');
      });

      expect(mockLoginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(loginResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle email login error', async () => {
      const errorMessage = 'Invalid credentials';
      const mockLoginWithEmail = vi.mocked(firebaseService.loginWithEmail);
      mockLoginWithEmail.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.loginEmail('test@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should register with email, password, and display name', async () => {
      const mockRegisterWithEmail = vi.mocked(firebaseService.registerWithEmail);
      mockRegisterWithEmail.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'test@example.com',
          'password123',
          'Test User'
        );
      });

      expect(mockRegisterWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(registerResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle registration error', async () => {
      const errorMessage = 'Email already in use';
      const mockRegisterWithEmail = vi.mocked(firebaseService.registerWithEmail);
      mockRegisterWithEmail.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register('test@example.com', 'password123', 'Test User');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Google OAuth', () => {
    it('should login with Google', async () => {
      const mockLoginWithGoogle = vi.mocked(firebaseService.loginWithGoogle);
      mockLoginWithGoogle.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginGoogle();
      });

      expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
      expect(loginResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle Google login error', async () => {
      const errorMessage = 'Google login cancelled';
      const mockLoginWithGoogle = vi.mocked(firebaseService.loginWithGoogle);
      mockLoginWithGoogle.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.loginGoogle();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const mockResetPassword = vi.mocked(firebaseService.resetPassword);
      mockResetPassword.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.forgotPassword('test@example.com');
      });

      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(resetResult).toBe(true);
    });

    it('should handle password reset error', async () => {
      const errorMessage = 'Email not found';
      const mockResetPassword = vi.mocked(firebaseService.resetPassword);
      mockResetPassword.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.forgotPassword('test@example.com');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Convert Anonymous Account', () => {
    it('should convert anonymous account to registered account', async () => {
      const mockConvertAnonymousAccount = vi.mocked(firebaseService.convertAnonymousAccount);
      mockConvertAnonymousAccount.mockResolvedValue(mockUser);
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockSyncAllDataToFirebase.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // First set anonymous user
      await act(async () => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockAnonymousUser);
      });

      let convertResult;
      await act(async () => {
        convertResult = await result.current.convertToRegistered('test@example.com', 'password123');
      });

      expect(mockConvertAnonymousAccount).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(convertResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle convert anonymous account error', async () => {
      const errorMessage = 'Email already in use';
      const mockConvertAnonymousAccount = vi.mocked(firebaseService.convertAnonymousAccount);
      mockConvertAnonymousAccount.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.convertToRegistered('test@example.com', 'password123');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Update Display Name', () => {
    it('should update display name', async () => {
      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
      const mockUpdateDisplayName = vi.mocked(firebaseService.updateDisplayName);
      mockUpdateDisplayName.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateUser('Updated Name');
      });

      expect(mockUpdateDisplayName).toHaveBeenCalledWith('Updated Name');
      expect(updateResult).toEqual(updatedUser);
      expect(result.current.user).toEqual(updatedUser);
    });

    it('should handle update display name error', async () => {
      const errorMessage = 'Update failed';
      const mockUpdateDisplayName = vi.mocked(firebaseService.updateDisplayName);
      mockUpdateDisplayName.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.updateUser('Updated Name');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Logout', () => {
    it('should logout and sync data for registered users', async () => {
      const mockLogout = vi.mocked(firebaseService.logout);
      mockLogout.mockResolvedValue(true);
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockSyncAllDataToFirebase.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // First set a registered user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSyncAllDataToFirebase).toHaveBeenCalledTimes(1);
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBe(null);
    });

    it('should logout without syncing data for anonymous users', async () => {
      const mockLogout = vi.mocked(firebaseService.logout);
      mockLogout.mockResolvedValue(true);
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // First set an anonymous user
      await act(async () => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSyncAllDataToFirebase).not.toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBe(null);
    });

    it('should logout even if sync fails', async () => {
      vi.useFakeTimers();
      const mockLogout = vi.mocked(firebaseService.logout);
      mockLogout.mockResolvedValue(true);
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      // Mock sync to hang and timeout
      mockSyncAllDataToFirebase.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // First set a registered user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await act(async () => {
        // Mock the sync to resolve immediately
        vi.mocked(syncService.syncAllDataToFirebase).mockResolvedValue(true);
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBe(null);

      vi.useRealTimers();
    });

    it('should handle logout error', async () => {
      const errorMessage = 'Logout failed';
      const mockLogout = vi.mocked(firebaseService.logout);
      mockLogout.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Sync Status', () => {
    it('should update sync status during sync operations', async () => {
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      let resolveSync: (value: boolean) => void;
      const syncPromise = new Promise<boolean>((resolve) => {
        resolveSync = resolve;
      });
      mockSyncAllDataToFirebase.mockReturnValue(syncPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      // Set a registered user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Start sync
      let syncDataPromise: Promise<boolean>;
      await act(async () => {
        syncDataPromise = result.current.syncData();
      });

      // Check that syncing status is true while sync is in progress
      await waitFor(() => {
        expect(result.current.syncStatus.syncing).toBe(true);
      });

      // Resolve the sync
      await act(async () => {
        resolveSync?.(true);
        await syncDataPromise;
      });

      // Check that syncing status is false and lastSync is set
      await waitFor(() => {
        expect(result.current.syncStatus.syncing).toBe(false);
        expect(result.current.syncStatus.lastSync).toBeInstanceOf(Date);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const unsubscribeMock = vi.fn();

      // Mock the auth state changed to return our unsubscribe function
      mockOnAuthStateChanged.mockImplementation((callback) => {
        // Store the callback to simulate auth state
        authStateChangedCallback = callback;
        // Return our unsubscribe mock
        return unsubscribeMock;
      });

      const { result: _result, unmount } = renderHook(() => useAuth(), { wrapper });

      // Wait for auth initialization to complete
      await waitFor(() => {
        expect(authStateChangedCallback).not.toBe(null);
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(syncService.stopPeriodicSync).toHaveBeenCalled();
      expect((window as any).authContext).toBeUndefined();
    });
  });
});

describe('useAuth hook', () => {
  it('should throw error when used outside AuthProvider', () => {
    // Mock console.error to avoid error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
