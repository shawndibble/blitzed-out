import { motion, useMotionValue, useTransform } from 'framer-motion';
import TextAvatar from '@/components/TextAvatar';
import type { FLIPData } from './TokenController';

// Small buffer to ensure animation completion (kept for potential future use)
// const ANIMATION_COMPLETION_BUFFER_MS = 100;

export interface AnimatedTokenProps {
  id: string;
  displayName: string;
  isCurrent: boolean;
  flipData: FLIPData;
  onAnimationComplete?: () => void;
  onAnimationProgress?: (playerId: string, progress: number, currentY: number) => void;
}

const AnimatedToken: React.FC<AnimatedTokenProps> = ({
  id,
  displayName,
  isCurrent,
  flipData,
  onAnimationComplete,
  onAnimationProgress,
}) => {
  // Motion values for position tracking - bind to motion.div style for reactivity
  const x = useMotionValue(flipData.from.x);
  const y = useMotionValue(flipData.from.y);

  // Transform values for visual effects during animation
  const scale = useTransform(
    x,
    [flipData.from.x, flipData.to.x],
    [1, isCurrent ? 1.15 : 1.05] // Current player gets bigger scale
  );

  // Calculate progress tracking values for onUpdate callback
  const fromX = flipData.from.x;
  const toX = flipData.to.x;
  const deltaX = toX - fromX || 1; // prevent div-by-zero

  // Calculate rotation angle for flight trail
  const rotationAngle = Math.atan2(
    flipData.to.y - flipData.from.y,
    flipData.to.x - flipData.from.x
  );

  return (
    <motion.div
      className={`animated-token ${isCurrent ? 'current-player' : 'other-player'}`}
      initial={{
        x: flipData.from.x,
        y: flipData.from.y,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: flipData.to.x,
        y: flipData.to.y,
        scale: isCurrent ? 1.15 : 1,
        opacity: 1,
      }}
      exit={{
        scale: 0.8,
        opacity: 0,
      }}
      transition={{
        duration: flipData.duration / 1000,
        ease: 'easeInOut',
      }}
      onUpdate={(latest) => {
        if (!onAnimationProgress) return;
        const lx = typeof latest.x === 'number' ? latest.x : parseFloat(String(latest.x));
        const ly = typeof latest.y === 'number' ? latest.y : parseFloat(String(latest.y));
        const progress = Math.max(0, Math.min(1, (lx - fromX) / deltaX));
        onAnimationProgress(id, progress, ly);
      }}
      onAnimationComplete={() => {
        onAnimationComplete?.();
      }}
      style={{
        x,
        y,
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      {/* Glow effect for current player */}
      {isCurrent && (
        <motion.div
          className="token-glow"
          initial={{ opacity: 0.6 }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.6) 0%, transparent 70%)',
            filter: 'blur(4px)',
            zIndex: -1,
          }}
        />
      )}

      {/* Main avatar */}
      <motion.div
        style={{
          scale,
          filter: isCurrent
            ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          borderRadius: '50%',
          border: isCurrent ? '2px solid rgba(34, 211, 238, 0.9)' : 'none',
        }}
      >
        <TextAvatar uid={id} displayName={displayName} size="medium" />
      </motion.div>

      {/* Flight trail effect (only during animation) */}
      <motion.div
        className="flight-trail"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{
          opacity: [0, 0.6, 0],
          scaleX: [0, 1, 0],
        }}
        transition={{
          duration: flipData.duration / 1000,
          ease: 'easeInOut',
        }}
        style={
          {
            position: 'absolute',
            top: '50%',
            left: '50%',
            '--trail-distance': `${flipData.distance}px`,
            height: 2,
            background: isCurrent
              ? 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.6), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.4), transparent)',
            transformOrigin: 'left center',
            transform: `translate(-50%, -50%) rotate(${rotationAngle}rad)`,
            zIndex: -2,
            pointerEvents: 'none',
          } as React.CSSProperties
        }
      />
    </motion.div>
  );
};

export default AnimatedToken;
