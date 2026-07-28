/**
 * Google path of the anonymous upgrade. Linking must reuse the popup's own
 * credential (no second popup) and must not silently sign into a new uid.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCOUNT_EXISTS, ACCOUNT_LINKED_NEEDS_SIGNIN, AuthError } from '@/types/errors';
import SocialLoginButtons from '../SocialLoginButtons';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
vi.mock('i18next', () => ({ t: (key: string, fallback?: string) => fallback ?? key }));
vi.mock('@mui/icons-material/Google', () => ({ default: () => null }));

const mockAuth = {
  loginGoogle: vi.fn(async () => ({ uid: 'g-1' })),
  linkGoogle: vi.fn(async () => ({ uid: 'anon-1' })),
};
vi.mock('@/hooks/useAuth', () => ({
  default: () => mockAuth,
  useAuth: () => mockAuth,
}));

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.linkGoogle.mockResolvedValue({ uid: 'anon-1' });
  });

  it('links Google in place when upgrading an anonymous account', async () => {
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} isLinking />);

    fireEvent.click(screen.getByText('Link with Google'));

    await waitFor(() => expect(mockAuth.linkGoogle).toHaveBeenCalled());
    expect(mockAuth.loginGoogle).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('linked');
  });

  it('signs in with Google when there is no account to upgrade', async () => {
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} />);

    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => expect(mockAuth.loginGoogle).toHaveBeenCalled());
    expect(mockAuth.linkGoogle).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('signedIn');
  });

  it('offers a plain sign-in when the link landed but the session did not', async () => {
    mockAuth.linkGoogle.mockRejectedValue(
      new AuthError('Network error', ACCOUNT_LINKED_NEEDS_SIGNIN)
    );
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} isLinking />);

    fireEvent.click(screen.getByText('Link with Google'));

    await screen.findByText('accountLinkedFinishSignIn');
    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => expect(mockAuth.loginGoogle).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalledWith('signedIn');
  });

  it('offers a plain sign-in when the Google account already exists', async () => {
    mockAuth.linkGoogle.mockRejectedValue(
      new AuthError('An account with this email already exists', ACCOUNT_EXISTS)
    );
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} isLinking />);

    fireEvent.click(screen.getByText('Link with Google'));

    await screen.findByText('accountExistsUseSignIn');
    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => expect(mockAuth.loginGoogle).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalledWith('signedIn');
  });
});
