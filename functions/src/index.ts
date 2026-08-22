import { logger } from 'firebase-functions';
import { onValueDeleted, onValueWritten } from 'firebase-functions/v2/database';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { RUNTIME_OPTIONS } from './runtime';

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { getAuth, ListUsersResult, UserRecord } from 'firebase-admin/auth';

export { onPackReported } from './reportNotification';
export { getTurnCredentials } from './turnCredentials';

/**
 * The database URL is derived from the project, never hardcoded.
 *
 * It used to default to `blitzed-out-default-rtdb.firebaseio.com`, which is not
 * this project's database — it is not any database; that host 404s. Since
 * `DATABASE_URL` was never set anywhere, every admin read and write went
 * nowhere: the scheduled cleanups hung until their 60s timeout, every five
 * minutes, silently, which is how `/PUBLIC` accumulated nine dead roster entries
 * with a prune job ostensibly running against it.
 *
 * On Gen 1 `FIREBASE_CONFIG` did not carry `databaseURL`, so it could not simply
 * be omitted either — the admin SDK then threw "Can't determine Firebase Database
 * URL". Gen 2 *does* supply it, so this derivation is now belt-and-braces rather
 * than load-bearing. It stays because it cannot drift from the project it is
 * deployed to, and because it is what makes the failure above impossible again
 * regardless of what the platform puts in the environment.
 */
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;

const databaseURL =
  process.env.DATABASE_URL ||
  (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined);

if (!databaseURL) {
  logger.error('No database URL could be determined; RTDB access will fail');
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

/**
 * Scheduled function to clean up stale users every 5 minutes
 * Removes users who haven't updated their lastSeen timestamp in 20 minutes
 */
export const cleanupStaleUsers = onSchedule(
  { schedule: 'every 5 minutes', ...RUNTIME_OPTIONS },
  async () => {
    const db = getDatabase();
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000; // 20 minutes in milliseconds

    try {
      logger.info('Starting stale user cleanup process');

      // Get all users with lastSeen older than 20 minutes
      const staleUsersSnapshot = await db
        .ref('users')
        .orderByChild('lastSeen')
        .endAt(twentyMinutesAgo)
        .once('value');

      if (!staleUsersSnapshot.exists()) {
        logger.info('No stale users found to clean up');
        return;
      }

      const staleUsers = staleUsersSnapshot.val();
      const userIds = Object.keys(staleUsers);
      const userCount = userIds.length;

      logger.info(`Found ${userCount} stale users to clean up`);

      // For large user counts or when atomicity is critical, use transaction
      if (userCount > 100) {
        logger.info(`Large user count (${userCount}), using transaction for atomic deletion`);

        await db.ref().transaction((currentData) => {
          if (currentData && currentData.users) {
            // Remove stale users from the current data
            userIds.forEach((userId) => {
              if (currentData.users[userId]) {
                delete currentData.users[userId];
              }
            });
          }
          return currentData;
        });
      } else {
        // For smaller user counts, use efficient batch update
        const updates: { [key: string]: null } = {};
        userIds.forEach((userId) => {
          updates[`users/${userId}`] = null;
        });

        await db.ref().update(updates);
      }

      logger.info(`Successfully cleaned up ${userCount} stale users`);
      return;
    } catch (error) {
      logger.error('Error cleaning up stale users:', error);
      throw error;
    }
  }
);

/**
 * Trigger when a user is manually deleted (backup cleanup logging)
 */
export const onUserDisconnect = onValueDeleted(
  { ref: '/users/{userId}', ...RUNTIME_OPTIONS },
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data.val();

    logger.info(`User ${userId} was removed`, {
      userId,
      displayName: userData?.displayName || 'Unknown',
      lastSeen: userData?.lastSeen || 'Never',
    });

    return null;
  }
);

/**
 * Ensure user data has lastSeen timestamp when created/updated
 */
export const validateUserPresence = onValueWritten(
  { ref: '/users/{userId}', ...RUNTIME_OPTIONS },
  async (event) => {
    const userId = event.params.userId;
    const newData = event.data.after.val();

    // If user was deleted, no action needed
    if (!newData) {
      return null;
    }

    // If user data exists but doesn't have lastSeen, add it
    if (!newData.lastSeen) {
      const db = getDatabase();
      await db.ref(`users/${userId}/lastSeen`).set(ServerValue.TIMESTAMP);

      logger.info(`Added lastSeen timestamp to user ${userId}`);
    }

    return null;
  }
);

/**
 * Manual cleanup function for development/testing
 * Can be called via Firebase Functions shell or HTTP trigger in development
 */
export const manualCleanupStaleUsers = onCall(
  RUNTIME_OPTIONS,
  async (request: CallableRequest<{ minutes?: number }>) => {
    // Only allow authenticated admin users to call this in production
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    if (!isEmulator && (!request.auth || !request.auth.token.admin)) {
      throw new HttpsError('permission-denied', 'Only admin users can trigger manual cleanup');
    }

    const db = getDatabase();
    const customThresholdMinutes = request.data?.minutes || 20;
    const thresholdTime = Date.now() - customThresholdMinutes * 60 * 1000;

    try {
      const staleUsersSnapshot = await db
        .ref('users')
        .orderByChild('lastSeen')
        .endAt(thresholdTime)
        .once('value');

      if (!staleUsersSnapshot.exists()) {
        return { success: true, message: 'No stale users found', cleanedCount: 0 };
      }

      const staleUsers = staleUsersSnapshot.val();
      const userIds = Object.keys(staleUsers);
      const userCount = userIds.length;

      // Remove all stale users
      const updates: { [key: string]: null } = {};
      userIds.forEach((userId) => {
        updates[`users/${userId}`] = null;
      });

      await db.ref().update(updates);

      logger.info(
        `Manual cleanup: removed ${userCount} stale users (threshold: ${customThresholdMinutes} minutes)`
      );

      return {
        success: true,
        message: `Successfully cleaned up ${userCount} users older than ${customThresholdMinutes} minutes`,
        cleanedCount: userCount,
      };
    } catch (error) {
      logger.error('Error in manual cleanup:', error);
      throw new HttpsError('internal', 'Failed to cleanup users');
    }
  }
);

/**
 * Scheduled function to clean up inactive anonymous Firebase Auth accounts
 * Runs daily at midnight UTC and removes anonymous users who haven't signed in for over 30 days
 */
export const cleanupInactiveAnonymousAccounts = onSchedule(
  { schedule: '0 0 * * *', ...RUNTIME_OPTIONS },
  async () => {
    const auth = getAuth();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      logger.info('Starting inactive anonymous account cleanup process');

      let totalDeleted = 0;
      let pageToken: string | undefined = undefined;
      const batchSize = 1000; // Firebase Auth allows up to 1000 users per batch

      do {
        // List users in batches
        const listUsersResult: ListUsersResult = await auth.listUsers(batchSize, pageToken);

        // Filter for anonymous users who haven't signed in for over 30 days
        const inactiveAnonymousUsers = listUsersResult.users.filter((user: UserRecord) => {
          // Check if user is anonymous (no providers or only anonymous provider)
          const isAnonymous = user.providerData.length === 0;

          if (!isAnonymous) {
            return false;
          }

          // Check last sign-in time
          const lastSignInTime = user.metadata.lastSignInTime;
          if (!lastSignInTime) {
            // If no last sign-in time, use creation time
            const creationTime = new Date(user.metadata.creationTime);
            return creationTime < thirtyDaysAgo;
          }

          const lastSignIn = new Date(lastSignInTime);
          return lastSignIn < thirtyDaysAgo;
        });

        if (inactiveAnonymousUsers.length > 0) {
          logger.info(
            `Found ${inactiveAnonymousUsers.length} inactive anonymous users in this batch`
          );

          // Delete users in batches (Firebase Admin SDK supports batch deletion)
          const uidsToDelete = inactiveAnonymousUsers.map((user: UserRecord) => user.uid);
          const deleteResult = await auth.deleteUsers(uidsToDelete);

          if (deleteResult.failureCount > 0) {
            logger.warn(
              `Failed to delete ${deleteResult.failureCount} users:`,
              deleteResult.errors.map((error) => ({
                uid: uidsToDelete[error.index],
                error: error.error.message,
              }))
            );
          }

          totalDeleted += deleteResult.successCount;
          logger.info(
            `Successfully deleted ${deleteResult.successCount} anonymous users in this batch`
          );
        }

        pageToken = listUsersResult.pageToken;
      } while (pageToken);

      // The count goes to the log rather than a return value: onSchedule handlers
      // resolve to void, and nothing consumes a scheduled function's result.
      logger.info(`Cleanup completed. Total anonymous users deleted: ${totalDeleted}`);
    } catch (error) {
      logger.error('Error cleaning up inactive anonymous accounts:', error);
      throw error;
    }
  }
);

/**
 * Scheduled function to clean up stale video call signaling data
 * Runs every 5 minutes and removes offers, answers, and ICE candidates older than 2 minutes
 */
export const cleanupVideoCallSignaling = onSchedule(
  // Ghost pruning re-reads each candidate in its own transaction, so the round
  // trips scale with ghost count. The default 60s would abandon the sweep
  // mid-pass, and it always restarts at the first room, so rooms late in
  // iteration order would never be reached.
  { schedule: 'every 5 minutes', timeoutSeconds: 300, ...RUNTIME_OPTIONS },
  async () => {
    const db = getDatabase();
    /** Signalling older than this is abandoned. Recomputed per room: see timeoutSeconds. */
    const signalStaleBefore = () => Date.now() - 2 * 60 * 1000;
    // 10 minutes: 20x the client heartbeat. Kept in step with ROSTER_STALE_MS in
    // src/stores/videoCallStore.ts, which applies the same rule client-side —
    // separate packages, so the two constants cannot be shared.
    const ROSTER_STALE_MS = 10 * 60 * 1000;

    // A missing timestamp is treated as expired, not as "keep forever" — those are
    // exactly the entries that survive indefinitely and hold mesh slots. Read fresh
    // each call: the sweep can now run for minutes.
    const isPresent = (presence: any): boolean => {
      const seen = presence?.lastSeen ?? presence?.joinedAt;
      return typeof seen === 'number' && seen >= Date.now() - ROSTER_STALE_MS;
    };

    try {
      logger.info('Starting video call signaling cleanup process');

      // Get all video call rooms
      const videoCallsSnapshot = await db.ref('video-calls').once('value');

      if (!videoCallsSnapshot.exists()) {
        logger.info('No video call rooms found to clean up');
        return;
      }

      const videoCallRooms = videoCallsSnapshot.val();
      const roomIds = Object.keys(videoCallRooms);
      let totalCleaned = 0;

      for (const roomId of roomIds) {
        const roomData = videoCallRooms[roomId];

        // A crashed tab leaves a ghost: onDisconnect only fires when the socket
        // dies, and every ghost holds one of the four mesh slots real callers need.
        // Cutoff sits well clear of the client's 30s heartbeat so a throttled
        // background tab is never mistaken for a departure.
        if (roomData.users) {
          let removed = 0;

          for (const [userId, presence] of Object.entries<any>(roomData.users)) {
            if (isPresent(presence)) continue;

            // This loop awaits its way through every room, so `presence` — from the
            // one up-front read — can be minutes old by now and the user may have
            // rejoined mid-call. Decide the delete against the presence that exists
            // at deletion time, never against the snapshot.
            const { committed } = await db
              .ref(`video-calls/${roomId}/users/${userId}`)
              .transaction((current: any) => {
                if (current === null) return undefined;
                return isPresent(current) ? undefined : null;
              });

            // Only a committed delete drops the local copy the room check below
            // reads, so every uncertain case keeps the room alive: forgetting a
            // spared entry could delete a room out from under a live caller, while
            // keeping an already-gone one just defers removal to the next sweep.
            if (committed) {
              delete roomData.users[userId];
              removed++;
            }
          }

          if (removed > 0) {
            logger.info(`Removed ${removed} stale participants from room ${roomId}`);
          }
        }

        // Same staleness argument as above, with worse consequences: a user who
        // joined this ghost-only room mid-sweep is absent from the local copy, and
        // deleting the room would take their presence and queued offers with it.
        if (!roomData.users || Object.keys(roomData.users).length === 0) {
          const { committed } = await db
            .ref(`video-calls/${roomId}`)
            .transaction((current: any) => {
              if (current === null) return undefined;
              if (current.users && Object.keys(current.users).length > 0) return undefined;
              return null;
            });

          if (committed) {
            logger.info(`Removed empty video call room: ${roomId}`);
            totalCleaned++;
          }
          continue;
        }

        // Clean up old offers
        if (roomData.offers) {
          const updates: { [key: string]: null } = {};
          Object.entries(roomData.offers).forEach(([userId, userOffers]: [string, any]) => {
            if (userOffers) {
              Object.entries(userOffers).forEach(([offerId, offer]: [string, any]) => {
                if (offer?.timestamp && offer.timestamp < signalStaleBefore()) {
                  updates[`video-calls/${roomId}/offers/${userId}/${offerId}`] = null;
                }
              });
            }
          });

          if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            logger.info(`Cleaned ${Object.keys(updates).length} old offers from room ${roomId}`);
          }
        }

        // Clean up old answers
        if (roomData.answers) {
          const updates: { [key: string]: null } = {};
          Object.entries(roomData.answers).forEach(([userId, userAnswers]: [string, any]) => {
            if (userAnswers) {
              Object.entries(userAnswers).forEach(([answerId, answer]: [string, any]) => {
                if (answer?.timestamp && answer.timestamp < signalStaleBefore()) {
                  updates[`video-calls/${roomId}/answers/${userId}/${answerId}`] = null;
                }
              });
            }
          });

          if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            logger.info(`Cleaned ${Object.keys(updates).length} old answers from room ${roomId}`);
          }
        }

        // Clean up old ICE candidates
        if (roomData['ice-candidates']) {
          const updates: { [key: string]: null } = {};
          Object.entries(roomData['ice-candidates']).forEach(
            ([userId, userCandidates]: [string, any]) => {
              if (userCandidates) {
                Object.entries(userCandidates).forEach(
                  ([candidateId, candidate]: [string, any]) => {
                    if (candidate?.timestamp && candidate.timestamp < signalStaleBefore()) {
                      updates[`video-calls/${roomId}/ice-candidates/${userId}/${candidateId}`] =
                        null;
                    }
                  }
                );
              }
            }
          );

          if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            logger.info(
              `Cleaned ${Object.keys(updates).length} old ICE candidates from room ${roomId}`
            );
          }
        }
      }

      logger.info(
        `Video call signaling cleanup completed. Rooms processed: ${roomIds.length}, empty rooms removed: ${totalCleaned}`
      );
    } catch (error) {
      logger.error('Error cleaning up video call signaling data:', error);
      throw error;
    }
  }
);

/**
 * Manual cleanup function for inactive anonymous accounts
 * Can be called via Firebase Functions shell or HTTP trigger for testing
 */
export const manualCleanupAnonymousAccounts = onCall(
  RUNTIME_OPTIONS,
  async (request: CallableRequest<{ days?: number }>) => {
    // Only allow authenticated admin users to call this in production
    // In development/emulator, allow calls without authentication for testing
    const isProduction = process.env.NODE_ENV === 'production';
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

    if (isProduction && (!request.auth || !request.auth.token?.admin)) {
      throw new HttpsError('permission-denied', 'Only admin users can trigger manual cleanup');
    }

    logger.info(
      `Manual cleanup called ${isEmulator ? '(emulator)' : isProduction ? '(production)' : '(development)'}`
    );
    logger.info('Authentication context:', {
      hasAuth: !!request.auth,
      uid: request.auth?.uid,
      isAdmin: request.auth?.token?.admin,
    });

    const auth = getAuth();
    const customThresholdDays = request.data?.days || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - customThresholdDays);

    try {
      logger.info(
        `Manual cleanup: searching for anonymous users inactive for more than ${customThresholdDays} days`
      );

      let totalDeleted = 0;
      let pageToken: string | undefined = undefined;
      const batchSize = 1000;

      do {
        const listUsersResult: ListUsersResult = await auth.listUsers(batchSize, pageToken);

        const inactiveAnonymousUsers = listUsersResult.users.filter((user: UserRecord) => {
          const isAnonymous = user.providerData.length === 0;

          if (!isAnonymous) {
            return false;
          }

          const lastSignInTime = user.metadata.lastSignInTime;
          if (!lastSignInTime) {
            const creationTime = new Date(user.metadata.creationTime);
            return creationTime < thresholdDate;
          }

          const lastSignIn = new Date(lastSignInTime);
          return lastSignIn < thresholdDate;
        });

        if (inactiveAnonymousUsers.length > 0) {
          const uidsToDelete = inactiveAnonymousUsers.map((user: UserRecord) => user.uid);
          const deleteResult = await auth.deleteUsers(uidsToDelete);

          if (deleteResult.failureCount > 0) {
            logger.warn(
              `Manual cleanup: Failed to delete ${deleteResult.failureCount} users:`,
              deleteResult.errors.map((error) => ({
                uid: uidsToDelete[error.index],
                error: error.error.message,
              }))
            );
          }

          totalDeleted += deleteResult.successCount;
        }

        pageToken = listUsersResult.pageToken;
      } while (pageToken);

      logger.info(
        `Manual cleanup completed. Deleted ${totalDeleted} anonymous users (threshold: ${customThresholdDays} days)`
      );

      return {
        success: true,
        message: `Successfully cleaned up ${totalDeleted} anonymous accounts older than ${customThresholdDays} days`,
        deletedCount: totalDeleted,
      };
    } catch (error) {
      logger.error('Error in manual anonymous account cleanup:', error);
      throw new HttpsError('internal', 'Failed to cleanup anonymous accounts');
    }
  }
);
