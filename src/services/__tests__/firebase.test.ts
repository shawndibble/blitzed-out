import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Auth module at the top level
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
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

// Mock variable declarations for easier test access
let mockCreateUserWithEmailAndPassword: any;
let mockSignInWithEmailAndPassword: any;
let mockSignInWithPopup: any;
let mockSignOut: any;
let mockUpdateProfile: any;
let mockSendPasswordResetEmail: any;
let mockLinkWithCredential: any;
let mockGoogleAuthProvider: any;
let mockEmailAuthProvider: any;
let mockSignInAnonymously: any;

// This test file validates the Firebase service functions behavior
// by ensuring they call the right Firebase methods with correct parameters

describe('Firebase Authentication Service', () => {
  // Mock user objects
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    isAnonymous: false,
    emailVerified: true,
    photoURL: null,
  };

  const mockAnonymousUser = {
    uid: 'anonymous-user-123',
    email: null,
    displayName: 'Anonymous User',
    isAnonymous: true,
    emailVerified: false,
    photoURL: null,
  };

  // Mock the Firebase auth functions that our service uses
  const mockAuth = {
    currentUser: null,
  };

  beforeEach(async () => {
    mockAuth.currentUser = null;

    // Setup the getAuth mock to return our mock auth object
    const {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signInWithPopup,
      signOut,
      updateProfile,
      sendPasswordResetEmail,
      linkWithCredential,
      GoogleAuthProvider,
      EmailAuthProvider,
      signInAnonymously,
    } = await import('firebase/auth');

    vi.clearAllMocks();
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    // Assign the mocked functions to our variables for easier access in tests
    mockCreateUserWithEmailAndPassword = vi.mocked(createUserWithEmailAndPassword);
    mockSignInWithEmailAndPassword = vi.mocked(signInWithEmailAndPassword);
    mockSignInWithPopup = vi.mocked(signInWithPopup);
    mockSignOut = vi.mocked(signOut);
    mockUpdateProfile = vi.mocked(updateProfile);
    mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockLinkWithCredential = vi.mocked(linkWithCredential);
    mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
    mockEmailAuthProvider = vi.mocked(EmailAuthProvider);
    mockSignInAnonymously = vi.mocked(signInAnonymously);
  });

  describe('Authentication Service Functions', () => {
    it('should test that Firebase service functions are available', async () => {
      // Import the service functions dynamically to avoid hoisting issues
      const {
        loginAnonymously,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        updateDisplayName,
        resetPassword,
        convertAnonymousAccount,
        logout,
      } = await import('../firebase');

      // Test that all functions are available
      expect(typeof loginAnonymously).toBe('function');
      expect(typeof loginWithEmail).toBe('function');
      expect(typeof loginWithGoogle).toBe('function');
      expect(typeof registerWithEmail).toBe('function');
      expect(typeof updateDisplayName).toBe('function');
      expect(typeof resetPassword).toBe('function');
      expect(typeof convertAnonymousAccount).toBe('function');
      expect(typeof logout).toBe('function');
    });

    it('should call Firebase auth functions with correct parameters', async () => {
      const { loginAnonymously } = await import('../firebase');
      const { getAuth, signInAnonymously, updateProfile } = await import('firebase/auth');

      // Setup mocks
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      vi.mocked(signInAnonymously).mockResolvedValue({ user: mockAnonymousUser } as any);
      vi.mocked(updateProfile).mockResolvedValue(undefined);

      // Test the function
      const result = await loginAnonymously('Test User');

      // Verify Firebase functions were called correctly
      expect(getAuth).toHaveBeenCalled();
      expect(signInAnonymously).toHaveBeenCalledWith(mockAuth);
      expect(updateProfile).toHaveBeenCalledWith(mockAnonymousUser, { displayName: 'Test User' });
      expect(result).toEqual(mockAnonymousUser);
    });

    it('should handle anonymous login without display name', async () => {
      const { loginAnonymously } = await import('../firebase');
      const { signInAnonymously, updateProfile } = await import('firebase/auth');

      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      vi.mocked(signInAnonymously).mockResolvedValue({ user: mockAnonymousUser } as any);
      vi.mocked(updateProfile).mockResolvedValue(undefined);

      const result = await loginAnonymously();

      expect(updateProfile).toHaveBeenCalledWith(mockAnonymousUser, { displayName: '' });
      expect(result).toEqual(mockAnonymousUser);
    });

    it('should handle email registration', async () => {
      const { registerWithEmail } = await import('../firebase');

      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await registerWithEmail('test@example.com', 'password123', 'Test User');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(result).toEqual(mockUser);
    });

    it('should handle email login', async () => {
      const { loginWithEmail } = await import('../firebase');

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await loginWithEmail('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle Google login', async () => {
      const { loginWithGoogle } = await import('../firebase');

      const mockProvider = {};
      mockGoogleAuthProvider.mockReturnValue(mockProvider);
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      const result = await loginWithGoogle();

      expect(mockGoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, mockProvider);
      expect(result).toEqual(mockUser);
    });

    it('should handle password reset', async () => {
      const { resetPassword } = await import('../firebase');

      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await resetPassword('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, 'test@example.com');
      expect(result).toBe(true);
    });

    it('should handle account conversion', async () => {
      const { convertAnonymousAccount } = await import('../firebase');

      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      const mockCredential = { providerId: 'password' };
      mockEmailAuthProvider.credential.mockReturnValue(mockCredential);
      mockLinkWithCredential.mockResolvedValue({ user: mockUser });

      const result = await convertAnonymousAccount('test@example.com', 'password123');

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockLinkWithCredential).toHaveBeenCalledWith(mockAnonymousUser, mockCredential);
      expect(result).toEqual(mockUser);
    });

    it('should handle display name update', async () => {
      const { updateDisplayName } = await import('../firebase');

      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = updatedUser;
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await updateDisplayName('Updated Name');

      expect(mockUpdateProfile).toHaveBeenCalledWith(updatedUser, { displayName: 'Updated Name' });
      expect(result).toEqual(updatedUser);
    });

    it('should handle logout', async () => {
      const { logout } = await import('../firebase');

      mockSignOut.mockResolvedValue(undefined);

      const result = await logout();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { loginAnonymously } = await import('../firebase');
      const { AuthError } = await import('@/types/errors');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignInAnonymously.mockRejectedValue(new Error('Sign in failed'));

      await expect(loginAnonymously('Test User')).rejects.toThrow(AuthError);
      await expect(loginAnonymously('Test User')).rejects.toThrow('Sign in failed');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null when no current user exists for updateDisplayName', async () => {
      const { updateDisplayName } = await import('../firebase');

      mockAuth.currentUser = null;

      const result = await updateDisplayName('Test Name');

      expect(mockUpdateProfile).not.toHaveBeenCalled();
      expect(result).toBe(null);
    });

    it('should throw error when converting non-anonymous account', async () => {
      const { convertAnonymousAccount } = await import('../firebase');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockUser; // Not anonymous

      await expect(convertAnonymousAccount('test@example.com', 'password123')).rejects.toThrow(
        'User is not anonymous or not logged in'
      );

      consoleSpy.mockRestore();
    });

    it('should throw error when converting account without logged in user', async () => {
      const { convertAnonymousAccount } = await import('../firebase');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.currentUser = null;

      await expect(convertAnonymousAccount('test@example.com', 'password123')).rejects.toThrow(
        'User is not anonymous or not logged in'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getUserList', () => {
    it('should return a function when called with valid parameters', async () => {
      // Simple test to verify getUserList returns unsubscribe function
      // This prevents regression of infinite loop bug where no cleanup was possible
      const { getUserList } = await import('../firebase');

      const callback = vi.fn();
      const result = getUserList('TEST_ROOM', callback);

      // The key fix: getUserList should return a cleanup function
      // Before the fix, it returned void, making cleanup impossible
      expect(typeof result).toBe('function');
    });

    it('should return undefined for invalid roomId to prevent unnecessary listeners', async () => {
      const { getUserList } = await import('../firebase');

      const callback = vi.fn();

      expect(getUserList(null, callback)).toBeUndefined();
      expect(getUserList(undefined, callback)).toBeUndefined();
      expect(getUserList('', callback)).toBeUndefined();
    });
  });
});
