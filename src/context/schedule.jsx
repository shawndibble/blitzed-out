import React, { createContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { getSchedule, addSchedule } from '@/services/firebase';

export interface ScheduleItem {
  id?: string;
  dateTime: Date;
  url: string;
  room: string;
  [key: string]: any;
}

export interface ScheduleContextType {
  schedule: ScheduleItem[];
  addToSchedule: (dateTime: Date, url: string, room?: string) => Promise<void>;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function ScheduleProvider(props: ScheduleProviderProps): JSX.Element {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    getSchedule((newSchedule: ScheduleItem[]) => setSchedule(newSchedule));
  }, []);

  const value = useMemo(() => ({ schedule, addToSchedule: addSchedule }), [schedule]);

  return <ScheduleContext.Provider value={value} {...props} />;
}

export { ScheduleProvider };
