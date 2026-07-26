/**
 * Scheduled public games: the upcoming list plus its writers.
 *
 * Owns the representation of `dateTime` in both directions — a Firestore
 * Timestamp on the wire, a Dayjs everywhere above.
 */
import { logger } from '@/utils/logger';
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from './app';

/** Upcoming games shown at once. */
const SCHEDULE_LIMIT = 50;

/**
 * `dateTime` is stored as a Firestore Timestamp and consumed as a Dayjs
 * (`ScheduleItem.dateTime`) — `scheduleStore` calls `isAfter`, the row view
 * calls `toDate`. Convert here so one representation crosses the boundary.
 */
function toScheduleItem(id: string, data: DocumentData): Record<string, unknown> {
  const { dateTime, ...rest } = data;
  const asDate = dateTime && typeof dateTime.toDate === 'function' ? dateTime.toDate() : dateTime;
  return { id, ...rest, dateTime: dayjs(asDate) };
}

export function getSchedule(
  callback: (schedule: Array<Record<string, unknown>>) => void
): () => void {
  // 5-minute lookback keeps games that just started visible as "current"
  const currentTime = new Date();
  currentTime.setMinutes(currentTime.getMinutes() - 5);

  const scheduleQuery = query(
    collection(db, 'schedule'),
    where('dateTime', '>', currentTime),
    orderBy('dateTime', 'asc'),
    limit(SCHEDULE_LIMIT)
  );

  return onSnapshot(
    scheduleQuery,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const schedule = querySnapshot.docs.map((document) =>
        toScheduleItem(document.id, document.data())
      );
      callback(schedule);
    },
    (error) => {
      logger.error('getSchedule error', error);
    }
  );
}

export async function addSchedule(
  dateTime: Date,
  url: string,
  room = 'PUBLIC',
  createdBy?: string
): Promise<DocumentReference<DocumentData>> {
  try {
    return await addDoc(collection(db, 'schedule'), {
      dateTime: Timestamp.fromDate(dateTime),
      url,
      room,
      createdBy: createdBy || '',
    });
  } catch (error) {
    logger.error('Schedule operation failed', error);
    throw error;
  }
}

export async function updateSchedule(
  scheduleId: string,
  updates: { dateTime: Date; url: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'schedule', scheduleId), {
      dateTime: Timestamp.fromDate(updates.dateTime),
      url: updates.url,
    });
  } catch (error) {
    logger.error('Schedule update failed', error);
    throw error;
  }
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'schedule', scheduleId));
  } catch (error) {
    logger.error('Schedule delete failed', error);
    throw error;
  }
}
