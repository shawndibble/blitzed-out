import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import OfflineBanner from '../index';

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    writable: true,
    value,
  });
}

describe('OfflineBanner', () => {
  afterEach(() => {
    setOnLine(true);
  });

  it('is hidden while online', () => {
    setOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByText('offlineBanner')).not.toBeInTheDocument();
  });

  it('appears while offline', () => {
    setOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByText('offlineBanner')).toBeInTheDocument();
  });

  it('reacts to going offline', () => {
    setOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByText('offlineBanner')).not.toBeInTheDocument();

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('offlineBanner')).toBeInTheDocument();
  });
});
