import { getDatabase, ref, set, push, onValue, off, onDisconnect } from 'firebase/database';

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
  private roomId: string | null = null;
  private userId: string | null = null;

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

    const offersRef = ref(database, `video-calls/${roomId}/offers/${userId}`);
    onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data && onSignal) {
        onSignal(data);
      }
    });

    const answersRef = ref(database, `video-calls/${roomId}/answers/${userId}`);
    onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      if (data && onSignal) {
        onSignal(data);
      }
    });

    const iceCandidatesRef = ref(database, `video-calls/${roomId}/ice-candidates/${userId}`);
    onValue(iceCandidatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((candidate: any) => {
          if (onSignal && candidate) {
            onSignal(candidate);
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

    await set(offerRef, {
      type: 'offer',
      sdp: offer.sdp,
      from: this.userId,
      timestamp: Date.now(),
    });
  }

  async sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    if (!this.roomId || !this.userId) {
      throw new Error('Signaling not initialized');
    }

    const database = getDatabase();
    const answerRef = ref(database, `video-calls/${this.roomId}/answers/${targetUserId}`);

    await set(answerRef, {
      type: 'answer',
      sdp: answer.sdp,
      from: this.userId,
      timestamp: Date.now(),
    });
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

    await push(iceCandidatesRef, {
      type: 'ice-candidate',
      candidate,
      from: this.userId,
      timestamp: Date.now(),
    });
  }

  cleanup() {
    if (this.roomRef && this.userId) {
      off(this.roomRef);
    }

    this.roomRef = null;
    this.roomId = null;
    this.userId = null;
  }
}

export const firebaseSignaling = new FirebaseSignalingService();
