import { Component, ReactNode, Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { createRetryableLazy } from '@/utils/lazyWithRetry';

function Loaded() {
  return <div>loaded</div>;
}

/** Stands in for the root boundary, so we can assert what escapes the lazy wrapper. */
class OuterBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    if (this.state.message) return <div>outer: {this.state.message}</div>;
    return this.props.children;
  }
}

function renderLazy(importFn: () => Promise<{ default: typeof Loaded }>, retries = 3) {
  const Lazy = createRetryableLazy(importFn, retries, 0);
  return render(
    <OuterBoundary>
      <Suspense fallback={<div>suspense</div>}>
        <Lazy />
      </Suspense>
    </OuterBoundary>
  );
}

/** The plain `Error` Vite's preload helper rejects with — deliberately not a TypeError. */
const cssPreloadError = () =>
  new Error('Unable to preload CSS for https://blitzedout.com/assets/GameGuide-ClokBUqd.css');

const dynamicImportError = () =>
  new TypeError('Failed to fetch dynamically imported module: /js/GameGuide-abc.js');

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

/**
 * React logs every error a boundary catches. Tests that deliberately fail an import have to
 * silence that, per the console.error guard in setupTests.
 */
function silenceReactErrorLogging() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

describe('createRetryableLazy', () => {
  it('renders the component when the import succeeds', async () => {
    renderLazy(() => Promise.resolve({ default: Loaded }));

    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it('retries a CSS preload failure and recovers', async () => {
    // The old predicate required `instanceof TypeError`, so Vite's plain Error got zero retries.
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(cssPreloadError())
      .mockResolvedValue({ default: Loaded });

    renderLazy(importFn);

    expect(await screen.findByText('loaded')).toBeInTheDocument();
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('retries a dynamic import failure and recovers', async () => {
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(dynamicImportError())
      .mockResolvedValue({ default: Loaded });

    renderLazy(importFn);

    expect(await screen.findByText('loaded')).toBeInTheDocument();
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured number of attempts', async () => {
    silenceReactErrorLogging();

    const importFn = vi.fn().mockRejectedValue(cssPreloadError());

    renderLazy(importFn, 2);

    await waitFor(() => expect(importFn).toHaveBeenCalledTimes(2));
  });

  it('shows its own fallback rather than letting the app die', async () => {
    silenceReactErrorLogging();

    renderLazy(vi.fn().mockRejectedValue(cssPreloadError()), 1);

    expect(await screen.findByText('sectionFailedToLoad')).toBeInTheDocument();
    expect(screen.queryByText(/^outer:/)).not.toBeInTheDocument();
  });

  it('recovers when the user retries, despite React caching the rejection', async () => {
    silenceReactErrorLogging();

    // React 19 stores the rejection on the lazy payload and re-throws it on every later
    // render, so recovery requires a fresh lazy component, not just a re-render.
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(cssPreloadError())
      .mockResolvedValue({ default: Loaded });

    renderLazy(importFn, 1);

    await userEvent.click(await screen.findByRole('button', { name: 'tryAgain' }));

    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it('re-imports when the section is unmounted and mounted again', async () => {
    silenceReactErrorLogging();

    // Dialogs mount conditionally (`{open.customTiles && ...}`), so closing and reopening one
    // is the natural recovery attempt. React caches the rejection on the lazy payload, so
    // without an explicit reset the second mount short-circuits to the fallback forever.
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(cssPreloadError())
      .mockResolvedValue({ default: Loaded });
    const Lazy = createRetryableLazy(importFn, 1, 0);

    const { unmount } = render(
      <Suspense fallback={<div>suspense</div>}>
        <Lazy />
      </Suspense>
    );
    await screen.findByText('sectionFailedToLoad');
    unmount();

    render(
      <Suspense fallback={<div>suspense</div>}>
        <Lazy />
      </Suspense>
    );

    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it.each([
    ['WebKit', 'Importing a module script failed.'],
    ['Firefox', 'error loading dynamically imported module: /js/Room-abc.js'],
    ['Chrome', 'Failed to fetch dynamically imported module: /js/Room-abc.js'],
  ])('reloads the page for a stale bundle in %s wording', async (_browser, message) => {
    silenceReactErrorLogging();

    // A redeploy deletes the old hashed chunks, so no number of retries can succeed — only a
    // fresh document can. Gating this on Chrome's wording alone stranded every iOS user.
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    renderLazy(vi.fn().mockRejectedValue(new Error(message)), 1);
    await screen.findByText('sectionFailedToLoad');

    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it('survives sessionStorage being unavailable', async () => {
    silenceReactErrorLogging();

    // Cookie-blocked and partitioned contexts throw SecurityError on access. That must not
    // replace the load error, or the section fallback turns into the root crash screen.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    renderLazy(
      vi.fn().mockRejectedValue(new Error('Failed to fetch dynamically imported module: /a.js')),
      1
    );

    expect(await screen.findByText('sectionFailedToLoad')).toBeInTheDocument();
    expect(screen.queryByText(/^outer:/)).not.toBeInTheDocument();
  });

  it('lets a genuine component error through to the outer boundary', async () => {
    silenceReactErrorLogging();

    function Broken(): never {
      throw new Error('component exploded');
    }
    const Lazy = createRetryableLazy(async () => ({ default: Broken }), 1, 0);

    render(
      <OuterBoundary>
        <Suspense fallback={<div>suspense</div>}>
          <Lazy />
        </Suspense>
      </OuterBoundary>
    );

    expect(await screen.findByText('outer: component exploded')).toBeInTheDocument();
  });

  it('lets a non-load import error through without retrying', async () => {
    silenceReactErrorLogging();

    const importFn = vi.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

    renderLazy(importFn);

    expect(await screen.findByText('outer: Unexpected token')).toBeInTheDocument();
    expect(importFn).toHaveBeenCalledTimes(1);
  });
});
