import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";

import {
  getCalendarEvents,
  type CalendarEventResponse,
} from "@/server/calendar";

type RangeState = {
  rangeStart: Date;
  rangeEnd: Date;
  rangeLabel: string;
  currentMonth: number;
};

type UseCalendarEventRangeResult = {
  events: CalendarEventResponse[];
  rangeState: RangeState;
  setRangeState: (next: RangeState) => void;
};

function useCalendarEventRange(
  participantFilter: string | null
): UseCalendarEventRangeResult {
  const [rangeState, setRangeState] = useState<RangeState>(() => {
    const today = startOfDay(new Date());
    return {
      rangeStart: today,
      rangeEnd: today,
      rangeLabel: "",
      currentMonth: today.getMonth() + 1,
    };
  });

  const startDateIso = useMemo(
    () => startOfDay(rangeState.rangeStart).toISOString(),
    [rangeState.rangeStart]
  );
  const endDateIso = useMemo(
    () => endOfDay(rangeState.rangeEnd).toISOString(),
    [rangeState.rangeEnd]
  );

  const eventQuery = useQuery({
    queryKey: [
      "calendar-events",
      startDateIso,
      endDateIso,
      participantFilter ?? "all",
    ],
    queryFn: () =>
      getCalendarEvents({
        data: {
          startDate: startDateIso,
          endDate: endDateIso,
          ...(participantFilter ? { participantId: participantFilter } : {}),
        },
      }),
  });

  return {
    events: eventQuery.data ?? [],
    rangeState,
    setRangeState,
  };
}

export { useCalendarEventRange };
