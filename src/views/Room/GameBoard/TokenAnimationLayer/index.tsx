import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import AnimatedToken from './AnimatedToken';
import { TokenController } from './TokenController';
import { useTokenAnimation } from './useTokenAnimation';
import './styles.css';

export interface TokenPosition {
  playerId: string;
  displayName: string;
  fromTile: number;
  toTile: number;
  isCurrent?: boolean;
}

export interface TokenAnimationLayerProps {
  gameBoard: Element | null;
  onAnimationComplete?: (playerId: string) => void;
  onAnimationStart?: (playerId: string) => void;
  onAnimationProgress?: (playerId: string, progress: number, currentY: number) => void;
}

export interface TokenAnimationLayerRef {
  animateTokenMovement: (tokenPosition: TokenPosition) => Promise<void>;
  isAnimating: () => boolean;
  cancelAllAnimations: () => void;
}

const TokenAnimationLayer = forwardRef<TokenAnimationLayerRef, TokenAnimationLayerProps>(
  ({ gameBoard, onAnimationComplete, onAnimationStart, onAnimationProgress }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<TokenController | null>(null);

    const { animatingTokens, addAnimatingToken, removeAnimatingToken, clearAllTokens } =
      useTokenAnimation();

    // Initialize controller when gameBoard is available
    useEffect(() => {
      if (gameBoard && !controllerRef.current) {
        controllerRef.current = new TokenController(gameBoard);
      }
    }, [gameBoard]);

    // Expose animation methods to parent
    useImperativeHandle(
      ref,
      () => ({
        animateTokenMovement: async (tokenPosition: TokenPosition) => {
          if (!controllerRef.current) {
            console.warn('TokenController not initialized');
            return;
          }

          const { playerId, displayName, fromTile, toTile, isCurrent } = tokenPosition;

          try {
            // Notify animation start
            onAnimationStart?.(playerId);

            // Calculate FLIP positions
            const flipData = await controllerRef.current.calculateFLIPPositions(fromTile, toTile);

            if (!flipData) {
              console.warn(`Unable to calculate positions for player ${playerId}`);
              return;
            }

            // Add token to animation state
            const tokenData = {
              id: playerId,
              displayName,
              fromTile,
              toTile,
              isCurrent: isCurrent || false,
              flipData,
              startTime: Date.now(),
              onAnimationProgress: onAnimationProgress,
            };

            addAnimatingToken(tokenData);

            // Wait for animation to complete (800ms default duration)
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Remove token from animation state
            removeAnimatingToken(playerId);

            // Notify animation complete
            onAnimationComplete?.(playerId);
          } catch (error) {
            console.error('Token animation failed:', error);
            removeAnimatingToken(playerId);
          }
        },

        isAnimating: () => animatingTokens.length > 0,

        cancelAllAnimations: () => {
          clearAllTokens();
        },
      }),
      [
        animatingTokens.length,
        addAnimatingToken,
        removeAnimatingToken,
        clearAllTokens,
        onAnimationComplete,
        onAnimationStart,
        onAnimationProgress,
      ]
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (controllerRef.current) {
          controllerRef.current.dispose();
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="token-animation-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
          overflow: 'hidden', // Prevent animation tokens from going outside bounds
        }}
      >
        <AnimatePresence mode="wait">
          {animatingTokens.map((token) => (
            <AnimatedToken
              key={token.id}
              id={token.id}
              displayName={token.displayName}
              isCurrent={token.isCurrent}
              flipData={token.flipData}
              onAnimationComplete={() => removeAnimatingToken(token.id)}
              onAnimationProgress={token.onAnimationProgress}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

TokenAnimationLayer.displayName = 'TokenAnimationLayer';

export default TokenAnimationLayer;
