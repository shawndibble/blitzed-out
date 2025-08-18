import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AnimatedToken from '../AnimatedToken';
import type { FLIPData } from '../TokenController';
import { useEffect } from 'react';

// Mock Framer Motion
vi.mock('framer-motion', () => {
  // Mock component that properly uses React hooks
  const MockMotionDiv = ({ children, onAnimationComplete, transition, ...props }: any) => {
    useEffect(() => {
      if (typeof transition?.duration === 'number' && onAnimationComplete) {
        const t = setTimeout(() => onAnimationComplete(), transition.duration * 1000);
        return () => clearTimeout(t);
      }
    }, [transition?.duration, onAnimationComplete]);
    return (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    );
  };

  return {
    motion: {
      div: MockMotionDiv,
    },
    useMotionValue: () => ({ get: () => 0, set: () => {} }),
    useTransform: () => ({ get: () => 0 }),
  };
});

// Mock TextAvatar component
vi.mock('@/components/TextAvatar', () => ({
  default: ({ uid, displayName, size }: { uid: string; displayName: string; size: string }) => (
    <div data-testid={`text-avatar-${uid}`} data-size={size}>
      Avatar for {displayName}
    </div>
  ),
}));

describe('AnimatedToken', () => {
  let mockFLIPData: FLIPData;
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFLIPData = {
      from: { x: 0, y: 0, width: 40, height: 40 },
      to: { x: 100, y: 100, width: 40, height: 40 },
      distance: 141.42, // sqrt(100^2 + 100^2)
      duration: 800,
    };

    mockOnComplete = vi.fn();

    // Mock setTimeout for animation completion
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render current player token with special styling', () => {
    const { container } = render(
      <AnimatedToken
        id="player1"
        displayName="Test Player"
        isCurrent={true}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    const token = container.querySelector('.animated-token.current-player');
    expect(token).toBeInTheDocument();
    expect(token).toHaveClass('animated-token', 'current-player');
    expect(screen.getByTestId('text-avatar-player1')).toBeInTheDocument();
    expect(screen.getByTestId('text-avatar-player1')).toHaveAttribute('data-size', 'medium');
  });

  it('should render other player token with standard styling', () => {
    const { container } = render(
      <AnimatedToken
        id="player2"
        displayName="Other Player"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    const token = container.querySelector('.animated-token.other-player');
    expect(token).toBeInTheDocument();
    expect(token).toHaveClass('animated-token', 'other-player');
    expect(screen.getByTestId('text-avatar-player2')).toBeInTheDocument();
  });

  it('should display player name correctly', () => {
    render(
      <AnimatedToken
        id="player3"
        displayName="John Doe"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Avatar for John Doe')).toBeInTheDocument();
  });

  it('should call onAnimationComplete after duration', () => {
    render(
      <AnimatedToken
        id="player4"
        displayName="Test Player"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast-forward past the animation duration
    vi.advanceTimersByTime(mockFLIPData.duration + 10);

    expect(mockOnComplete).toHaveBeenCalledOnce();
  });

  it('should have correct motion styles', () => {
    const { container } = render(
      <AnimatedToken
        id="player5"
        displayName="Test Player"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    const token = container.querySelector('.animated-token.other-player');
    expect(token).toBeInTheDocument();
    expect(token).toHaveStyle({
      position: 'absolute',
      zIndex: '1000',
      pointerEvents: 'none',
      willChange: 'transform',
    });
  });

  it('should handle different FLIP data correctly', () => {
    const differentFLIPData: FLIPData = {
      from: { x: 50, y: 25, width: 40, height: 40 },
      to: { x: 200, y: 150, width: 40, height: 40 },
      distance: 200,
      duration: 1000,
    };

    render(
      <AnimatedToken
        id="player6"
        displayName="Test Player"
        isCurrent={true}
        flipData={differentFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    // Should render without errors with different data
    expect(screen.getByTestId('text-avatar-player6')).toBeInTheDocument();
  });

  it('should cleanup timer on unmount', () => {
    const { unmount } = render(
      <AnimatedToken
        id="player7"
        displayName="Test Player"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    // Unmount before animation completes
    unmount();

    // Fast-forward past when animation would have completed
    vi.advanceTimersByTime(1000);

    // Should not call the callback after unmount
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('should handle missing onAnimationComplete gracefully', () => {
    expect(() => {
      render(
        <AnimatedToken
          id="player8"
          displayName="Test Player"
          isCurrent={false}
          flipData={mockFLIPData}
          // No onAnimationComplete provided
        />
      );
    }).not.toThrow();
  });

  it('should render glow effect for current player only', () => {
    const { rerender, container } = render(
      <AnimatedToken
        id="player9"
        displayName="Test Player"
        isCurrent={true}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    // Check for the main animated token with current-player class
    const currentPlayerToken = container.querySelector('.animated-token.current-player');
    expect(currentPlayerToken).toBeInTheDocument();
    expect(currentPlayerToken).toHaveClass('current-player');

    // Re-render as non-current player
    rerender(
      <AnimatedToken
        id="player9"
        displayName="Test Player"
        isCurrent={false}
        flipData={mockFLIPData}
        onAnimationComplete={mockOnComplete}
      />
    );

    const otherPlayerToken = container.querySelector('.animated-token.other-player');
    expect(otherPlayerToken).toBeInTheDocument();
    expect(otherPlayerToken).toHaveClass('other-player');
    expect(otherPlayerToken).not.toHaveClass('current-player');
  });
});
