import * as functions from 'firebase-functions/v1';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Per-uid rate limiting for callables, backed by `rate-limits/{userId}`.
 *
 * That collection is declared in `firestore.rules` as `allow read, write: if false`
 * — no client can see or forge a counter; only the admin SDK, which bypasses
 * rules, touches it. Nothing else in the repo read or wrote it, so the document
 * shape below is the first one: a map of `{ [action]: { count, windowStartedAt } }`
 * so one document holds every limited action for a user rather than one
 * collection per callable.
 */

/** A single fixed-window counter. Millis, epoch-based. */
export interface RateLimitBucket {
  count: number;
  windowStartedAt: number;
}

export interface RateLimitPolicy {
  /** Calls permitted inside one window. */
  quota: number;
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** The bucket to persist. Unchanged from the stored one when blocked. */
  next: RateLimitBucket;
  /** Millis until the window rolls over. Only meaningful when blocked. */
  retryAfterMs: number;
}

/**
 * Buckets are dropped this long after their last write. Firestore only acts on
 * this once a TTL policy is configured on the `rate-limits` collection for the
 * `ttl` field (Firestore console → TTL); until then the field is inert metadata
 * and the documents — one small doc per uid — simply persist. Matches the `ttl`
 * convention already used by `game-boards` and chat messages.
 */
const BUCKET_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Decide whether a call fits inside its window. Pure: no clock, no I/O, so the
 * window arithmetic is inspectable without a Firestore double.
 */
export function evaluateRateLimit(
  bucket: RateLimitBucket | undefined,
  policy: RateLimitPolicy,
  now: number
): RateLimitDecision {
  const startedAt = typeof bucket?.windowStartedAt === 'number' ? bucket.windowStartedAt : NaN;
  const count = typeof bucket?.count === 'number' && bucket.count > 0 ? bucket.count : 0;

  // A missing, malformed or elapsed window starts fresh. `startedAt > now` is the
  // clock-moved-backwards case: without it a window stamped in the future would
  // stay open forever and lock the user out permanently.
  const inWindow =
    Number.isFinite(startedAt) && startedAt <= now && now - startedAt < policy.windowMs;

  if (!inWindow) {
    return { allowed: true, next: { count: 1, windowStartedAt: now }, retryAfterMs: 0 };
  }

  if (count >= policy.quota) {
    return {
      allowed: false,
      next: { count, windowStartedAt: startedAt },
      retryAfterMs: startedAt + policy.windowMs - now,
    };
  }

  return { allowed: true, next: { count: count + 1, windowStartedAt: startedAt }, retryAfterMs: 0 };
}

/**
 * Claim one unit of `action`'s quota for `uid`.
 *
 * Read-decide-write has to be one atomic step or two concurrent calls both read
 * a bucket with one slot left and both pass, so this runs in a transaction rather
 * than a bare `FieldValue.increment` — the increment would be atomic but the
 * *decision* would not, and the decision is what has to hold.
 *
 * Nothing is written when the call is blocked: an abuser at their ceiling then
 * costs one read instead of a read plus a write.
 */
export async function consumeRateLimit(
  uid: string,
  action: string,
  policy: RateLimitPolicy,
  now: number = Date.now()
): Promise<RateLimitDecision> {
  const firestore = getFirestore();
  const ref = firestore.collection('rate-limits').doc(uid);

  return firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const bucket = snapshot.get(action) as RateLimitBucket | undefined;
    const decision = evaluateRateLimit(bucket, policy, now);

    if (decision.allowed) {
      tx.set(
        ref,
        {
          [action]: decision.next,
          updatedAt: FieldValue.serverTimestamp(),
          ttl: Timestamp.fromMillis(now + BUCKET_RETENTION_MS),
        },
        { merge: true }
      );
    }

    return decision;
  });
}

/**
 * Transaction failures that mean *this uid is hammering its own counter*, rather
 * than Firestore being unwell. Every call for one uid contends on one document,
 * so a burst is precisely what exhausts the transaction's internal retries.
 */
const CONTENTION_CODES = new Set(['aborted', 'failed-precondition', 'deadline-exceeded']);

function isContention(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  return (
    typeof code === 'string' && CONTENTION_CODES.has(code.replace(/^\d+\s+/, '').toLowerCase())
  );
}

/**
 * Rate-limit gate for a callable: throws `resource-exhausted` when the caller is
 * over quota, returns normally otherwise.
 *
 * **Fails open on infrastructure, closed on contention.** A Firestore outage must
 * not turn every TURN mint into an error and take webcam down globally — that is
 * the failure this whole branch exists to stop repeating — so an unavailable
 * backend allows the call. Contention is the opposite case: it is *caused* by the
 * burst being limited, and failing open there would make the bypass rate climb
 * with attack parallelism, which is exactly backwards. Blocking is cheap for a
 * real user because `resolveIceServers` falls back to the bundled relay on any
 * mint failure, so a false block costs relay quality, never the call.
 */
export async function enforceRateLimit(
  uid: string,
  action: string,
  policy: RateLimitPolicy
): Promise<void> {
  let decision: RateLimitDecision;
  try {
    decision = await consumeRateLimit(uid, action, policy);
  } catch (error) {
    if (isContention(error)) {
      functions.logger.warn('Rate limit contention; blocking the call', { uid, action });
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many requests. Try again shortly.',
        { retryAfterMs: policy.windowMs }
      );
    }
    functions.logger.warn('Rate limit check failed; allowing the call', { uid, action, error });
    return;
  }

  if (!decision.allowed) {
    functions.logger.warn('Rate limit exceeded', {
      uid,
      action,
      quota: policy.quota,
      windowMs: policy.windowMs,
    });
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Try again shortly.',
      { retryAfterMs: decision.retryAfterMs }
    );
  }
}
