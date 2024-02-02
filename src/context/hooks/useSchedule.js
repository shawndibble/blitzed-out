import React from 'react';
import { ScheduleContext } from '../schedule';

export default function useSchedule() {
  const value = React.useContext(ScheduleContext);

  if (!value) {
    // eslint-disable-next-line quotes
    throw new Error("ScheduleContext's value is undefined.");
  }

  return value;
}
