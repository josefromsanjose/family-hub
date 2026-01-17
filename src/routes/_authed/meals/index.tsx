import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { addWeeks, endOfDay, format, startOfDay, startOfWeek } from "date-fns";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getDayKey, getWeekDates } from "@/utils/date";
import {
  createMeal,
  deleteMeal,
  getMeals,
  type MealResponse,
} from "@/server/meals";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/meals/")({
  loader: async () => {
    const weekDates = getWeekDates(new Date());
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

const mealTypeOptions = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
] as const;
type MealTypeValue = (typeof mealTypeOptions)[number]["value"];
type MealFormData = {
  day: Date;
  mealType: MealTypeValue;
  name: string;
  notes: string;
};

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
};

function MealPlanningRoute() {
  const { meals: initialMeals } = Route.useLoaderData();
  return <MealPlanning initialMeals={initialMeals} />;
}

export function MealPlanning({ initialMeals }: MealPlanningProps) {
  const queryClient = useQueryClient();
  const [weekReferenceDate, setWeekReferenceDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<MealFormData>(() => ({
    day: weekDates[0],
    mealType: mealTypeOptions[0].value,
    name: "",
    notes: "",
  }));

  useEffect(() => {
    setFormData((current) => {
      const isInWeek = weekDates.some(
        (day) => getDayKey(day) === getDayKey(current.day)
      );
      if (isInWeek) {
        return current;
      }
      return { ...current, day: weekDates[0] };
    });
  }, [weekDates]);

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

  const createMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      setFormData({
        day: weekDates[0],
        mealType: mealTypeOptions[0].value,
        name: "",
        notes: "",
      });
      setShowAddForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });

  const addMeal = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate({
      data: {
        name: formData.name,
        date: startOfDay(formData.day).toISOString(),
        mealType: formData.mealType,
        notes: formData.notes,
      },
    });
  };

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
            <Button onClick={() => setShowAddForm(!showAddForm)}>
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

        {showAddForm && (
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">
              Add New Meal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="meal-day"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Day
                </label>
                <select
                  id="meal-day"
                  value={formData.day.toISOString()}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    setFormData({
                      ...formData,
                      day: Number.isNaN(selectedDate.valueOf())
                        ? weekDates[0]
                        : selectedDate,
                    });
                  }}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {weekDates.map((day) => (
                    <option key={day.toISOString()} value={day.toISOString()}>
                      {format(day, "EEEE")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="meal-type"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Meal Type
                </label>
                <select
                  id="meal-type"
                  value={formData.mealType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mealType: e.target.value as MealTypeValue,
                    })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {mealTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="meal-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Meal Name
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Spaghetti and Meatballs"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="meal-notes"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="meal-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special instructions or ingredients..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={addMeal}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {createMutation.isPending ? "Adding..." : "Add Meal"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
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
                  {mealTypeOptions.map((type) => (
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
                    {mealTypeOptions.map((mealType) => (
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
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                disabled={deleteMutation.isPending}
                                className="p-1 hover:bg-destructive/20 rounded text-destructive transition-colors"
                                aria-label="Delete meal"
                              >
                                <Trash2 size={14} />
                              </button>
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
