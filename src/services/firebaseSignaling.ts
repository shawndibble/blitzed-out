import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  onChildAdded,
  off,
  onDisconnect,
} from 'firebase/database';

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
  private roomId: string | null = null;
  private userId: string | null = null;
  private processedCandidates: Set<string> = new Set();

  initialize(roomId: string, userId: string, onSignal: (data: SignalData) => void) {
    this.userId = userId;
    this.roomId = roomId;
    const database = getDatabase();
    this.roomRef = ref(database, `video-calls/${roomId}`);

    const userPresenceRef = ref(database, `video-calls/${roomId}/users/${userId}`);
    set(userPresenceRef, {
      joinedAt: Date.now(),
      status: 'online',
    });

    onDisconnect(userPresenceRef).remove();

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

    this.processedCandidates.clear();
    this.roomId = null;
    this.userId = null;
  }
}

export const firebaseSignaling = new FirebaseSignalingService();
