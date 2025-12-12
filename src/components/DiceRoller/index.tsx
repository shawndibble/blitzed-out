import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Portal } from '@mui/material';

export interface DiceRollerProps {
  diceNotation: string;
  targetValue: number | number[];
  onComplete: (value: number) => void;
  onError?: (error: Error) => void;
}

type DiceBoxInstance = {
  initialize: () => Promise<void>;
  roll: (notation: string) => Promise<unknown>;
  clear: () => void;
};

const DICE_CONTAINER_ID = 'dice-roller-3d-container';

export default function DiceRoller({
  diceNotation,
  targetValue,
  onComplete,
  onError,
}: DiceRollerProps): JSX.Element | null {
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasRolledRef = useRef(false);
  const isInitializingRef = useRef(false);

  const formatNotationWithTarget = useCallback(
    (notation: string, target: number | number[]): string => {
      if (Array.isArray(target)) {
        return `${notation}@${target.join(',')}`;
      }
      return `${notation}@${target}`;
    },
    []
  );

  const calculateTotal = useCallback((target: number | number[]): number => {
    if (Array.isArray(target)) {
      return target.reduce((sum, val) => sum + val, 0);
    }
    return target;
  }, []);

  const initDiceBox = useCallback(async () => {
    if (!containerRef.current || hasRolledRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      const DiceBox = (await import('@3d-dice/dice-box-threejs')).default;

      const diceBox = new DiceBox(`#${DICE_CONTAINER_ID}`, {
        theme_customColorset: {
          background: '#0284c7',
          foreground: '#ffffff',
        },
        theme_material: 'plastic',
        light_intensity: 1.2,
        gravity_multiplier: 400,
        baseScale: 100,
        strength: 2,
        onRollComplete: () => {
          const total = calculateTotal(targetValue);
          setIsFadingOut(true);

          // Short delay to let fade animation start, then trigger onComplete
          // This is much faster than before but still allows fade to be visible
          setTimeout(() => {
            onComplete(total);
          }, 100);

          setTimeout(() => {
            setIsVisible(false);
          }, 400);
        },
      }) as DiceBoxInstance;

      diceBoxRef.current = diceBox;

      await diceBox.initialize();

      setIsInitialized(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize dice');
      onError?.(err);
      onComplete(calculateTotal(targetValue));
    }
  }, [calculateTotal, onComplete, onError, targetValue]);

  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        initDiceBox();
      }
    },
    [initDiceBox]
  );

  useEffect(() => {
    return () => {
      if (diceBoxRef.current) {
        try {
          diceBoxRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !diceBoxRef.current || hasRolledRef.current) return;

    hasRolledRef.current = true;
    const notation = formatNotationWithTarget(diceNotation, targetValue);

    diceBoxRef.current.roll(notation).catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error('Roll failed');
      onError?.(err);
      onComplete(calculateTotal(targetValue));
    });
  }, [
    isInitialized,
    diceNotation,
    targetValue,
    formatNotationWithTarget,
    calculateTotal,
    onComplete,
    onError,
  ]);

  if (!isVisible) return null;

  return (
    <Portal>
      <Box
        ref={containerRefCallback}
        id={DICE_CONTAINER_ID}
        data-testid="dice-roller-container"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
          '& canvas': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />
    </Portal>
  );
}
