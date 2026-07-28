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
  linkWithPopup: vi.fn(),
  signInWithCredential: vi.fn(),
  GoogleAuthProvider: Object.assign(
    vi.fn(function GoogleAuthProvider() {
      return {};
    }),
    { credentialFromResult: vi.fn() }
  ),
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
      } = await import('../firebase/auth');

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
      const { loginAnonymously } = await import('../firebase/auth');
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
      const { loginAnonymously } = await import('../firebase/auth');
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
      const { registerWithEmail } = await import('../firebase/auth');

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
      const { loginWithEmail } = await import('../firebase/auth');

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
      const { loginWithGoogle } = await import('../firebase/auth');

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      const result = await loginWithGoogle();

      expect(mockGoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, {});
      expect(result).toEqual(mockUser);
    });

    it('should handle password reset', async () => {
      const { resetPassword } = await import('../firebase/auth');

      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await resetPassword('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, 'test@example.com');
      expect(result).toBe(true);
    });

    it('links the credential and then re-signs in so the provider claim is refreshed', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');

      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      const mockCredential = { providerId: 'password' };
      mockEmailAuthProvider.credential.mockReturnValue(mockCredential);
      // Linking keeps the uid; the re-auth is what flips the session's
      // sign_in_provider away from 'anonymous' for Firestore rules.
      const linkedUser = { ...mockUser, uid: mockAnonymousUser.uid };
      mockLinkWithCredential.mockResolvedValue({ user: linkedUser });
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: linkedUser });

      const result = await convertAnonymousAccount('test@example.com', 'password123');

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockLinkWithCredential).toHaveBeenCalledWith(mockAnonymousUser, mockCredential);
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(result.uid).toBe(mockAnonymousUser.uid);
    });

    it('applies a changed display name after conversion', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');

      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      mockEmailAuthProvider.credential.mockReturnValue({ providerId: 'password' });
      const linkedUser = { ...mockUser, displayName: 'Anonymous User' };
      mockLinkWithCredential.mockResolvedValue({ user: linkedUser });
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: linkedUser });
      mockUpdateProfile.mockResolvedValue(undefined);

      await convertAnonymousAccount('test@example.com', 'password123', 'Permanent Name');

      expect(mockUpdateProfile).toHaveBeenCalledWith(linkedUser, {
        displayName: 'Permanent Name',
      });
    });

    it('flags an existing-account collision with the ACCOUNT_EXISTS code', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');
      const { ACCOUNT_EXISTS, isAccountExistsError } = await import('@/types/errors');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      mockEmailAuthProvider.credential.mockReturnValue({ providerId: 'password' });
      const collision = Object.assign(new Error('already in use'), {
        code: 'auth/email-already-in-use',
      });
      mockLinkWithCredential.mockRejectedValue(collision);

      const error = await convertAnonymousAccount('test@example.com', 'password123').catch(
        (e) => e
      );

      expect(error.code).toBe(ACCOUNT_EXISTS);
      expect(isAccountExistsError(error)).toBe(true);
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('reports a failed post-link sign-in distinctly from a failed link', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');
      const { ACCOUNT_LINKED_NEEDS_SIGNIN, isLinkedNeedsSignInError } =
        await import('@/types/errors');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      mockEmailAuthProvider.credential.mockReturnValue({ providerId: 'password' });
      mockLinkWithCredential.mockResolvedValue({ user: mockUser });
      // The link landed; only the re-auth failed. The account now exists, so
      // retrying the link is wrong — the caller must steer to a sign-in.
      mockSignInWithEmailAndPassword.mockRejectedValue(
        Object.assign(new Error('too many attempts'), { code: 'auth/too-many-requests' })
      );

      const error = await convertAnonymousAccount('test@example.com', 'password123').catch(
        (e) => e
      );

      expect(error.code).toBe(ACCOUNT_LINKED_NEEDS_SIGNIN);
      expect(isLinkedNeedsSignInError(error)).toBe(true);
      consoleSpy.mockRestore();
    });

    it('links Google in place and re-signs in with the popup credential', async () => {
      const { linkGoogleAccount } = await import('../firebase/auth');
      const { linkWithPopup, signInWithCredential, GoogleAuthProvider } =
        await import('firebase/auth');

      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      const linkedUser = { ...mockUser, uid: mockAnonymousUser.uid };
      const popupResult = { user: linkedUser };
      const oauthCredential = { providerId: 'google.com' };
      vi.mocked(linkWithPopup).mockResolvedValue(popupResult as any);
      vi.mocked(GoogleAuthProvider.credentialFromResult).mockReturnValue(oauthCredential as any);
      vi.mocked(signInWithCredential).mockResolvedValue({ user: linkedUser } as any);

      const result = await linkGoogleAccount();

      expect(linkWithPopup).toHaveBeenCalledTimes(1);
      // The popup's own credential is reused — no second popup.
      expect(mockSignInWithPopup).not.toHaveBeenCalled();
      expect(signInWithCredential).toHaveBeenCalledWith(mockAuth, oauthCredential);
      expect(result.uid).toBe(mockAnonymousUser.uid);
    });

    it('flags a Google account already tied to another user', async () => {
      const { linkGoogleAccount } = await import('../firebase/auth');
      const { linkWithPopup } = await import('firebase/auth');
      const { ACCOUNT_EXISTS } = await import('@/types/errors');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockAnonymousUser;
      vi.mocked(linkWithPopup).mockRejectedValue(
        Object.assign(new Error('already in use'), { code: 'auth/credential-already-in-use' })
      );

      const error = await linkGoogleAccount().catch((e) => e);

      expect(error.code).toBe(ACCOUNT_EXISTS);
      consoleSpy.mockRestore();
    });

    it('should handle display name update', async () => {
      const { updateDisplayName } = await import('../firebase/auth');

      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = updatedUser;
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await updateDisplayName('Updated Name');

      expect(mockUpdateProfile).toHaveBeenCalledWith(updatedUser, { displayName: 'Updated Name' });
      expect(result).toEqual(updatedUser);
    });

    it('should handle logout', async () => {
      const { logout } = await import('../firebase/auth');

      mockSignOut.mockResolvedValue(undefined);

      const result = await logout();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { loginAnonymously } = await import('../firebase/auth');
      const { AuthError } = await import('@/types/errors');

      mockSignInAnonymously.mockRejectedValue(new Error('Sign in failed'));

      await expect(loginAnonymously('Test User')).rejects.toThrow(AuthError);
      await expect(loginAnonymously('Test User')).rejects.toThrow('Sign in failed');
    });

    it('should return null when no current user exists for updateDisplayName', async () => {
      const { updateDisplayName } = await import('../firebase/auth');

      mockAuth.currentUser = null;

      const result = await updateDisplayName('Test Name');

      expect(mockUpdateProfile).not.toHaveBeenCalled();
      expect(result).toBe(null);
    });

    it('should throw error when converting non-anonymous account', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error Mock assignment to readonly property for testing
      mockAuth.currentUser = mockUser; // Not anonymous

      await expect(convertAnonymousAccount('test@example.com', 'password123')).rejects.toThrow(
        'User is not anonymous or not logged in'
      );

      consoleSpy.mockRestore();
    });

    it('should throw error when converting account without logged in user', async () => {
      const { convertAnonymousAccount } = await import('../firebase/auth');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.currentUser = null;

      await expect(convertAnonymousAccount('test@example.com', 'password123')).rejects.toThrow(
        'User is not anonymous or not logged in'
      );

      consoleSpy.mockRestore();
    });
  });
});
