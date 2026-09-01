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

/**
 * Where our chunks are served from. Vendor chunks land here too — `chunkFileNames` falls back to
 * `chunk` when a chunk has no `facadeModuleId` — so a frame here is not proof of our own code.
 */
const OWN_BUNDLE_DIRECTORIES = ['/assets/', '/js/'];

/**
 * Where a content-filter proxy serves the third-party scripts it rewrote, `/__av/<base64 of the
 * original URL>`. Another proxy would use another prefix; it joins this list.
 */
const PROXY_REWRITE_DIRECTORIES = ['/__av/'];

/** WebKit's illegal-invocation message, scoped to `window`'s own methods. */
const DETACHED_WINDOW_CALL = /^Can only call Window\.\w+ on instances of Window$/;

/** A minified identifier with nothing else in it — no spaces, no punctuation. */
const OPAQUE_TOKEN = /^[A-Za-z][A-Za-z0-9]{0,2}$/;

function firstException(event: FilterableEvent): FilterableException | undefined {
  return event.exception?.values?.[0];
}

function hasFrameIn(frames: FilterableFrame[] | undefined, directories: string[]): boolean {
  return !!frames?.some((frame) =>
    directories.some((directory) => frame.filename?.includes(directory))
  );
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

  return !hasFrameIn(frames, OWN_BUNDLE_DIRECTORIES);
}

/**
 * A `window` method called with the wrong receiver, from a script a content-filter proxy
 * rewrote and re-served from our own origin.
 *
 * The proxy runs those scripts against a wrapped `window`, so every host method they forward
 * throws. Observed as `Window.setTimeout` from Firebase Auth's gapi iframe loader and
 * `Window.setInterval` from gtag. No app change can fix it, and the same session's Firestore
 * transport is failing anyway.
 *
 * Frame-scoped rather than message-scoped because app code detaching a window method
 * (`const { matchMedia } = window`) produces a byte-identical message, and the gapi event
 * carries a frame from our own bundle — so neither the message nor own-bundle absence can tell
 * the two apart. Only the proxy's own frame can. WebKit's separate attribute-getter wording
 * (`The Window.localStorage getter can only be used on…`) is not covered; it has not been seen.
 */
export function isProxyRewrittenHostCall(event: FilterableEvent): boolean {
  const exception = firstException(event);
  if (!exception || exception.type !== 'TypeError') return false;
  if (!DETACHED_WINDOW_CALL.test(exception.value ?? '')) return false;

  return hasFrameIn(exception.stacktrace?.frames, PROXY_REWRITE_DIRECTORIES);
}
