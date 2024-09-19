import { createContext, useState, useMemo, useEffect } from 'react';
import { getSchedule, addSchedule } from 'services/firebase';

const ScheduleContext = createContext();

function ScheduleProvider(props) {
  const [schedule, setSchedule] = useState({});

  useEffect(() => {
    getSchedule((newSchedule) => setSchedule(newSchedule));
  }, []);

  const value = useMemo(() => ({ schedule, addToSchedule: addSchedule }), [schedule]);

  return <ScheduleContext.Provider value={value} {...props} />;
}

export { ScheduleContext, ScheduleProvider };
