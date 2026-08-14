import { Component, ComponentType, ReactNode, lazy, useCallback, useState } from 'react';

import { isChunkLoadError, isStaleBundleError } from '@/constants/errorPatterns';

import LazyLoadFallback from '@/components/LazyLoadFallback';
import { logger } from '@/utils/logger';

const RELOAD_ATTEMPT_KEY = 'dynamic_import_reload_attempted';

function isRetryableLoadError(error: unknown): boolean {
  return error instanceof Error && isChunkLoadError(error.message);
}

/** Claims the one allowed reload, returning false if storage is blocked or it is already spent. */
function claimReloadAttempt(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_ATTEMPT_KEY)) return false;
    sessionStorage.setItem(RELOAD_ATTEMPT_KEY, '1');
    return true;
  } catch {
    // Cookie-blocked and partitioned contexts throw on access. Letting that escape would replace
    // the load error and send the whole app to the root crash screen.
    return false;
  }
}

interface LazyLoadBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  onFailedUnmount: () => void;
}

/**
 * Contains a failed chunk load to the section that needed it.
 *
 * Without this, the app's single root boundary (`src/index.jsx`) turned a failed dialog import
 * into a full-page crash screen. Anything that is not a load failure is re-thrown during render
 * so it still reaches that root boundary, and Sentry.
 */
class LazyLoadBoundary extends Component<LazyLoadBoundaryProps, { error: unknown }> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentWillUnmount() {
    // Dialogs mount conditionally, so closing and reopening one is the natural second attempt.
    // React caches the rejection on the lazy payload, so that remount needs a fresh lazy or it
    // short-circuits straight back to this fallback. Resetting on the way out — rather than at
    // the moment of failure — avoids handing a live boundary new children to re-import.
    if (isRetryableLoadError(this.state.error)) this.props.onFailedUnmount();
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (!isRetryableLoadError(error)) throw error;
      return <LazyLoadFallback onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
}

/**
 * Creates a lazy-loaded component that retries transient load failures, and offers the user a
 * working retry when it runs out of attempts.
 *
 * @param importFn - Function that returns a Promise for the dynamic import
 * @param retries - Total attempts, not extra ones: 3 means one try and two retries
 * @param delay - Base delay between retries in ms; grows linearly with the attempt number
 */
export const createRetryableLazy = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  retries = 3,
  delay = 1000
): ComponentType<any> => {
  const attemptImport = async (attempt: number): Promise<{ default: ComponentType<any> }> => {
    try {
      return await importFn();
    } catch (error) {
      if (!isRetryableLoadError(error)) throw error;

      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Chunk load failed (attempt ${attempt}/${retries}):`, message);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        return attemptImport(attempt + 1);
      }

      if (isStaleBundleError(message) && claimReloadAttempt()) {
        logger.error('All dynamic import attempts failed. Reloading page...');
        setTimeout(() => window.location.reload(), 100);
      }

      throw error;
    }
  };

  // A fresh `lazy()` per attempt is what makes recovery possible at all: React 19 stores the
  // rejection on the lazy payload and re-throws it on every subsequent render, so re-rendering
  // the same lazy component can never succeed.
  const makeLazy = () => lazy(() => attemptImport(1));

  // Deliberately not component state. The child suspends before this component commits, so a
  // `useState` initialiser re-runs on every suspended render and starts a duplicate import.
  // One holder per call site is the same scope React.lazy itself uses.
  let currentLazy = makeLazy();
  const resetLazy = () => {
    currentLazy = makeLazy();
  };

  return function RetryableLazy(props: Record<string, unknown>) {
    const [generation, setGeneration] = useState(0);
    const Loadable = currentLazy;

    const retry = useCallback(() => {
      resetLazy();
      setGeneration((previous) => previous + 1);
    }, []);

    return (
      <LazyLoadBoundary key={generation} onRetry={retry} onFailedUnmount={resetLazy}>
        <Loadable {...props} />
      </LazyLoadBoundary>
    );
  };
};

/** `createRetryableLazy` with the defaults every call site uses. */
export const lazyWithRetry = (importFn: () => Promise<{ default: ComponentType<any> }>) =>
  createRetryableLazy(importFn, 3, 1000);

export default lazyWithRetry;
