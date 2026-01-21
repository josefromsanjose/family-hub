import type { ReactNode } from "react";

import { CalendarProvider, type CalendarValues } from "./CalendarContext";

type CalendarProps = {
  month: number;
  children: ReactNode;
};

function Calendar({ month, children }: CalendarProps) {
  const values: CalendarValues = { month };

  return (
    <CalendarProvider values={values}>
      {children}
    </CalendarProvider>
  );
}

export { Calendar };
