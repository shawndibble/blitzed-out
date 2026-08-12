import * as functions from 'firebase-functions/v1';
import { CallableContext } from 'firebase-functions/v1/https';

/**
 * App Check wiring for callables — **staged and deliberately inert.**
 *
 * App Check is the control that distinguishes "a request from our app" from "a
 * request from a script holding a stolen anonymous ID token", which is the one
 * thing the per-uid rate limit cannot do. It is not switched on yet because
 * three things are missing and each of them 403s every call on its own:
 *
 *   1. No reCAPTCHA v3 site key is registered for this project.
 *   2. The web app is not registered as an App Check provider.
 *   3. The client does not initialize App Check, so it sends no token at all.
 *
 * Turning enforcement on before those land would reject 100% of traffic and take
 * webcam down. So the code path exists, the switch is here, and it is off. The
 * steps to enable it are in `docs/engineering/security.md` § Cloud Functions.
 */

/**
 * The switch. Flip to `true` — and only after the checklist below is done.
 *
 * A literal rather than `process.env.*` on purpose: `enforceAppCheck` is a
 * *deploy-time* runtime option baked into the deployed function, so reading it
 * from the environment would make production enforcement depend on whichever
 * machine ran the deploy and on whether `functions/.env` happened to be present.
 * A committed constant makes the deployed state reviewable in the diff.
 */
export const APP_CHECK_ENFORCED: boolean = false;

/**
 * Spread into `runWith` so the flip above is the only edit needed:
 *
 *   .runWith({ ...appCheckRuntimeOptions(), secrets: [...] })
 */
export function appCheckRuntimeOptions(): { enforceAppCheck: boolean } {
  return { enforceAppCheck: APP_CHECK_ENFORCED };
}

/**
 * Report that a caller sent a *valid* App Check token, without requiring one.
 *
 * Today nothing does, so this logs nothing — and that is the point: the first
 * time these lines appear in the logs is the confirmation that client wiring
 * landed and that flipping `APP_CHECK_ENFORCED` will not lock anyone out.
 * Deliberately silent on the absent case; that is currently every call.
 */
export function observeAppCheck(context: CallableContext, callableName: string): void {
  if (context.app) {
    functions.logger.info('App Check token verified; enforcement can be enabled', {
      callable: callableName,
      appId: context.app.appId,
    });
  }
}
