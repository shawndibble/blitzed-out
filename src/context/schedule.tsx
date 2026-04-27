import React, { useMemo, useEffect, useCallback, ReactNode, useRef } from 'react';
import { getSchedule, addSchedule, deleteSchedule, updateSchedule } from '@/services/firebase';
import { DocumentReference, DocumentData } from 'firebase/firestore';
import dayjs from 'dayjs';
import { useScheduleStore } from '@/stores/scheduleStore';

export interface ScheduleItem {
  id?: string;
  dateTime: dayjs.Dayjs;
  url: string;
  room: string;
  createdBy?: string;
  [key: string]: any;
}

export interface AddScheduleInput {
  dateTime: Date;
  url: string;
  room?: string;
  createdBy?: string;
}

export interface ScheduleContextType {
  schedule: ScheduleItem[];
  addToSchedule: (input: AddScheduleInput) => Promise<undefined | DocumentReference<DocumentData>>;
  updateScheduledGame: (id: string, updates: { dateTime: Date; url: string }) => Promise<void>;
  deleteScheduledGame: (id: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ScheduleContext = React.createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function ScheduleProvider(props: ScheduleProviderProps): JSX.Element {
  const {
    schedule,
    loadSchedule,
    updateScheduleItem,
    removeScheduleItem,
    flushPendingScheduleUpdates,
  } = useScheduleStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Optimized schedule update handler
  const handleScheduleUpdate = useCallback(
    (newSchedule: Array<Record<string, unknown>>) => {
      loadSchedule(newSchedule as unknown as ScheduleItem[]);
    },
    [loadSchedule]
  );

  // Memoized addToSchedule function to prevent unnecessary re-renders
  const memoizedAddToSchedule = useCallback(
    async ({
      dateTime,
      url,
      room,
      createdBy,
    }: AddScheduleInput): Promise<undefined | DocumentReference<DocumentData>> => {
      try {
        const result = await addSchedule(dateTime, url, room, createdBy);
        // Flush any pending updates after adding
        flushPendingScheduleUpdates();
        return result || undefined;
      } catch (error) {
        console.error('Error adding to schedule:', error);
        throw error;
      }
    },
    [flushPendingScheduleUpdates]
  );

  const memoizedUpdateScheduledGame = useCallback(
    async (id: string, updates: { dateTime: Date; url: string }): Promise<void> => {
      await updateSchedule(id, updates);
      updateScheduleItem(id, { ...updates, dateTime: dayjs(updates.dateTime) });
    },
    [updateScheduleItem]
  );

  const memoizedDeleteScheduledGame = useCallback(
    async (id: string): Promise<void> => {
      await deleteSchedule(id);
      removeScheduleItem(id);
    },
    [removeScheduleItem]
  );

  // Cleanup function for Firebase listener
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    // Flush any pending updates before cleanup
    flushPendingScheduleUpdates();
  }, [flushPendingScheduleUpdates]);

  useEffect(() => {
    // Clean up previous listener
    cleanup();

    // Set up new listener
    unsubscribeRef.current = getSchedule(handleScheduleUpdate);

    // Cleanup on unmount
    return cleanup;
  }, [handleScheduleUpdate, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized context value with stable references
  const value: ScheduleContextType = useMemo(
    () => ({
      schedule,
      addToSchedule: memoizedAddToSchedule,
      updateScheduledGame: memoizedUpdateScheduledGame,
      deleteScheduledGame: memoizedDeleteScheduledGame,
    }),
    [schedule, memoizedAddToSchedule, memoizedUpdateScheduledGame, memoizedDeleteScheduledGame]
  );

  return <ScheduleContext.Provider value={value} {...props} />;
}

export { ScheduleProvider };
