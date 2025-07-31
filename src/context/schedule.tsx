import React, { useMemo, useEffect, useCallback, ReactNode, useRef } from 'react';
import { getSchedule, addSchedule } from '@/services/firebase';
import { DocumentReference, DocumentData } from 'firebase/firestore';
import dayjs from 'dayjs';
import { useScheduleStore } from '@/stores/scheduleStore';

export interface ScheduleItem {
  id?: string;
  dateTime: dayjs.Dayjs;
  url: string;
  room: string;
  [key: string]: any;
}

export interface ScheduleContextType {
  schedule: ScheduleItem[];
  addToSchedule: (
    dateTime: Date,
    url: string,
    room?: string
  ) => Promise<undefined | DocumentReference<DocumentData>>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ScheduleContext = React.createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function ScheduleProvider(props: ScheduleProviderProps): JSX.Element {
  const { schedule, loadSchedule, flushPendingScheduleUpdates } = useScheduleStore();
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
    async (
      dateTime: Date,
      url: string,
      room?: string
    ): Promise<undefined | DocumentReference<DocumentData>> => {
      try {
        const result = await addSchedule(dateTime, url, room);
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
    }),
    [schedule, memoizedAddToSchedule]
  );

  return <ScheduleContext.Provider value={value} {...props} />;
}

export { ScheduleProvider };
