import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { getDayKey } from "@/utils/date";
import type { CalendarEventResponse } from "@/server/calendar";

const defaultWeekStart = 0;

export const getMonthGridDates = (referenceDate: Date) => {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: defaultWeekStart });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: defaultWeekStart });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
};

export const groupEventsByDate = (events: CalendarEventResponse[]) => {
  const grouped: Record<string, CalendarEventResponse[]> = {};

  events.forEach((event) => {
    const dateKey = getDayKey(new Date(event.date));
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  });

  Object.values(grouped).forEach((items) => {
    items.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  });

  return grouped;
};

export const categorizeEvents = (events: CalendarEventResponse[]) => {
  const allDay = events.filter((event) => !event.time);
  const timed = events
    .filter((event) => event.time)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return { allDay, timed };
};

export const formatEventTime = (time?: string | null) => {
  if (!time) return null;
  const [hourPart = "0", minutePart = "0"] = time.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const formatted = format(new Date(2024, 0, 1, hours, minutes), "h:mma");
  return formatted.replace(":00", "").toLowerCase();
};

export const getHourSlots = () =>
  Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label:
      hour === 0
        ? "12 AM"
        : hour < 12
          ? `${hour} AM`
          : hour === 12
            ? "12 PM"
            : `${hour - 12} PM`,
  }));
