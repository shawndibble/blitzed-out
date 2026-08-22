import { render, screen } from '@testing-library/react';
import { AnimatePresence, motion } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';

vi.unmock('motion/react');

describe('motion/react (unmocked)', () => {
  it('renders and animates a motion.div without React prop warnings', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AnimatePresence>
        <motion.div
          data-testid="animated"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          hello
        </motion.div>
      </AnimatePresence>
    );

    const el = screen.getByTestId('animated');
    // Real motion writes the initial values to inline style; the global mock
    // just forwards props, so this also proves vi.unmock took effect.
    expect(el.style.opacity).toBe('0');
    expect(el.style.transform).toContain('scale(0.8)');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
