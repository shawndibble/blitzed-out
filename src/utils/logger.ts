/**
 * The app's only writer to the console.
 *
 * Production is silent unless a user opts in (see `debugEnabled`). That silence
 * used to be true only by accident — terser's `drop_console` erased the 175
 * direct `console.*` calls at build time — which meant the rule lived in the
 * bundler config while the source read as though it logged in production.
 *
 * Deliberately NOT wired to Sentry. Most of these calls pass the payload that
 * failed: tiles, chat messages, display names, board contents. That is
 * user-authored intimate content, and shipping it to a third party is a privacy
 * decision, not a logging convenience. Crash reporting already happens at the
 * boundary (`services/sentry.ts` + its error boundary), where the payload isn't
 * attached. If per-event reporting is ever wanted, it goes here, once, with that
 * decision made on purpose.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = ['development', 'test'].includes(import.meta.env.MODE);

/**
 * Opt-in escape hatch for diagnosing a live session: `?debug=1`, or
 * `localStorage.setItem('debug', 'true')` to survive reloads.
 *
 * Production silence is right by default, but it also means a user reporting a
 * broken call can produce no evidence at all, and some failures only happen on
 * their network. This keeps the data on their machine — unlike routing logs to a
 * third party, which is a separate decision this deliberately does not make.
 */
const OFF_VALUES = ['0', 'false', 'off', 'no'];

function debugEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // `?debug=0` reads as "explicitly off"; treating the key's mere presence as
    // enabled would turn the obvious way to disable it into a way to enable it.
    const flag = new URLSearchParams(window.location.search).get('debug');
    if (flag !== null) return !OFF_VALUES.includes(flag.toLowerCase());

    return window.localStorage.getItem('debug') === 'true';
  } catch {
    return false;
  }
}

function emit(level: Level, args: unknown[]): void {
  if (!isDevelopment && !debugEnabled()) return;

  // The one sanctioned console call in the app; everything else routes here.
  // eslint-disable-next-line no-console
  const write = console[level] ?? console.log;
  write(...args);
}

export const logger = {
  debug: (...args: unknown[]): void => emit('debug', args),
  info: (...args: unknown[]): void => emit('info', args),
  warn: (...args: unknown[]): void => emit('warn', args),
  error: (...args: unknown[]): void => emit('error', args),
};
