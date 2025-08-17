/**
 * Error patterns for filtering expected React DOM reconciliation errors
 * These patterns identify known, expected errors that occur during normal component transitions
 */

/**
 * DOM reconciliation error patterns
 * These occur when React transitions between components (e.g., GameSettingsDialog → GameBoard)
 */
export const EXPECTED_DOM_ERROR_PATTERNS = ['insertBefore', 'not a child of this node'] as const;

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
 * Check if an error message matches expected DOM reconciliation error patterns
 * Requires the specific combination that characterizes React reconciliation insertBefore errors
 * @param errorMessage - The error message to check
 * @returns true if the error matches expected DOM reconciliation patterns
 */
export function isExpectedDOMError(errorMessage: unknown): boolean {
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (!msg) return false;

  const hasInsertBefore = msg.includes('insertbefore');
  const hasNotChild = msg.includes('not a child of this node');

  // Typical reconciliation error: both tokens present (or the "failed to execute 'insertBefore'" variant)
  if (hasInsertBefore && hasNotChild) return true;
  if (msg.includes("failed to execute 'insertbefore'")) return true;

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
  return MODULE_LOADING_ERROR_PATTERNS.some((pattern) => msg.includes(pattern.toLowerCase()));
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
