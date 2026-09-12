import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, AuthContextType } from '@/context/auth';
import useMessages from '@/context/hooks/useMessages';

// Real UnauthenticatedApp pulls in i18next/MUI/GameGuide; stand in a component that
// exercises the same context dependency (`useMessages`) the crash came from.
vi.mock('@/views/UnauthenticatedApp', () => ({
  default: function StubUnauthenticatedApp() {
    const { isLoading } = useMessages();
    return <div data-testid="unauthenticated-app">loading:{String(isLoading)}</div>;
  },
}));
vi.mock('@/views/PackCreator', () => ({ default: () => <div>pack creator</div> }));
vi.mock('@/views/Room', () => ({ default: () => <div>room</div> }));
vi.mock('@/views/GameSettings', () => ({ default: () => <div>game settings</div> }));
vi.mock('@/views/Cast', () => ({ default: () => <div>cast</div> }));

vi.mock('@/services/firebase/chat');
vi.mock('@/services/firebase/schedule');

import RouterSetup from '@/components/RouterSetup';

const unauthenticatedAuth: AuthContextType = {
  user: null,
  loading: false,
  initializing: false,
  error: null,
  syncStatus: 'idle',
  login: vi.fn(),
  loginEmail: vi.fn(),
  loginGoogle: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
  forgotPassword: vi.fn(),
  convertToRegistered: vi.fn(),
  linkGoogle: vi.fn(),
  logout: vi.fn(),
  wipeAllData: vi.fn(),
  syncData: vi.fn(),
  isAnonymous: true,
  hasPermanentProvider: false,
} as unknown as AuthContextType;

describe('RouterSetup /packs/create for a logged-out visitor', () => {
  it('renders UnauthenticatedApp without throwing on missing MessagesContext', async () => {
    window.history.pushState({}, '', '/packs/create');

    render(
      <AuthContext.Provider value={unauthenticatedAuth}>
        <RouterSetup />
      </AuthContext.Provider>
    );

    expect(await screen.findByTestId('unauthenticated-app')).toBeInTheDocument();
  });
});
