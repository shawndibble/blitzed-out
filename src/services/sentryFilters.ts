/**
 * Pure predicates for dropping Sentry events that cannot be acted on.
 *
 * These take the narrow slice of `Sentry.ErrorEvent` they read rather than the SDK type, so
 * tests can pass literal objects. `beforeSend` in `./sentry` is the impure wrapper.
 */

interface FilterableFrame {
  filename?: string;
}

interface FilterableException {
  type?: string;
  value?: string;
  stacktrace?: { frames?: FilterableFrame[] };
}

export interface FilterableEvent {
  exception?: { values?: FilterableException[] };
}

/** Every chunk we ship is served from one of these directories. */
const OWN_BUNDLE_DIRECTORIES = ['/assets/', '/js/'];

/** A minified identifier with nothing else in it — no spaces, no punctuation. */
const OPAQUE_TOKEN = /^[A-Za-z][A-Za-z0-9]{0,2}$/;

function firstException(event: FilterableEvent): FilterableException | undefined {
  return event.exception?.values?.[0];
}

function isFromOwnBundle(frame: FilterableFrame): boolean {
  const filename = frame.filename;
  if (!filename) return false;
  return OWN_BUNDLE_DIRECTORIES.some((directory) => filename.includes(directory));
}

/**
 * A bare `Error` carrying a short minified token and no frames at all.
 *
 * Nothing in `src/` can produce one: every `new Error()` we write takes an English string
 * literal, and the coercion sites all pass `String(err)`. Third-party scripts compiled with
 * Closure do produce them — an `Error` subclass built via `Error.call(this, code)` keeps
 * `name === 'Error'`, carries a short code as its message, and has no usable stack.
 *
 * Deliberately narrow: a named exception type (`FirebaseError`, `DatabaseClosedError`) is
 * already identifiable, and any frame at all makes the event worth keeping.
 */
export function isOpaqueStacklessError(event: FilterableEvent): boolean {
  const exception = firstException(event);
  if (!exception || exception.type !== 'Error') return false;
  if (!OPAQUE_TOKEN.test(exception.value ?? '')) return false;

  return !exception.stacktrace?.frames?.length;
}

/**
 * A stack overflow raised entirely outside our own bundle.
 *
 * Browser-injected script (Google Translate on Chrome iOS, most visibly) is evaluated without
 * a `sourceURL`, so its frames are attributed to the document or to nothing. A genuine
 * recursion in our code always carries a chunk filename, so requiring one frame from our own
 * bundle keeps real bugs reportable.
 *
 * An event with no stacktrace is kept: absence of frames is not evidence of foreign origin.
 */
export function isInjectedScriptStackOverflow(event: FilterableEvent): boolean {
  const exception = firstException(event);
  if (!exception || exception.type !== 'RangeError') return false;
  if (!/maximum call stack size exceeded/i.test(exception.value ?? '')) return false;

  const frames = exception.stacktrace?.frames;
  if (!frames?.length) return false;

  return !frames.some(isFromOwnBundle);
}
