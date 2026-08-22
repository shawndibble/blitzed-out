/**
 * Deployment options every function must carry, spread into each definition.
 *
 * **Not `setGlobalOptions`.** That call lives in a module body, and ES imports are
 * evaluated before the importing module's own statements — so functions defined in
 * `turnCredentials.ts` and `reportNotification.ts` were already constructed by the
 * time `index.ts` reached its `setGlobalOptions(...)`, and silently kept the SDK
 * defaults. That is not theoretical: it deployed both of them under the wrong
 * service account while reporting success, and left their region riding on a
 * default rather than the pin that was supposed to guarantee it.
 *
 * Spreading an explicit constant is order-independent, so it cannot regress the
 * same way when a function moves between files.
 */

const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;

/**
 * `region` is pinned because the client calls `getFunctions(app)` with no region:
 * if the SDK's default ever moves, the two ends stop pointing at each other.
 *
 * `serviceAccount` is pinned because Gen 2 otherwise runs as the project's default
 * *compute* account, which holds only `eventarc.eventReceiver` and `run.invoker`.
 * Every admin-SDK call then fails with "Provided authentication credentials for the
 * app named [DEFAULT] are invalid". Gen 1 ran as the App Engine account, which
 * carries `firebase.sdkAdminServiceAgent` (RTDB + Firestore) and
 * `firebaseauth.admin` (listUsers/deleteUsers), so pinning it back inherits exactly
 * the permissions these functions were written against rather than re-deriving the
 * role set by hand onto a second identity. It additionally needs
 * `roles/eventarc.eventReceiver` for the RTDB and Firestore triggers, which the
 * compute account had by default and this one did not.
 *
 * Derived from the project id, never a literal, so it cannot be wrong the moment
 * this deploys anywhere else.
 */
export const RUNTIME_OPTIONS = {
  region: 'us-central1',
  ...(projectId ? { serviceAccount: `${projectId}@appspot.gserviceaccount.com` } : {}),
} as const;
