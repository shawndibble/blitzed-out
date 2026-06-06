import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

import { ListUsersResult, UserRecord } from 'firebase-admin/auth';

// Initialize Firebase Admin with proper credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DATABASE_URL || 'https://blitzed-out-default-rtdb.firebaseio.com/',
  });
}

/**
 * Scheduled function to clean up stale users every 5 minutes
 * Removes users who haven't updated their lastSeen timestamp in 20 minutes
 */
export const cleanupStaleUsers = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const db = admin.database();
  const twentyMinutesAgo = Date.now() - 20 * 60 * 1000; // 20 minutes in milliseconds

  try {
    functions.logger.info('Starting stale user cleanup process');

    // Get all users with lastSeen older than 20 minutes
    const staleUsersSnapshot = await db
      .ref('users')
      .orderByChild('lastSeen')
      .endAt(twentyMinutesAgo)
      .once('value');

    if (!staleUsersSnapshot.exists()) {
      functions.logger.info('No stale users found to clean up');
      return null;
    }

    const staleUsers = staleUsersSnapshot.val();
    const userIds = Object.keys(staleUsers);
    const userCount = userIds.length;

    functions.logger.info(`Found ${userCount} stale users to clean up`);

    // For large user counts or when atomicity is critical, use transaction
    if (userCount > 100) {
      functions.logger.info(
        `Large user count (${userCount}), using transaction for atomic deletion`
      );

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

    functions.logger.info(`Successfully cleaned up ${userCount} stale users`);
    return null;
  } catch (error) {
    functions.logger.error('Error cleaning up stale users:', error);
    throw error;
  }
});

/**
 * Trigger when a user is manually deleted (backup cleanup logging)
 */
export const onUserDisconnect = functions.database
  .ref('/users/{userId}')
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;
    const userData = snapshot.val();

    functions.logger.info(`User ${userId} was removed`, {
      userId,
      displayName: userData?.displayName || 'Unknown',
      lastSeen: userData?.lastSeen || 'Never',
    });

    return null;
  });

/**
 * Ensure user data has lastSeen timestamp when created/updated
 */
export const validateUserPresence = functions.database
  .ref('/users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.val();

    // If user was deleted, no action needed
    if (!newData) {
      return null;
    }

    // If user data exists but doesn't have lastSeen, add it
    if (!newData.lastSeen) {
      const db = admin.database();
      await db.ref(`users/${userId}/lastSeen`).set(admin.database.ServerValue.TIMESTAMP);

      functions.logger.info(`Added lastSeen timestamp to user ${userId}`);
    }

    return null;
  });

/**
 * Manual cleanup function for development/testing
 * Can be called via Firebase Functions shell or HTTP trigger in development
 */
export const manualCleanupStaleUsers = functions.https.onCall(async (data, context) => {
  // Only allow authenticated admin users to call this in production
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!isEmulator && (!context.auth || !context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admin users can trigger manual cleanup'
    );
  }

  const db = admin.database();
  const customThresholdMinutes = data.minutes || 20;
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

    functions.logger.info(
      `Manual cleanup: removed ${userCount} stale users (threshold: ${customThresholdMinutes} minutes)`
    );

    return {
      success: true,
      message: `Successfully cleaned up ${userCount} users older than ${customThresholdMinutes} minutes`,
      cleanedCount: userCount,
    };
  } catch (error) {
    functions.logger.error('Error in manual cleanup:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cleanup users');
  }
});

/**
 * Scheduled function to clean up inactive anonymous Firebase Auth accounts
 * Runs daily at midnight UTC and removes anonymous users who haven't signed in for over 30 days
 */
export const cleanupInactiveAnonymousAccounts = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async () => {
    const auth = admin.auth();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      functions.logger.info('Starting inactive anonymous account cleanup process');

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
          functions.logger.info(
            `Found ${inactiveAnonymousUsers.length} inactive anonymous users in this batch`
          );

          // Delete users in batches (Firebase Admin SDK supports batch deletion)
          const uidsToDelete = inactiveAnonymousUsers.map((user: UserRecord) => user.uid);
          const deleteResult = await auth.deleteUsers(uidsToDelete);

          if (deleteResult.failureCount > 0) {
            functions.logger.warn(
              `Failed to delete ${deleteResult.failureCount} users:`,
              deleteResult.errors.map((error) => ({
                uid: uidsToDelete[error.index],
                error: error.error.message,
              }))
            );
          }

          totalDeleted += deleteResult.successCount;
          functions.logger.info(
            `Successfully deleted ${deleteResult.successCount} anonymous users in this batch`
          );
        }

        pageToken = listUsersResult.pageToken;
      } while (pageToken);

      functions.logger.info(`Cleanup completed. Total anonymous users deleted: ${totalDeleted}`);
      return { success: true, deletedCount: totalDeleted };
    } catch (error) {
      functions.logger.error('Error cleaning up inactive anonymous accounts:', error);
      throw error;
    }
  });

/**
 * Scheduled function to clean up stale video call signaling data
 * Runs every 5 minutes and removes offers, answers, and ICE candidates older than 2 minutes
 */
export const cleanupVideoCallSignaling = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const db = admin.database();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000; // 2 minutes in milliseconds

    try {
      functions.logger.info('Starting video call signaling cleanup process');

      // Get all video call rooms
      const videoCallsSnapshot = await db.ref('video-calls').once('value');

      if (!videoCallsSnapshot.exists()) {
        functions.logger.info('No video call rooms found to clean up');
        return null;
      }

      const videoCallRooms = videoCallsSnapshot.val();
      const roomIds = Object.keys(videoCallRooms);
      let totalCleaned = 0;

      for (const roomId of roomIds) {
        const roomData = videoCallRooms[roomId];

        // Check if room has any active users
        const hasActiveUsers = roomData.users && Object.keys(roomData.users).length > 0;

        // If no active users, delete the entire room
        if (!hasActiveUsers) {
          await db.ref(`video-calls/${roomId}`).remove();
          functions.logger.info(`Removed empty video call room: ${roomId}`);
          totalCleaned++;
          continue;
        }

        // Clean up old offers
        if (roomData.offers) {
          const updates: { [key: string]: null } = {};
          Object.entries(roomData.offers).forEach(([userId, userOffers]: [string, any]) => {
            if (userOffers) {
              Object.entries(userOffers).forEach(([offerId, offer]: [string, any]) => {
                if (offer?.timestamp && offer.timestamp < twoMinutesAgo) {
                  updates[`video-calls/${roomId}/offers/${userId}/${offerId}`] = null;
                }
              });
            }
          });

          if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            functions.logger.info(
              `Cleaned ${Object.keys(updates).length} old offers from room ${roomId}`
            );
          }
        }

        // Clean up old answers
        if (roomData.answers) {
          const updates: { [key: string]: null } = {};
          Object.entries(roomData.answers).forEach(([userId, userAnswers]: [string, any]) => {
            if (userAnswers) {
              Object.entries(userAnswers).forEach(([answerId, answer]: [string, any]) => {
                if (answer?.timestamp && answer.timestamp < twoMinutesAgo) {
                  updates[`video-calls/${roomId}/answers/${userId}/${answerId}`] = null;
                }
              });
            }
          });

          if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            functions.logger.info(
              `Cleaned ${Object.keys(updates).length} old answers from room ${roomId}`
            );
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
                    if (candidate?.timestamp && candidate.timestamp < twoMinutesAgo) {
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
            functions.logger.info(
              `Cleaned ${Object.keys(updates).length} old ICE candidates from room ${roomId}`
            );
          }
        }
      }

      functions.logger.info(
        `Video call signaling cleanup completed. Rooms processed: ${roomIds.length}, empty rooms removed: ${totalCleaned}`
      );
      return null;
    } catch (error) {
      functions.logger.error('Error cleaning up video call signaling data:', error);
      throw error;
    }
  });

/**
 * Manual cleanup function for inactive anonymous accounts
 * Can be called via Firebase Functions shell or HTTP trigger for testing
 */
export const manualCleanupAnonymousAccounts = functions.https.onCall(async (data, context) => {
  // Only allow authenticated admin users to call this in production
  // In development/emulator, allow calls without authentication for testing
  const isProduction = process.env.NODE_ENV === 'production';
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  if (isProduction && (!context.auth || !context.auth.token?.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admin users can trigger manual cleanup'
    );
  }

  functions.logger.info(
    `Manual cleanup called ${isEmulator ? '(emulator)' : isProduction ? '(production)' : '(development)'}`
  );
  functions.logger.info('Authentication context:', {
    hasAuth: !!context.auth,
    uid: context.auth?.uid,
    isAdmin: context.auth?.token?.admin,
  });

  const auth = admin.auth();
  const customThresholdDays = data.days || 30;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - customThresholdDays);

  try {
    functions.logger.info(
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
          functions.logger.warn(
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

    functions.logger.info(
      `Manual cleanup completed. Deleted ${totalDeleted} anonymous users (threshold: ${customThresholdDays} days)`
    );

    return {
      success: true,
      message: `Successfully cleaned up ${totalDeleted} anonymous accounts older than ${customThresholdDays} days`,
      deletedCount: totalDeleted,
    };
  } catch (error) {
    functions.logger.error('Error in manual anonymous account cleanup:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cleanup anonymous accounts');
  }
});
