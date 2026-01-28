import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns";
import { UtensilsCrossed } from "lucide-react";
import { getMeals } from "@/server/meals";
import { getDayKey, getWeekDates } from "@/utils/date";
import { DashboardCard } from "./dashboard-card";

export function DashboardMealStats() {
  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const {
    data: meals = [],
    isLoading: isMealsLoading,
    isError: isMealsError,
  } = useQuery({
    queryKey: ["meals", "week-count", getDayKey(weekStart)],
    queryFn: () =>
      getMeals({
        data: {
          startDate: weekStart.toISOString(),
          endDate: endOfDay(weekEnd).toISOString(),
        },
      }),
  });

  if (isMealsLoading) {
    return <MealsLoadingCard />;
  }

  const mealCount = meals.length;
  const mealsThisWeekLabel = `${mealCount} planned`;
  const mealsThisWeekValue = isMealsError ? "0 planned" : mealsThisWeekLabel;

  return (
    <DashboardCard
      title="Meals This Week"
      value={mealsThisWeekValue}
      icon={UtensilsCrossed}
      href="/meals"
    />
  );
}

function MealsLoadingCard() {
  return (
    <div className="flex items-center bg-card rounded-lg shadow-sm p-6 transition-shadow border border-border">
      <div className="animate-pulse flex items-center space-x-2">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
