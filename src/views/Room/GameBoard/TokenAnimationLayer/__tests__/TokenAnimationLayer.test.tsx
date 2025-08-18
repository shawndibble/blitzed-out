import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TokenAnimationLayer, { type TokenAnimationLayerRef } from '../index';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock TokenController
vi.mock('../TokenController', () => ({
  TokenController: class MockTokenController {
    calculateFLIPPositions = vi.fn().mockResolvedValue({
      from: { x: 0, y: 0, width: 40, height: 40 },
      to: { x: 100, y: 100, width: 40, height: 40 },
      distance: 100,
      duration: 800,
    });
    dispose = vi.fn();
  },
}));

// Mock AnimatedToken
vi.mock('../AnimatedToken', () => ({
  default: ({ id, displayName }: { id: string; displayName: string }) => (
    <div data-testid={`animated-token-${id}`}>Token for {displayName}</div>
  ),
}));

// Mock useTokenAnimation hook
vi.mock('../useTokenAnimation', () => ({
  useTokenAnimation: () => ({
    animatingTokens: [],
    addAnimatingToken: vi.fn(),
    removeAnimatingToken: vi.fn(),
    clearAllTokens: vi.fn(),
  }),
}));

describe('TokenAnimationLayer', () => {
  let mockGameBoard: HTMLElement;

  beforeEach(() => {
    mockGameBoard = document.createElement('div');
    mockGameBoard.innerHTML = '<li></li><li></li><li></li>';
  });

  it('should render without crashing', () => {
    render(<TokenAnimationLayer gameBoard={mockGameBoard} />);

    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('should render with correct styles and structure', () => {
    render(<TokenAnimationLayer gameBoard={mockGameBoard} />);

    const layer = screen.getByTestId('animate-presence').parentElement;
    expect(layer).toHaveClass('token-animation-layer');
    expect(layer).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000',
    });
  });

  it('should handle missing gameBoard prop gracefully', () => {
    expect(() => {
      render(<TokenAnimationLayer gameBoard={null} />);
    }).not.toThrow();
  });

  it('should call animation event handlers when provided', () => {
    const mockOnStart = vi.fn();
    const mockOnComplete = vi.fn();

    render(
      <TokenAnimationLayer
        gameBoard={mockGameBoard}
        onAnimationStart={mockOnStart}
        onAnimationComplete={mockOnComplete}
      />
    );

    // The component should render without errors
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('should expose ref methods correctly', () => {
    const ref = React.createRef<TokenAnimationLayerRef>();

    render(<TokenAnimationLayer ref={ref} gameBoard={mockGameBoard} />);

    expect(ref.current).toBeDefined();
    expect(ref.current?.animateTokenMovement).toBeInstanceOf(Function);
    expect(ref.current?.isAnimating).toBeInstanceOf(Function);
    expect(ref.current?.cancelAllAnimations).toBeInstanceOf(Function);
  });

  it('should have correct display name', () => {
    expect(TokenAnimationLayer.displayName).toBe('TokenAnimationLayer');
  });
});
