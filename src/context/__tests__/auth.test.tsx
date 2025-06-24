import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider } from '../auth';
import { useAuth } from '@/hooks/useAuth';
import * as firebaseService from '@/services/firebase';
import * as syncService from '@/services/syncService';
import { mockUser, mockAnonymousUser } from '@/__mocks__/firebase';

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

    // Setup mock for onAuthStateChanged to capture the callback
    mockOnAuthStateChanged.mockImplementation((callback) => {
      authStateChangedCallback = callback;
      // Return unsubscribe function
      return vi.fn();
    });

    // Clear window auth context
    (window as any).authContext = undefined;
  });

  afterEach(() => {
    vi.clearAllTimers();
    (window as any).authContext = undefined;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isAnonymous).toBe(false);
    });

    it('should set up auth state listener on mount', () => {
      renderHook(() => useAuth(), { wrapper });

      expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(typeof authStateChangedCallback).toBe('function');
    });

    it('should set up global auth context', () => {
      renderHook(() => useAuth(), { wrapper });

      expect((window as any).authContext).toBeDefined();
      expect((window as any).authContext.user).toBe(null);
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when auth state changes to authenticated user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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

      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await act(async () => {
        vi.advanceTimersByTime(1000); // Advance past the debounce timeout
        await Promise.resolve(); // Allow promises to resolve
      });

      expect(syncService.syncDataFromFirebase).toHaveBeenCalledTimes(1);
      expect(syncService.startPeriodicSync).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should not trigger data sync for anonymous users', async () => {
      vi.useFakeTimers();
      renderHook(() => useAuth(), { wrapper });

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

      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      expect((window as any).authContext.user).toEqual(mockUser);
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
      const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);
      const errorMessage = 'Anonymous login failed';
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
      const mockLoginWithEmail = vi.mocked(firebaseService.loginWithEmail);
      const errorMessage = 'Invalid credentials';
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
      const mockRegisterWithEmail = vi.mocked(firebaseService.registerWithEmail);
      const errorMessage = 'Email already in use';
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
      const mockLoginWithGoogle = vi.mocked(firebaseService.loginWithGoogle);
      const errorMessage = 'Google login cancelled';
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
      const mockResetPassword = vi.mocked(firebaseService.resetPassword);
      const errorMessage = 'Email not found';
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
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockConvertAnonymousAccount.mockResolvedValue(mockUser);
      mockSyncAllDataToFirebase.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First set anonymous user
      await act(async () => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      expect(result.current.user).toEqual(mockAnonymousUser);

      let convertResult;
      await act(async () => {
        convertResult = await result.current.convertToRegistered('test@example.com', 'password123');
      });

      expect(mockConvertAnonymousAccount).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(convertResult).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle convert anonymous account error', async () => {
      const mockConvertAnonymousAccount = vi.mocked(firebaseService.convertAnonymousAccount);
      const errorMessage = 'Email already in use';
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
      const mockUpdateDisplayName = vi.mocked(firebaseService.updateDisplayName);
      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
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
      const mockUpdateDisplayName = vi.mocked(firebaseService.updateDisplayName);
      const errorMessage = 'Update failed';
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
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockLogout.mockResolvedValue(true);
      mockSyncAllDataToFirebase.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First set a registered user
      act(() => {
        authStateChangedCallback?.(mockUser);
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
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockLogout.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First set an anonymous user
      act(() => {
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
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockLogout.mockResolvedValue(true);
      // Mock sync to hang and timeout
      mockSyncAllDataToFirebase.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First set a registered user
      await act(async () => {
        authStateChangedCallback?.(mockUser);
      });

      await act(async () => {
        const logoutPromise = result.current.logout();
        // Fast-forward to trigger timeout
        vi.advanceTimersByTime(5000);
        await logoutPromise;
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBe(null);

      vi.useRealTimers();
    });

    it('should handle logout error', async () => {
      const mockLogout = vi.mocked(firebaseService.logout);
      const errorMessage = 'Logout failed';
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

  describe('Data Sync', () => {
    it('should sync data for registered users', async () => {
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      mockSyncAllDataToFirebase.mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set a registered user
      act(() => {
        authStateChangedCallback?.(mockUser);
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData();
      });

      expect(mockSyncAllDataToFirebase).toHaveBeenCalledTimes(1);
      expect(syncResult).toBe(true);
    });

    it('should not sync data for anonymous users', async () => {
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set an anonymous user
      act(() => {
        authStateChangedCallback?.(mockAnonymousUser);
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData();
      });

      expect(mockSyncAllDataToFirebase).not.toHaveBeenCalled();
      expect(syncResult).toBe(false);
    });

    it('should handle sync errors', async () => {
      const mockSyncAllDataToFirebase = vi.mocked(syncService.syncAllDataToFirebase);
      const errorMessage = 'Sync failed';
      mockSyncAllDataToFirebase.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set a registered user
      act(() => {
        authStateChangedCallback?.(mockUser);
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData();
      });

      expect(syncResult).toBe(false);
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

  describe('Error Handling', () => {
    it('should handle errors in auth operations', async () => {
      const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);

      // First cause an error
      mockLoginAnonymously.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for provider to be ready
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await act(async () => {
        try {
          await result.current.login();
        } catch {
          // Expected to fail - testing error handling
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Then succeed
      mockLoginAnonymously.mockResolvedValueOnce(mockAnonymousUser);

      await act(async () => {
        await result.current.login();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockAnonymousUser);
        // Error should still be there until explicitly cleared
        expect(result.current.error).toBe('First error');
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const unsubscribeMock = vi.fn();

      // Mock the auth state changed to return our unsubscribe function
      mockOnAuthStateChanged.mockImplementation((callback) => {
        // Store the callback to simulate auth state
        authStateChangedCallback = callback;
        // Return our unsubscribe mock
        return unsubscribeMock;
      });

      const { unmount } = renderHook(() => useAuth(), { wrapper });

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
