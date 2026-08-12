import * as functions from 'firebase-functions/v1';
import { CallableContext } from 'firebase-functions/v1/https';

/**
 * App Check wiring for callables — **staged and deliberately inert.**
 *
 * App Check is the one control that separates "a request from our app" from "a
 * script holding a stolen anonymous ID token", which no rate limit can do. It stays
 * off until reCAPTCHA is registered and the client sends tokens: enforcing before
 * then rejects 100% of traffic and takes webcam down. Enable steps live in
 * `docs/engineering/security.md` § Cloud Functions.
 */

/**
 * The switch. Flip only after the enable steps in security.md are done.
 *
 * A literal rather than `process.env.*` on purpose: `enforceAppCheck` is baked in
 * at deploy time, so an env-sourced value would make production enforcement depend
 * on which machine deployed. A committed constant is reviewable in the diff.
 */
export const APP_CHECK_ENFORCED: boolean = false;

/**
 * Report that a caller sent a *valid* App Check token, without requiring one.
 *
 * Silent today, which is the point: the first appearance of this line is the
 * evidence that client wiring landed and enforcement will not lock anyone out.
 */
export function observeAppCheck(context: CallableContext, callableName: string): void {
  if (context.app) {
    functions.logger.info('App Check token verified; enforcement can be enabled', {
      callable: callableName,
      appId: context.app.appId,
    });
  }
}
