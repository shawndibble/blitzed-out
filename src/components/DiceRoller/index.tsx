import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Portal } from '@mui/material';
import { getPreloadedDiceBox } from '@/services/diceBoxPreloader';

export interface DiceRollerProps {
  diceNotation: string;
  targetValue: number | number[];
  onComplete: (value: number, playedSound: boolean) => void;
  onFinished?: () => void;
  onError?: (error: Error) => void;
  soundEnabled?: boolean;
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
  onFinished,
  onError,
  soundEnabled = false,
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
      const DiceBox = await getPreloadedDiceBox();

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
        sounds: soundEnabled,
        sound_dieMaterial: 'plastic',
        assetPath: '/sounds/dicebox/',
        onRollComplete: () => {
          const total = calculateTotal(targetValue);

          // Trigger modal immediately, passing whether sound was played during animation
          onComplete(total, soundEnabled);

          // Start fade animation
          setIsFadingOut(true);

          // Signal parent to unmount after fade completes
          setTimeout(() => {
            setIsVisible(false);
            onFinished?.();
          }, 800);
        },
      }) as DiceBoxInstance;

      diceBoxRef.current = diceBox;

      await diceBox.initialize();

      setIsInitialized(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize dice');
      onError?.(err);
      onComplete(calculateTotal(targetValue), false);
    }
  }, [calculateTotal, onComplete, onError, onFinished, targetValue, soundEnabled]);

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
      onComplete(calculateTotal(targetValue), false);
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
          zIndex: 1299, // Below MUI Dialog (1300)
          pointerEvents: 'none',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.8s ease-out',
          '& canvas': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />
    </Portal>
  );
}
