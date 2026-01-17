import { addDays, format, startOfDay, startOfWeek } from "date-fns";

export const getWeekDates = (referenceDate: Date) => {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) =>
    startOfDay(addDays(weekStart, index))
  );
};

export const getDayKey = (dateValue: Date) => format(dateValue, "yyyy-MM-dd");
