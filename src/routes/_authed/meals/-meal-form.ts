import { startOfWeek } from "date-fns";

export const MEAL_TYPE_OPTIONS = [
  { label: "Breakfast", value: "breakfast", description: "Start the day" },
  { label: "Lunch", value: "lunch", description: "Midday meal" },
  { label: "Dinner", value: "dinner", description: "Evening meal" },
] as const;

export type MealTypeValue = (typeof MEAL_TYPE_OPTIONS)[number]["value"];

export type MealFormData = {
  day: Date;
  mealType: MealTypeValue;
  name: string;
  notes: string;
};

export const isMealNameValid = (name: string) => name.trim().length > 0;

export const getWeekDateForDay = (weekDates: Date[], selectedDay: Date) => {
  if (weekDates.length === 0) return selectedDay;
  const matchingDay = weekDates.find(
    (day) => day.getDay() === selectedDay.getDay()
  );
  return matchingDay ?? weekDates[0];
};

export const parseWeekStart = (value?: string | Date) => {
  const baseDate = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(baseDate.valueOf()) ? new Date() : baseDate;
  return startOfWeek(safeDate, { weekStartsOn: 1 });
};
