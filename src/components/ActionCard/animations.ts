import type { Variants } from 'framer-motion';

const getPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  return mediaQuery?.matches ?? false;
};

export const getCardVariants = (): Variants => {
  const prefersReducedMotion = getPrefersReducedMotion();

  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.15 },
      },
      exit: {
        opacity: 0,
        transition: { duration: 0.15 },
      },
    };
  }

  return {
    hidden: {
      x: '-100vw',
      rotate: -15,
      opacity: 0,
    },
    visible: {
      x: 0,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
    exit: {
      x: '100vw',
      rotate: 15,
      opacity: 0,
      transition: {
        duration: 0.45,
        ease: 'easeIn',
      },
    },
  };
};
