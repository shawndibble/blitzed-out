/**
 * Anonymous upgrade path: a guest creating an account must LINK (uid preserved,
 * their published packs stay theirs), never register a fresh account.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCOUNT_EXISTS, ACCOUNT_LINKED_NEEDS_SIGNIN, AuthError } from '@/types/errors';
import CreateAccount from '../CreateAccount';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

const mockAuth = {
  user: { uid: 'anon-1', displayName: 'Guest Name', isAnonymous: true } as {
    uid: string;
    displayName: string | null;
    isAnonymous: boolean;
  } | null,
  isAnonymous: true,
  hasPermanentProvider: false,
  register: vi.fn(async () => ({ uid: 'new-1' })),
  convertToRegistered: vi.fn(async () => ({ uid: 'anon-1' })),
};
vi.mock('@/hooks/useAuth', () => ({
  default: () => mockAuth,
  useAuth: () => mockAuth,
}));

function fillForm({ email = 'me@example.com', password = 'hunter2' } = {}) {
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^confirmPassword/i), { target: { value: password } });
}

describe('CreateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAnonymous = true;
    mockAuth.hasPermanentProvider = false;
    mockAuth.user = { uid: 'anon-1', displayName: 'Guest Name', isAnonymous: true };
    mockAuth.convertToRegistered.mockResolvedValue({ uid: 'anon-1' });
  });

  it('links the anonymous account instead of registering a new one', async () => {
    const onSuccess = vi.fn();
    render(<CreateAccount onSwitchToLogin={vi.fn()} onSuccess={onSuccess} isAnonymous />);

    // The guest's existing display name carries over by default.
    expect(screen.getByLabelText(/^displayName/i)).toHaveValue('Guest Name');

    fillForm();
    fireEvent.click(screen.getByText('linkAccount'));

    await waitFor(() => expect(mockAuth.convertToRegistered).toHaveBeenCalled());
    expect(mockAuth.convertToRegistered).toHaveBeenCalledWith(
      'me@example.com',
      'hunter2',
      'Guest Name'
    );
    expect(mockAuth.register).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ uid: 'anon-1' }));
  });

  it('registers normally when there is no anonymous account to upgrade', async () => {
    mockAuth.isAnonymous = false;
    mockAuth.user = null;
    const onSuccess = vi.fn();
    render(<CreateAccount onSwitchToLogin={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/^displayName/i), { target: { value: 'Fresh' } });
    fillForm();
    fireEvent.click(screen.getByText('createAccount'));

    await waitFor(() => expect(mockAuth.register).toHaveBeenCalled());
    expect(mockAuth.convertToRegistered).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ uid: 'new-1' }));
  });

  it('offers to sign in instead when the email already has an account', async () => {
    mockAuth.convertToRegistered.mockRejectedValue(
      new AuthError('An account with this email already exists', ACCOUNT_EXISTS)
    );
    const onSwitchToLogin = vi.fn();
    render(<CreateAccount onSwitchToLogin={onSwitchToLogin} isAnonymous />);

    fillForm({ email: 'taken@example.com' });
    fireEvent.click(screen.getByText('linkAccount'));

    await screen.findByText('accountExistsUseSignIn');
    fireEvent.click(screen.getByText('signInInstead'));
    // Hands the typed email to the login view so they do not retype it.
    expect(onSwitchToLogin).toHaveBeenCalledWith('taken@example.com');
  });

  it('steers to sign-in when the link landed but the session did not', async () => {
    mockAuth.convertToRegistered.mockRejectedValue(
      new AuthError('Too many login attempts', ACCOUNT_LINKED_NEEDS_SIGNIN)
    );
    const onSwitchToLogin = vi.fn();
    render(<CreateAccount onSwitchToLogin={onSwitchToLogin} isAnonymous />);

    fillForm({ email: 'half@example.com' });
    fireEvent.click(screen.getByText('linkAccount'));

    // Distinct copy: the account exists now, only the session is unfinished.
    await screen.findByText('accountLinkedFinishSignIn');
    fireEvent.click(screen.getByText('signInInstead'));
    expect(onSwitchToLogin).toHaveBeenCalledWith('half@example.com');
  });

  it('still performs the upgrade when no success handler is attached', async () => {
    // Guards the optional-call trap: `onSuccess?.(await link())` would skip the
    // link entirely whenever the caller passes no handler.
    render(<CreateAccount onSwitchToLogin={vi.fn()} isAnonymous />);

    fillForm();
    fireEvent.click(screen.getByText('linkAccount'));

    await waitFor(() => expect(mockAuth.convertToRegistered).toHaveBeenCalled());
  });

  it('refuses to register a second account for a half-linked session', async () => {
    // Link landed, re-auth did not: Firebase flipped isAnonymous, but the token
    // provider is still anonymous. Registering here would abandon the account
    // that was just linked to this uid.
    mockAuth.isAnonymous = false;
    mockAuth.hasPermanentProvider = false;
    render(<CreateAccount onSwitchToLogin={vi.fn()} />);

    fillForm();
    fireEvent.click(screen.getByText('createAccount'));

    expect(screen.getByText('accountLinkedFinishSignIn')).toBeInTheDocument();
    expect(mockAuth.register).not.toHaveBeenCalled();
    expect(mockAuth.convertToRegistered).not.toHaveBeenCalled();
  });

  it('shows an ordinary error without the sign-in offer', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAuth.convertToRegistered.mockRejectedValue(new AuthError('Password is too weak', 'WEAK'));
    render(<CreateAccount onSwitchToLogin={vi.fn()} isAnonymous />);

    fillForm();
    fireEvent.click(screen.getByText('linkAccount'));

    await screen.findByText('Password is too weak');
    expect(screen.queryByText('signInInstead')).toBeNull();
    consoleSpy.mockRestore();
  });

  it('rejects mismatched passwords before touching auth', () => {
    render(<CreateAccount onSwitchToLogin={vi.fn()} isAnonymous />);

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'me@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'hunter2' } });
    fireEvent.change(screen.getByLabelText(/^confirmPassword/i), { target: { value: 'hunter3' } });
    fireEvent.click(screen.getByText('linkAccount'));

    expect(screen.getByText('passwordsDoNotMatch')).toBeInTheDocument();
    expect(mockAuth.convertToRegistered).not.toHaveBeenCalled();
  });
});
