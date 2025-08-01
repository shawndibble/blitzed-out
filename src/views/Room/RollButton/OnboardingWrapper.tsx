import { useMediaQuery, useTheme, Portal } from '@mui/material';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingWrapperProps {
  children: ReactNode;
  className?: string;
}

const OnboardingWrapper = ({ children, className }: OnboardingWrapperProps): JSX.Element => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { settings, updateSettings } = useSettingsStore();
  const [startAnimation, setStartAnimation] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const shouldShowOnboarding = isDesktop && !settings.hasSeenRollButton && !hasInteracted;

  // Calculate button position for spotlight effect
  useEffect(() => {
    if (shouldShowOnboarding && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        setButtonPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [shouldShowOnboarding]);

  // Trigger animation
  useEffect(() => {
    if (shouldShowOnboarding) {
      const animationTimer = setTimeout(() => {
        setStartAnimation(true);
      }, 1500); // Start animation

      return () => {
        clearTimeout(animationTimer);
      };
    }
  }, [shouldShowOnboarding]);

  const handleInteraction = () => {
    if (!settings.hasSeenRollButton) {
      setHasInteracted(true);
      setStartAnimation(false);
      updateSettings({ hasSeenRollButton: true });
    }
    // Don't prevent the event from bubbling to the actual button
  };

  if (!shouldShowOnboarding) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      {/* Framer Motion spotlight overlay */}
      <AnimatePresence>
        {shouldShowOnboarding && (
          <Portal>
            <motion.div
              initial={{
                opacity: 1,
                background: `radial-gradient(
                  circle at ${buttonPosition.x + buttonPosition.width / 2}px ${buttonPosition.y + buttonPosition.height / 2}px,
                  transparent 0px,
                  transparent ${Math.max(buttonPosition.width, buttonPosition.height) * 11.25}px,
                  rgba(0, 0, 0, 0.2) ${Math.max(buttonPosition.width, buttonPosition.height) * 13.5}px,
                  rgba(0, 0, 0, 0.5) ${Math.max(buttonPosition.width, buttonPosition.height) * 16.5}px,
                  rgba(0, 0, 0, 0.7) ${Math.max(buttonPosition.width, buttonPosition.height) * 21}px,
                  rgba(0, 0, 0, 0.8) 100%
                )`,
              }}
              animate={
                startAnimation
                  ? {
                      opacity: 1,
                      background: `radial-gradient(
                  circle at ${buttonPosition.x + buttonPosition.width / 2}px ${buttonPosition.y + buttonPosition.height / 2}px,
                  transparent 0px,
                  transparent ${Math.max(buttonPosition.width, buttonPosition.height) * 1.125}px,
                  rgba(0, 0, 0, 0.2) ${Math.max(buttonPosition.width, buttonPosition.height) * 1.35}px,
                  rgba(0, 0, 0, 0.5) ${Math.max(buttonPosition.width, buttonPosition.height) * 1.65}px,
                  rgba(0, 0, 0, 0.7) ${Math.max(buttonPosition.width, buttonPosition.height) * 2.1}px,
                  rgba(0, 0, 0, 0.8) 100%
                )`,
                    }
                  : {}
              }
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.8,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              onClick={handleInteraction}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9998,
                cursor: 'pointer',
                pointerEvents: startAnimation ? 'auto' : 'none',
              }}
            />
          </Portal>
        )}
      </AnimatePresence>

      <motion.div
        ref={buttonRef}
        className={className}
        onClick={handleInteraction}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 0 0 rgba(25, 118, 210, 0.8), 0 0 40px rgba(25, 118, 210, 0.6), 0 0 80px rgba(25, 118, 210, 0.4), 0 0 120px rgba(25, 118, 210, 0.2)',
            '0 0 0 12px rgba(25, 118, 210, 0), 0 0 60px rgba(25, 118, 210, 0.8), 0 0 120px rgba(25, 118, 210, 0.6), 0 0 180px rgba(25, 118, 210, 0.3)',
            '0 0 0 0 rgba(25, 118, 210, 0), 0 0 40px rgba(25, 118, 210, 0.6), 0 0 80px rgba(25, 118, 210, 0.4), 0 0 120px rgba(25, 118, 210, 0.2)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 },
        }}
        style={{
          borderRadius: 4,
          position: 'relative',
          zIndex: 9999,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default OnboardingWrapper;
