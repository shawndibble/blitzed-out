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
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
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
    expect(onSuccess).toHaveBeenCalledWith({ uid: 'anon-1' });
  });

  it('signs in with Google when there is no account to upgrade', async () => {
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} />);

    fireEvent.click(screen.getByText('Sign in with Google'));

    await waitFor(() => expect(mockAuth.loginGoogle).toHaveBeenCalled());
    expect(mockAuth.linkGoogle).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ uid: 'g-1' });
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
    expect(onSuccess).toHaveBeenCalledWith({ uid: 'g-1' });
  });

  it('offers a plain sign-in when the Google account already exists', async () => {
    mockAuth.linkGoogle.mockRejectedValue(
      new AuthError('An account with this email already exists', ACCOUNT_EXISTS)
    );
    const onSuccess = vi.fn();
    render(<SocialLoginButtons onSuccess={onSuccess} isLinking />);

    fireEvent.click(screen.getByText('Link with Google'));

    // Google-specific copy: no email was ever typed on this path.
    await screen.findByText('googleAccountExistsUseSignIn');
    // The offer is an action, not just a relabelled button.
    fireEvent.click(screen.getByText('signInInstead'));

    await waitFor(() => expect(mockAuth.loginGoogle).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalledWith({ uid: 'g-1' });
  });

  it('treats a provider already linked to this user as an unfinished session', async () => {
    // The uid does not change here, so the "already taken" warning would lie.
    mockAuth.linkGoogle.mockRejectedValue(
      Object.assign(new Error('already linked'), { code: 'auth/provider-already-linked' })
    );
    render(<SocialLoginButtons isLinking />);

    fireEvent.click(screen.getByText('Link with Google'));

    await screen.findByText('accountLinkedFinishSignIn');
    expect(screen.queryByText('googleAccountExistsUseSignIn')).toBeNull();
  });
});
