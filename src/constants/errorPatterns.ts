/**
 * Error patterns for filtering expected React DOM reconciliation errors
 * These patterns identify known, expected errors that occur during normal component transitions
 */

/**
 * DOM reconciliation error patterns
 * These occur when React transitions between components (e.g., GameSettingsDialog → GameBoard)
 */
export const EXPECTED_DOM_ERROR_PATTERNS = [
  'insertBefore',
  'removeChild',
  'not a child of this node',
  'The object can not be found here',
] as const;

/**
 * Module loading error patterns
 * These occur on certain browsers (especially iOS Safari) due to module loading issues
 */
export const MODULE_LOADING_ERROR_PATTERNS = [
  'Importing a module script failed',
  'Failed to resolve module specifier',
  'Method not found',
  'module script failed',
] as const;

/**
 * A code chunk failed to arrive. Each browser words it differently, and Vite words the CSS
 * half differently again — matching the message rather than the error constructor is what
 * makes this reliable, since Vite's preload helper rejects with a plain `Error`.
 */
const MODULE_FETCH_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module', // Chrome
  'error loading dynamically imported module', // Firefox
  'importing a module script failed', // WebKit
] as const;

const CSS_PRELOAD_ERROR_PATTERN = 'unable to preload css';

export const CHUNK_LOAD_ERROR_PATTERNS = [
  ...MODULE_FETCH_ERROR_PATTERNS,
  CSS_PRELOAD_ERROR_PATTERN,
] as const;

/** Any chunk or stylesheet that failed to load — worth retrying. */
export function isChunkLoadError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

/**
 * The JavaScript module itself could not be fetched, in any browser's wording.
 *
 * `gh-pages` replaces the branch on every deploy, so a tab left open can hold an `index.html`
 * naming chunks that no longer exist. Retrying cannot help — only a fresh document can.
 * A stylesheet failing on its own does not qualify: a redeploy takes the JS with it.
 */
export function isStaleBundleError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;
  return MODULE_FETCH_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

/**
 * Network/loading error patterns that are usually temporary and not actionable
 * These occur due to network issues, browser quirks, or temporary connection problems
 */
export const NETWORK_LOADING_ERROR_PATTERNS = [
  'Load failed', // Generic Safari loading error
  'Failed to fetch', // Network request failures
  'Network request failed',
] as const;

/**
 * Generic minified error patterns - now for context only, not suppression
 * These help identify minified errors so we can add debugging context
 */
export const MINIFIED_ERROR_PATTERNS = [
  'bb', // Generic minified error code - likely from React internals
] as const;
const MODULE_LOADING_ERROR_PATTERNS_LC = MODULE_LOADING_ERROR_PATTERNS.map((p) =>
  p.toLowerCase()
) as readonly string[];
const NETWORK_LOADING_ERROR_PATTERNS_LC = NETWORK_LOADING_ERROR_PATTERNS.map((p) =>
  p.toLowerCase()
) as readonly string[];
const MINIFIED_ERROR_PATTERNS_LC = MINIFIED_ERROR_PATTERNS.map((p) =>
  p.toLowerCase()
) as readonly string[];

/**
 * Check if an error message matches expected DOM reconciliation error patterns
 * Matches either a named DOM method (insertBefore/removeChild) or WebKit's bare
 * "object can not be found here" DOMException, which names no method at all.
 * @param errorMessage - The error message to check
 * @returns true if the error matches expected DOM reconciliation patterns
 */
export function isExpectedDOMError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;

  const [insertBeforeToken, removeChildToken, notChildToken, notFoundToken] =
    EXPECTED_DOM_ERROR_PATTERNS;
  const hasInsertBefore = msg.includes(insertBeforeToken.toLowerCase());
  const hasRemoveChild = msg.includes(removeChildToken.toLowerCase());
  const hasNotChild = msg.includes(notChildToken.toLowerCase());
  const hasNotFound = msg.includes(notFoundToken.toLowerCase());

  // Typical reconciliation error: insertBefore or removeChild with "not a child"
  if ((hasInsertBefore || hasRemoveChild) && hasNotChild) return true;
  // cspell:disable-next-line
  if (msg.includes("failed to execute 'insertbefore'")) return true;
  // cspell:disable-next-line
  if (msg.includes("failed to execute 'removechild'")) return true;
  // WebKit raises the same reconciliation failure as a bare DOMException naming no DOM method;
  // the insertBefore/removeChild evidence lives only in the stack frames, which never reach here.
  // Requiring a method name suppressed nothing and crash-screened the user, since
  // getDerivedStateFromError shares this predicate.
  if (hasNotFound) return true;

  return false;
}

/**
 * Check if an error message matches module loading error patterns
 * @param errorMessage - The error message to check
 * @returns true if the error matches module loading patterns
 */
export function isModuleLoadingError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;
  return MODULE_LOADING_ERROR_PATTERNS_LC.some((pattern) => msg.includes(pattern));
}

/**
 * Check if an error message matches network/loading error patterns
 * These are usually temporary network issues and not actionable bugs
 * @param errorMessage - The error message to check
 * @returns true if the error matches network loading patterns
 */
export function isNetworkLoadingError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;
  return NETWORK_LOADING_ERROR_PATTERNS_LC.some((pattern) => msg.includes(pattern));
}

/**
 * Check if an error message matches known minified code patterns
 * Used for adding context to Sentry, not for suppression
 * @param errorMessage - The error message to check
 * @returns true if the error matches minified code patterns
 */
export function isMinifiedError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;

  return MINIFIED_ERROR_PATTERNS_LC.some((pattern) => msg === pattern);
}

/**
 * Error pattern categories for Sentry tagging
 */
export const ERROR_CATEGORIES = {
  DOM_RECONCILIATION: 'react_dom_insertion_error',
  MODULE_LOADING: 'module_resolution_error',
  IOS_SAFARI_MODULE: 'ios_safari_module_error',
  FIREFOX_MOBILE_AUTH: 'firefox_mobile_auth_error',
} as const;

export type ErrorCategory = keyof typeof ERROR_CATEGORIES;
