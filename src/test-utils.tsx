import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider } from '@/context/auth';
import { MessagesProvider } from '@/context/messages';
import { UserListProvider } from '@/context/userList';
import { ScheduleProvider } from '@/context/schedule';
import darkTheme from '@/theme';
import { vi } from 'vitest';

// Mock the Firebase services and context providers
vi.mock('@/services/firebase');
vi.mock('@/services/syncService');

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
  initialRoute?: string;
  withAuth?: boolean;
  withMessages?: boolean;
  withUserList?: boolean;
  withSchedule?: boolean;
}

// All providers wrapper
// eslint-disable-next-line react-refresh/only-export-components
function AllTheProviders({
  children,
  withAuth = true,
  withMessages = true,
  withUserList = true,
  withSchedule = true,
}: {
  children: ReactNode;
  withAuth?: boolean;
  withMessages?: boolean;
  withUserList?: boolean;
  withSchedule?: boolean;
}) {
  let wrappedChildren = children;

  // Wrap with context providers based on options
  if (withSchedule) {
    wrappedChildren = <ScheduleProvider>{wrappedChildren}</ScheduleProvider>;
  }

  if (withUserList) {
    wrappedChildren = <UserListProvider>{wrappedChildren}</UserListProvider>;
  }

  if (withMessages) {
    wrappedChildren = <MessagesProvider>{wrappedChildren}</MessagesProvider>;
  }

  if (withAuth) {
    wrappedChildren = <AuthProvider>{wrappedChildren}</AuthProvider>;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>{wrappedChildren}</BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

// Custom render function
function customRender(
  ui: ReactElement,
  {
    initialRoute = '/',
    withAuth = true,
    withMessages = true,
    withUserList = true,
    withSchedule = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllTheProviders
      withAuth={withAuth}
      withMessages={withMessages}
      withUserList={withUserList}
      withSchedule={withSchedule}
    >
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Render with only specific providers
function renderWithAuth(ui: ReactElement, options?: CustomRenderOptions) {
  return customRender(ui, {
    withAuth: true,
    withMessages: false,
    withUserList: false,
    withSchedule: false,
    ...options,
  });
}

function renderWithMessages(ui: ReactElement, options?: CustomRenderOptions) {
  return customRender(ui, {
    withAuth: true,
    withMessages: true,
    withUserList: false,
    withSchedule: false,
    ...options,
  });
}

function renderWithUserList(ui: ReactElement, options?: CustomRenderOptions) {
  return customRender(ui, {
    withAuth: true,
    withMessages: false,
    withUserList: true,
    withSchedule: false,
    ...options,
  });
}

function renderWithSchedule(ui: ReactElement, options?: CustomRenderOptions) {
  return customRender(ui, {
    withAuth: true,
    withMessages: false,
    withUserList: false,
    withSchedule: true,
    ...options,
  });
}

// Minimal render without any context providers (useful for testing components in isolation)
function renderWithoutProviders(ui: ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>{children}</BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Helper function to create mock user objects
export function createMockUser(overrides = {}) {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    isAnonymous: false,
    emailVerified: true,
    photoURL: null,
    phoneNumber: null,
    providerId: 'firebase',
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    metadata: {
      creationTime: '2024-01-01T00:00:00.000Z',
      lastSignInTime: '2024-01-01T00:00:00.000Z',
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    toJSON: vi.fn().mockReturnValue({}),
    ...overrides,
  };
}

// Helper function to create mock anonymous user
export function createMockAnonymousUser(overrides = {}) {
  return {
    uid: 'anonymous-user-123',
    email: null,
    displayName: 'Anonymous User',
    isAnonymous: true,
    emailVerified: false,
    photoURL: null,
    phoneNumber: null,
    providerId: 'firebase',
    getIdToken: vi.fn().mockResolvedValue('mock-anonymous-token'),
    getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-anonymous-token' }),
    metadata: {
      creationTime: '2024-01-01T00:00:00.000Z',
      lastSignInTime: '2024-01-01T00:00:00.000Z',
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    toJSON: vi.fn().mockReturnValue({}),
    ...overrides,
  };
}

// Helper to wait for async operations
export function waitFor(callback: () => void | Promise<void>, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = async () => {
      try {
        await callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(checkCondition, 10);
        }
      }
    };

    checkCondition();
  });
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Override render with our custom render
export {
  customRender as render,
  renderWithAuth,
  renderWithMessages,
  renderWithUserList,
  renderWithSchedule,
  renderWithoutProviders,
};
