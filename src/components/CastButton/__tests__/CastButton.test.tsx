import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';
import CastButton from '../index';

// Mock i18next
vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'TESTROOM' }),
  };
});

// Create a simple mock for Cast API
const mockEndCurrentSession = vi.fn();
const mockRequestSession = vi.fn().mockResolvedValue({});

// Mock window.cast and related properties
Object.defineProperty(window, 'cast', {
  value: {
    framework: {
      CastContext: {
        getInstance: () => ({
          setOptions: vi.fn(),
          getCurrentSession: vi.fn(),
          addEventListener: vi.fn(),
          requestSession: mockRequestSession,
          endCurrentSession: mockEndCurrentSession,
        }),
      },
      CastContextEventType: {
        SESSION_STATE_CHANGED: 'SESSION_STATE_CHANGED',
      },
      SessionState: {
        SESSION_STARTED: 'SESSION_STARTED',
        SESSION_ENDED: 'SESSION_ENDED',
      },
    },
  },
  writable: true,
});

Object.defineProperty(window, 'chrome', {
  value: {
    cast: {
      AutoJoinPolicy: {
        ORIGIN_SCOPED: 'ORIGIN_SCOPED',
      },
    },
  },
  writable: true,
});

// Force Cast API to be ready
Object.defineProperty(window, '__castApiInitialized', {
  value: true,
  writable: true,
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CastButton Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.__castApiInitialized = true;
  });

  describe('State Management', () => {
    it('should render the cast button when API is ready', async () => {
      render(
        <TestWrapper>
          <CastButton />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Session control', () => {
    it('requests a cast session when clicked while not casting', async () => {
      render(
        <TestWrapper>
          <CastButton />
        </TestWrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      expect(mockRequestSession).toHaveBeenCalledTimes(1);
      expect(mockEndCurrentSession).not.toHaveBeenCalled();
    });
  });
});
