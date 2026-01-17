import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { z } from "zod";
import { getWeekDates } from "@/utils/date";
import { getMeals, updateMeal, type MealResponse } from "@/server/meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectionCard } from "@/components/touch/SelectionCard";
import {
  MEAL_TYPE_OPTIONS,
  type MealFormData,
  type MealTypeValue,
  isMealNameValid,
  parseWeekStart,
} from "@/routes/_authed/meals/-meal-form";

const searchSchema = z.object({
  weekStart: z.string().optional(),
});

export const Route = createFileRoute("/_authed/meals/$mealId/edit")({
  validateSearch: searchSchema,
  loader: async () => {
    return {
      meals: await getMeals({ data: {} }),
    };
  },
  component: MealEditRoute,
});

type MealEditProps = {
  mealId: string;
  initialMeals: MealResponse[];
  fallbackWeekStart?: Date;
  onCancel?: () => void;
  onComplete?: () => void;
};

function MealEditRoute() {
  const { mealId } = Route.useParams();
  const search = Route.useSearch();
  const { meals: initialMeals } = Route.useLoaderData();
  const navigate = useNavigate();
  const fallbackWeekStart = parseWeekStart(search.weekStart);

  return (
    <MealEditPage
      mealId={mealId}
      initialMeals={initialMeals}
      fallbackWeekStart={fallbackWeekStart}
      onCancel={() =>
        navigate({
          to: "/meals",
          search: { weekStart: fallbackWeekStart.toISOString() },
        })
      }
      onComplete={() =>
        navigate({
          to: "/meals",
          search: { weekStart: fallbackWeekStart.toISOString() },
        })
      }
    />
  );
}

export function MealEditPage({
  mealId,
  initialMeals,
  fallbackWeekStart,
  onCancel,
  onComplete,
}: MealEditProps) {
  const queryClient = useQueryClient();
  const { data: meals = initialMeals, error } = useQuery({
    queryKey: ["meals"],
    queryFn: () => getMeals({ data: {} }),
    initialData: initialMeals,
  });

  const meal = useMemo(
    () => meals.find((candidate) => candidate.id === mealId),
    [meals, mealId]
  );

  const [data, setData] = useState<MealFormData>({
    day: fallbackWeekStart ?? new Date(),
    mealType: MEAL_TYPE_OPTIONS[0].value,
    name: "",
    notes: "",
  });

  useEffect(() => {
    if (!meal) return;
    setData({
      day: startOfDay(new Date(meal.date)),
      mealType: meal.mealType,
      name: meal.name,
      notes: meal.notes ?? "",
    });
  }, [meal]);

  const weekStart = useMemo(() => {
    if (meal) {
      return parseWeekStart(new Date(meal.date));
    }
    return parseWeekStart(fallbackWeekStart);
  }, [meal, fallbackWeekStart]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const canSave = isMealNameValid(data.name);

  const updateMutation = useMutation({
    mutationFn: updateMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      onComplete?.();
    },
  });

  const handleSave = () => {
    if (!meal || !canSave) return;
    updateMutation.mutate({
      data: {
        id: meal.id,
        name: data.name.trim(),
        date: startOfDay(data.day).toISOString(),
        mealType: data.mealType,
        notes: data.notes.trim() || undefined,
      },
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Error loading meals. Please try again.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Meal not found
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              The meal you are looking for is no longer available.
            </p>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link to="/meals">Back to meals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCancel?.()}
            aria-label="Back to meals"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit meal</h1>
            <p className="text-sm text-muted-foreground">
              Update the details for this meal.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Day</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {weekDates.map((day) => (
              <SelectionCard
                key={day.toISOString()}
                label={format(day, "EEEE")}
                description={format(day, "MMM d")}
                selected={day.toDateString() === data.day.toDateString()}
                onSelect={() => setData((prev) => ({ ...prev, day }))}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Meal Type</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MEAL_TYPE_OPTIONS.map((option) => (
              <SelectionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={data.mealType === option.value}
                onSelect={() =>
                  setData((prev) => ({
                    ...prev,
                    mealType: option.value as MealTypeValue,
                  }))
                }
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Meal Name</h2>
          <div className="space-y-2">
            <label
              htmlFor="meal-name"
              className="text-sm font-medium text-foreground"
            >
              Meal Name
            </label>
            <input
              id="meal-name"
              type="text"
              value={data.name}
              onChange={(event) =>
                setData((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g., Spaghetti and Meatballs"
              className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {!canSave && (
              <p className="text-sm text-destructive">
                Meal name is required.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <label
            htmlFor="meal-notes"
            className="text-sm font-medium text-foreground"
          >
            Notes (optional)
          </label>
          <textarea
            id="meal-notes"
            value={data.notes}
            onChange={(event) =>
              setData((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Any special instructions or ingredients..."
            rows={5}
            className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </section>

        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={!canSave || updateMutation.isPending}
            className="w-full h-12"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onCancel?.()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
