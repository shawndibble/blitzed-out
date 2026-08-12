import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  onChildAdded,
  off,
  onDisconnect,
  serverTimestamp,
  get,
} from 'firebase/database';
import { logger } from '@/utils/logger';

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  timestamp: number;
}

export interface SignalingCallbacks {
  onOffer?: (from: string, sdp: string) => void;
  onAnswer?: (from: string, sdp: string) => void;
  onIceCandidate?: (from: string, candidate: RTCIceCandidateInit) => void;
}

class FirebaseSignalingService {
  private roomRef: any = null;
  private offersRef: any = null;
  private answersRef: any = null;
  private iceCandidatesRef: any = null;
  private presenceRef: any = null;
  private presenceOnDisconnect: any = null;
  /** Server-resolved join time; null until the first write is read back. */
  private joinedAt: number | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  private processedCandidates: Set<string> = new Set();

  /**
   * Claim a roster slot. Separate from `listen` because minting TURN credentials
   * requires presence to exist first, and that call must not run while signals
   * are already arriving — see `listen`.
   */
  claim(roomId: string, userId: string): Promise<void> {
    this.userId = userId;
    this.roomId = roomId;
    const database = getDatabase();
    this.roomRef = ref(database, `video-calls/${roomId}`);

    this.joinedAt = null;
    this.presenceRef = ref(database, `video-calls/${roomId}/users/${userId}`);

    this.presenceOnDisconnect = onDisconnect(this.presenceRef);
    this.presenceOnDisconnect.remove();

    return this.setPresent(true).then(async () => {
      // Read back what the server resolved the sentinel to, so the 30s heartbeat
      // can rewrite the node without advancing the join time on every beat.
      try {
        const snapshot = await get(ref(database, `video-calls/${roomId}/users/${userId}/joinedAt`));
        const value = snapshot.val();
        if (typeof value === 'number') this.joinedAt = value;
      } catch (error) {
        logger.warn('[signaling] Could not read back joinedAt', error);
      }
    });
  }

  /**
   * Start consuming signals. Attach only once the caller can act on them:
   * `onChildAdded` replays every queued offer the instant it binds, and an offer
   * dropped here is gone — the sender does not learn it was ignored and will not
   * retry until its own 30s connect timeout expires.
   */
  listen(onSignal: (data: SignalData) => void) {
    const { roomId, userId } = this;
    if (!roomId || !userId) {
      throw new Error('Call claim() before listen()');
    }
    const database = getDatabase();

    this.offersRef = ref(database, `video-calls/${roomId}/offers/${userId}`);
    onChildAdded(this.offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.from && data.from !== userId && data?.sdp) {
        onSignal(data);

        // Clean up old offer after processing to prevent duplicates
        if (snapshot.key) {
          setTimeout(() => {
            const offerToDelete = ref(
              database,
              `video-calls/${roomId}/offers/${userId}/${snapshot.key}`
            );
            set(offerToDelete, null);
          }, 5000); // 5 second delay to ensure processing completes
        }
      }
    });

    this.answersRef = ref(database, `video-calls/${roomId}/answers/${userId}`);
    onChildAdded(this.answersRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.from && data.from !== userId && data?.sdp) {
        onSignal(data);

        // Clean up old answer after processing to prevent duplicates
        if (snapshot.key) {
          setTimeout(() => {
            const answerToDelete = ref(
              database,
              `video-calls/${roomId}/answers/${userId}/${snapshot.key}`
            );
            set(answerToDelete, null);
          }, 5000); // 5 second delay to ensure processing completes
        }
      }
    });

    this.iceCandidatesRef = ref(database, `video-calls/${roomId}/ice-candidates/${userId}`);
    onValue(this.iceCandidatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([key, candidate]: [string, any]) => {
          const candidateId = `${candidate?.from}-${key}`;
          if (
            candidate?.from &&
            candidate.from !== userId &&
            !this.processedCandidates.has(candidateId)
          ) {
            this.processedCandidates.add(candidateId);
            onSignal(candidate);

            if (this.processedCandidates.size > 1000) {
              const iterator = this.processedCandidates.values();
              for (let i = 0; i < 500; i++) {
                const next = iterator.next();
                if (!next.done && next.value) {
                  this.processedCandidates.delete(next.value);
                }
              }
            }
          }
        });
      }
    });
  }

  async sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    if (!this.roomId || !this.userId) {
      throw new Error('Signaling not initialized');
    }

    const database = getDatabase();
    const offerRef = ref(database, `video-calls/${this.roomId}/offers/${targetUserId}`);

    const offerData = {
      type: 'offer',
      sdp: offer.sdp,
      from: this.userId,
      timestamp: Date.now(),
    };

    await push(offerRef, offerData);
  }

  async sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    if (!this.roomId || !this.userId) {
      throw new Error('Signaling not initialized');
    }

    const database = getDatabase();
    const answerRef = ref(database, `video-calls/${this.roomId}/answers/${targetUserId}`);

    const answerData = {
      type: 'answer',
      sdp: answer.sdp,
      from: this.userId,
      timestamp: Date.now(),
    };

    await push(answerRef, answerData);
  }

  async sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    if (!this.roomId || !this.userId) {
      throw new Error('Signaling not initialized');
    }

    const database = getDatabase();
    const iceCandidatesRef = ref(
      database,
      `video-calls/${this.roomId}/ice-candidates/${targetUserId}`
    );

    const candidateRef = await push(iceCandidatesRef, {
      type: 'ice-candidate',
      candidate,
      from: this.userId,
      timestamp: Date.now(),
    });

    // Auto-cleanup ICE candidates after 30 seconds to prevent memory buildup
    setTimeout(() => {
      if (candidateRef.key) {
        const specificCandidateRef = ref(
          database,
          `video-calls/${this.roomId}/ice-candidates/${targetUserId}/${candidateRef.key}`
        );
        set(specificCandidateRef, null);
      }
    }, 30000);
  }

  /**
   * Claim or release a roster slot.
   *
   * Claiming rewrites the whole node rather than touching `lastSeen` alone. A
   * socket blip fires the armed `onDisconnect` and deletes the node; the SDK
   * re-arms it but never rewrites the data, and a lone `lastSeen` child would
   * then fail the rule's `hasChildren(['joinedAt','status'])` — leaving the user
   * invisible on every roster for the rest of the call.
   */
  async setPresent(present: boolean): Promise<void> {
    if (!this.presenceRef) return;

    if (!present) {
      await set(this.presenceRef, null);
      return;
    }

    // Server time, not the device's. Staleness is judged by other clients and by
    // the cleanup job, so a device with a skewed clock would otherwise be read as
    // a ghost by everyone — dropped from rosters, offers refused, and pruned
    // server-side, with nothing to correct it.
    await set(this.presenceRef, {
      joinedAt: this.joinedAt ?? serverTimestamp(),
      lastSeen: serverTimestamp(),
      status: 'online',
    });
  }

  /**
   * Refresh the roster timestamp. `cleanupVideoCallSignaling` evicts entries that
   * have gone stale, and `joinedAt` alone would evict anyone still in a long call.
   * Unlike `claim`, a missed beat is survivable — the next one is 30s away.
   */
  async heartbeat(): Promise<void> {
    try {
      await this.setPresent(true);
    } catch (error) {
      logger.warn('[signaling] Presence heartbeat failed', error);
    }
  }

  cleanup() {
    if (this.offersRef) {
      off(this.offersRef);
      this.offersRef = null;
    }

    if (this.answersRef) {
      off(this.answersRef);
      this.answersRef = null;
    }

    if (this.iceCandidatesRef) {
      off(this.iceCandidatesRef);
      this.iceCandidatesRef = null;
    }

    if (this.roomRef) {
      off(this.roomRef);
      this.roomRef = null;
    }

    // onDisconnect only fires when the socket drops, and leaving a call does not
    // drop it. Without this the user lingers on the roster, and everyone still in
    // the room spends a MAX_PEERS slot dialling a phantom that will never answer.
    if (this.presenceRef) {
      this.presenceOnDisconnect?.cancel?.();
      this.setPresent(false);
      this.presenceRef = null;
      this.presenceOnDisconnect = null;
      this.joinedAt = null;
    }

    this.processedCandidates.clear();
    this.roomId = null;
    this.userId = null;
  }
}

export const firebaseSignaling = new FirebaseSignalingService();
