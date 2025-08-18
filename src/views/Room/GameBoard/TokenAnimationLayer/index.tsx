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

    // Initialize/rebind controller when gameBoard element changes
    useEffect(() => {
      if (!gameBoard) {
        controllerRef.current?.dispose();
        controllerRef.current = null;
        return;
      }
      // If a different element instance is provided, re-create controller
      controllerRef.current?.dispose();
      controllerRef.current = new TokenController(gameBoard);
      return () => {
        controllerRef.current?.dispose();
        controllerRef.current = null;
      };
    }, [gameBoard]);

    // Expose animation methods to parent
    useImperativeHandle(
      ref,
      () => ({
        animateTokenMovement: async (tokenPosition: TokenPosition) => {
          if (!controllerRef.current) {
            // TokenController not initialized - exit silently
            return;
          }

          const { playerId, displayName, fromTile, toTile, isCurrent } = tokenPosition;

          try {
            // Notify animation start
            onAnimationStart?.(playerId);

            // Calculate FLIP positions
            const flipData = await controllerRef.current.calculateFLIPPositions(fromTile, toTile);

            if (!flipData) {
              // Unable to calculate positions - exit silently
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

            // Defer completion/removal to AnimatedToken's onAnimationComplete
            // (we pass a handler below that removes the token and notifies the parent)
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
        aria-hidden="true"
        role="presentation"
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
              onAnimationComplete={() => {
                removeAnimatingToken(token.id);
                onAnimationComplete?.(token.id);
              }}
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
