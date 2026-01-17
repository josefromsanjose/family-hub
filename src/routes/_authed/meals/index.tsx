import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { addWeeks, endOfDay, format, startOfDay } from "date-fns";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { z } from "zod";
import { getDayKey, getWeekDates } from "@/utils/date";
import {
  deleteMeal,
  getMeals,
  type MealResponse,
} from "@/server/meals";
import { Button } from "@/components/ui/button";
import {
  MEAL_TYPE_OPTIONS,
  type MealTypeValue,
  parseWeekStart,
} from "@/routes/_authed/meals/-meal-form";

export const Route = createFileRoute("/_authed/meals/")({
  validateSearch: z.object({
    weekStart: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({
    weekStart: search.weekStart,
  }),
  loader: async ({ deps }) => {
    const weekStartDate = parseWeekStart(deps.weekStart);
    const weekDates = getWeekDates(weekStartDate);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[weekDates.length - 1];
    return {
      meals: await getMeals({
        data: {
          startDate: startOfDay(weekStart).toISOString(),
          endDate: endOfDay(weekEnd).toISOString(),
        },
      }),
    };
  },
  component: MealPlanningRoute,
});

const getMealsQueryKey = (weekStartKey: string) => ["meals", weekStartKey];

const formatWeekRange = (startDate: Date, endDate: Date) => {
  const sameMonth =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();
  if (sameMonth) {
    return `${format(startDate, "MMMM d")}-${format(endDate, "d, yyyy")}`;
  }
  return `${format(startDate, "MMMM d")}-${format(endDate, "MMMM d, yyyy")}`;
};

type MealPlanningProps = {
  initialMeals?: MealResponse[];
  initialWeekStart?: Date;
  onAddMeal?: (weekStart: Date) => void;
  onEditMeal?: (meal: MealResponse, weekStart: Date) => void;
};

function MealPlanningRoute() {
  const { meals: initialMeals } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const initialWeekStart = parseWeekStart(search.weekStart);

  return (
    <MealPlanning
      initialMeals={initialMeals}
      initialWeekStart={initialWeekStart}
      onAddMeal={(weekStart) =>
        navigate({
          to: "/meals/new",
          search: { weekStart: weekStart.toISOString() },
        })
      }
      onEditMeal={(meal, weekStart) =>
        navigate({
          to: "/meals/$mealId/edit",
          params: { mealId: meal.id },
          search: { weekStart: weekStart.toISOString() },
        })
      }
    />
  );
}

export function MealPlanning({
  initialMeals,
  initialWeekStart,
  onAddMeal,
  onEditMeal,
}: MealPlanningProps) {
  const queryClient = useQueryClient();
  const [weekReferenceDate, setWeekReferenceDate] = useState(
    () => parseWeekStart(initialWeekStart)
  );
  const weekDates = useMemo(
    () => getWeekDates(weekReferenceDate),
    [weekReferenceDate]
  );
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];
  const weekRangeLabel = useMemo(
    () => formatWeekRange(weekStart, weekEnd),
    [weekStart, weekEnd]
  );
  const {
    data: meals = [],
    error,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: getMealsQueryKey(getDayKey(weekStart)),
    queryFn: () =>
      getMeals({
        data: {
          startDate: startOfDay(weekStart).toISOString(),
          endDate: endOfDay(weekEnd).toISOString(),
        },
      }),
    initialData: initialMeals,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });

  const handleDeleteMeal = (id: string) => {
    deleteMutation.mutate({ data: { id } });
  };

  const getMealsForDay = (day: Date, mealType: MealTypeValue) => {
    const dayKey = getDayKey(day);
    return meals.filter(
      (meal: MealResponse) =>
        getDayKey(new Date(meal.date)) === dayKey && meal.mealType === mealType
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading meals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <p className="text-destructive">
              Error loading meals. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Meal Planning
            </h1>
            <p className="text-muted-foreground">
              Plan your family's meals for the week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                onAddMeal?.(weekStart);
              }}
            >
              <Plus size={20} />
              Add Meal
            </Button>
          </div>
        </div>
        {isFetching && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Refreshing meals...
          </div>
        )}

        <div className="flex items-center gap-4 w-full justify-end mb-4">
          <Button
            onClick={() =>
              setWeekReferenceDate((current) => addWeeks(current, -1))
            }
            size="sm"
            variant="outline"
          >
            Previous Week
          </Button>
          <span className="text-sm font-medium text-foreground">
            {weekRangeLabel}
          </span>
          <Button
            onClick={() =>
              setWeekReferenceDate((current) => addWeeks(current, 1))
            }
            size="sm"
            variant="outline"
          >
            Next Week
          </Button>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Day
                  </th>
                  {MEAL_TYPE_OPTIONS.map((type) => (
                    <th
                      key={type.value}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {type.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {weekDates.map((day) => (
                  <tr key={day.toISOString()} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                      {format(day, "EEEE")}
                    </td>
                    {MEAL_TYPE_OPTIONS.map((mealType) => (
                      <td key={mealType.value} className="px-6 py-4">
                        <div className="space-y-2">
                          {getMealsForDay(day, mealType.value).map((meal) => (
                            <div
                              key={meal.id}
                              className="flex items-start justify-between gap-2 p-2 bg-primary/10 rounded border border-primary/30"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {meal.name}
                                </p>
                                {meal.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {meal.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onEditMeal?.(meal, weekStart)}
                                  className="p-1 hover:bg-primary/20 rounded text-primary transition-colors"
                                  aria-label="Edit meal"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(meal.id)}
                                  disabled={deleteMutation.isPending}
                                  className="p-1 hover:bg-destructive/20 rounded text-destructive transition-colors"
                                  aria-label="Delete meal"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
