import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addDays, startOfWeek } from "date-fns";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  createMeal,
  deleteMeal,
  getMeals,
  type MealResponse,
} from "@/server/meals";

export const Route = createFileRoute("/_authed/meals/")({
  loader: async () => {
    return { meals: await getMeals() };
  },
  component: MealPlanningRoute,
});

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const mealTypeOptions = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
] as const;
const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
type MealTypeValue = (typeof mealTypeOptions)[number]["value"];
type MealFormData = {
  day: string;
  mealType: MealTypeValue;
  name: string;
  notes: string;
};

const mealsQueryKey = ["meals"];

const getDayNameFromDate = (dateValue: string) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.valueOf())) {
    return "";
  }
  return weekdayNames[parsedDate.getDay()];
};

const getDateForDayName = (day: string) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dayIndex = daysOfWeek.indexOf(day);
  if (dayIndex < 0) {
    return weekStart.toISOString();
  }
  return addDays(weekStart, dayIndex).toISOString();
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<MealFormData>({
    day: daysOfWeek[0],
    mealType: mealTypeOptions[0].value,
    name: "",
    notes: "",
  });

  const {
    data: meals = [],
    error,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: mealsQueryKey,
    queryFn: () => getMeals(),
    initialData: initialMeals,
  });

  const createMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealsQueryKey });
      setFormData({
        day: daysOfWeek[0],
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
      queryClient.invalidateQueries({ queryKey: mealsQueryKey });
    },
  });

  const addMeal = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate({
      data: {
        name: formData.name,
        date: getDateForDayName(formData.day),
        mealType: formData.mealType,
        notes: formData.notes,
      },
    });
  };

  const handleDeleteMeal = (id: string) => {
    deleteMutation.mutate({ data: { id } });
  };

  const getMealsForDay = (day: string, mealType: MealTypeValue) => {
    return meals.filter(
      (meal: MealResponse) =>
        getDayNameFromDate(meal.date) === day && meal.mealType === mealType
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
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add Meal
          </button>
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
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
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
                {daysOfWeek.map((day) => (
                  <tr key={day} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                      {day}
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
