import { lazy, ComponentType } from 'react';

/**
 * Creates a lazy-loaded component with retry logic for dynamic import failures.
 * This helps handle network issues and module loading problems, especially on Safari.
 *
 * @param importFn - Function that returns a Promise for the dynamic import
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Base delay between retries in milliseconds (default: 1000)
 * @returns Lazy component with retry logic
 */
export const createRetryableLazy = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  retries = 3,
  delay = 1000
) => {
  return lazy(() => {
    const attemptImport = async (attempt: number): Promise<{ default: ComponentType<any> }> => {
      try {
        return await importFn();
      } catch (error) {
        // Check if this is a dynamic import failure
        if (
          error instanceof TypeError &&
          error.message.includes('Failed to fetch dynamically imported module')
        ) {
          console.warn(`Dynamic import failed (attempt ${attempt}/${retries}):`, error.message);

          if (attempt < retries) {
            // Wait before retrying with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
            return attemptImport(attempt + 1);
          } else {
            // Final attempt failed, trigger a page reload as fallback
            console.error('All dynamic import attempts failed. Reloading page...');
            if (!sessionStorage.getItem('dynamic_import_reload_attempted')) {
              sessionStorage.setItem('dynamic_import_reload_attempted', '1');
              setTimeout(() => window.location.reload(), 100);
            }
            throw error;
          }
        }

        // Re-throw other errors immediately (syntax errors, etc.)
        throw error;
      }
    };

    return attemptImport(1);
  });
};

/**
 * Convenience function for creating retryable lazy components with default settings
 * Optimized for typical web app usage patterns
 */
export const lazyWithRetry = (importFn: () => Promise<{ default: ComponentType<any> }>) =>
  createRetryableLazy(importFn, 3, 1000);

export default lazyWithRetry;
