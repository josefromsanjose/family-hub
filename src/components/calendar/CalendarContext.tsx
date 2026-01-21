import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { CalendarEventResponse } from "@/server/calendar";

export type CalendarValues = {
  month: number;
};

type CalendarDayValues = {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEventResponse[];
};

const CalendarValuesContext = createContext<CalendarValues | null>(null);
const CalendarDayValuesContext = createContext<CalendarDayValues | null>(null);

function CalendarProvider({
  values,
  children,
}: {
  values: CalendarValues;
  children: ReactNode;
}) {
  const memoizedValues = useMemo(() => values, [values]);
  return (
    <CalendarValuesContext.Provider value={memoizedValues}>
      {children}
    </CalendarValuesContext.Provider>
  );
}


function CalendarDayProvider({
  date,
  isToday,
  isCurrentMonth,
  events,
  children,
}: {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEventResponse[];
  children: ReactNode;
}) {
  const memoizedValues = useMemo(
    () => ({ date, isToday, isCurrentMonth, events }),
    [date, events, isCurrentMonth, isToday]
  );

  return (
    <CalendarDayValuesContext.Provider value={memoizedValues}>
      {children}
    </CalendarDayValuesContext.Provider>
  );
}

function useCalendar() {
  const context = useContext(CalendarValuesContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}

function useCalendarDayValues() {
  const context = useContext(CalendarDayValuesContext);
  if (!context) {
    throw new Error("useCalendarDayValues must be used within CalendarDay");
  }
  return context;
}

export {
  CalendarDayProvider,
  CalendarProvider,
  useCalendar,
  useCalendarDayValues,
};
