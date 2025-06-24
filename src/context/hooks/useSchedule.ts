import React from 'react';
import { ScheduleContext, ScheduleContextType } from '../schedule';

export default function useSchedule(): ScheduleContextType {
  const value = React.useContext(ScheduleContext);

  if (!value) {
    throw new Error("ScheduleContext's value is undefined.");
  }

  return value;
}
