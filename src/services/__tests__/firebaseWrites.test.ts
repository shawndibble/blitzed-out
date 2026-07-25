/**
 * Characterization + regression tests for the write side of
 * `src/services/firebase.ts`: sendMessage's duplicate guard, getOrCreateBoard's
 * return value, and the schedule writers/reader.
 *
 * The mock shape mirrors firebaseSubscriptions.test.ts (same module, other half).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addSchedule, getOrCreateBoard, getSchedule, sendMessage } from '@/services/firebase';
import type { User } from '@/types';

const h = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn((_db: unknown, ...pathSegments: string[]) => ({ pathSegments })),
  doc: vi.fn((_db: unknown, ...pathSegments: string[]) => ({ pathSegments })),
  query: vi.fn((...parts: unknown[]) => ({ parts })),
  auth: {
    currentUser: { uid: 'u1' } as { uid: string } | null,
    onAuthStateChanged: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  collection: h.collection,
  doc: h.doc,
  addDoc: h.addDoc,
  updateDoc: h.updateDoc,
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: h.getDocs,
  query: h.query,
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
  limit: vi.fn((n: number) => ({ n })),
  onSnapshot: h.onSnapshot,
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
    })),
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => h.auth),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  linkWithCredential: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
}));

const user = { uid: 'u1', displayName: 'Tester' } as User;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  h.auth.currentUser = { uid: 'u1' };
  h.addDoc.mockResolvedValue({ id: 'new-doc' });
  h.updateDoc.mockResolvedValue(undefined);
  h.getDocs.mockResolvedValue({ size: 0, docs: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sendMessage duplicate guard', () => {
  it('drops an immediate repeat of the same message (double-submit protection)', async () => {
    await sendMessage({ room: 'PUBLIC', user, text: 'hello', type: 'chat' });
    await sendMessage({ room: 'PUBLIC', user, text: 'hello', type: 'chat' });

    expect(h.addDoc).toHaveBeenCalledTimes(1);
  });

  it('sends a genuine repeat the user types moments later', async () => {
    await sendMessage({ room: 'PUBLIC', user, text: 'lol', type: 'chat' });

    // Saying the same thing twice in a chat is normal. The guard exists to
    // swallow a double submit, not to mute the user for the rest of the session.
    await vi.advanceTimersByTimeAsync(5_000);
    await sendMessage({ room: 'PUBLIC', user, text: 'lol', type: 'chat' });

    expect(h.addDoc).toHaveBeenCalledTimes(2);
  });

  it('does not let one room mute the same text in another room', async () => {
    await sendMessage({ room: 'PUBLIC', user, text: 'ready', type: 'chat' });
    await sendMessage({ room: 'PRIVATE1', user, text: 'ready', type: 'chat' });

    expect(h.addDoc).toHaveBeenCalledTimes(2);
  });

  it('still writes the trimmed text, uid, displayName and a server timestamp', async () => {
    await sendMessage({ room: 'public', user, text: '  spaced  ', type: 'chat' });

    const [ref, payload] = h.addDoc.mock.calls[0] as any[];
    expect(ref.pathSegments).toEqual(['chat-rooms', 'PUBLIC', 'messages']);
    expect(payload).toMatchObject({
      text: 'spaced',
      type: 'chat',
      uid: 'u1',
      displayName: 'Tester',
      timestamp: 'SERVER_TS',
    });
  });

  it('rejects an unknown message type without writing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await sendMessage({ room: 'PUBLIC', user, text: 'x', type: 'bogus' as any });

    expect(h.addDoc).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('getOrCreateBoard', () => {
  const board = { title: 'My Board', gameBoard: '[]', settings: '{}' };

  it('returns the id of a newly stored board', async () => {
    h.getDocs.mockResolvedValue({ size: 0, docs: [] });
    h.addDoc.mockResolvedValue({ id: 'created-id' });

    const result = await getOrCreateBoard(board);

    expect(result).toEqual({ id: 'created-id' });
  });

  it('returns the id of an existing board and refreshes its ttl', async () => {
    const existing = { id: 'existing-id', ref: { path: 'game-boards/existing-id' } };
    h.getDocs.mockResolvedValue({ size: 1, docs: [existing] });

    const result = await getOrCreateBoard(board);

    // One declared type, one shape: callers only ever needed the id, and the
    // cache-hit and miss branches used to hand back two different Firestore
    // classes under one declared type.
    expect(result).toEqual({ id: 'existing-id' });
    expect(h.updateDoc).toHaveBeenCalledWith(
      existing.ref,
      expect.objectContaining({ ttl: expect.any(Date) })
    );
  });

  it('returns undefined without touching Firestore when the title is empty', async () => {
    expect(await getOrCreateBoard({ ...board, title: '' })).toBeUndefined();
    expect(h.getDocs).not.toHaveBeenCalled();
    expect(h.addDoc).not.toHaveBeenCalled();
  });
});

describe('schedule', () => {
  it('hands the caller a Dayjs dateTime, not a Firestore Timestamp', async () => {
    const when = new Date('2026-08-01T18:30:00.000Z');
    let received: Array<Record<string, unknown>> = [];
    h.onSnapshot.mockImplementation((_q: unknown, onNext: (snap: unknown) => void) => {
      onNext({
        docs: [
          {
            id: 's1',
            data: () => ({
              dateTime: { seconds: when.getTime() / 1000, nanoseconds: 0, toDate: () => when },
              url: 'https://example.com/room',
              room: 'PUBLIC',
            }),
          },
        ],
      });
      return () => undefined;
    });

    getSchedule((schedule) => {
      received = schedule;
    });

    // ScheduleItem.dateTime is declared dayjs.Dayjs, and the views call the
    // dayjs API on it — so the read side has to convert.
    const item = received[0] as any;
    expect(typeof item.dateTime?.format).toBe('function');
    expect(item.dateTime.toDate().toISOString()).toBe(when.toISOString());
    expect(item.id).toBe('s1');
  });

  it('writes a Firestore Timestamp for the scheduled time', async () => {
    const when = new Date('2026-08-01T18:30:00.000Z');

    await addSchedule(when, 'https://example.com/room', 'PUBLIC', 'u1');

    const payload = h.addDoc.mock.calls[0][1] as any;
    expect(payload.dateTime.seconds).toBe(Math.floor(when.getTime() / 1000));
    expect(payload).toMatchObject({
      url: 'https://example.com/room',
      room: 'PUBLIC',
      createdBy: 'u1',
    });
  });
});
