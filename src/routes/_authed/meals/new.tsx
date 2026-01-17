import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { z } from "zod";
import { getWeekDates } from "@/utils/date";
import { createMeal } from "@/server/meals";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SelectionCard } from "@/components/touch/SelectionCard";
import {
  MEAL_TYPE_OPTIONS,
  type MealFormData,
  type MealTypeValue,
  getWeekDateForDay,
  isMealNameValid,
  parseWeekStart,
} from "@/routes/_authed/meals/-meal-form";

const searchSchema = z.object({
  weekStart: z.string().optional(),
});

const ADD_STEPS = [
  {
    id: "day",
    title: "Pick a day",
    helper: "Choose which day this meal belongs to.",
  },
  {
    id: "mealType",
    title: "Pick a meal type",
    helper: "Is this breakfast, lunch, or dinner?",
  },
  {
    id: "name",
    title: "Name the meal",
    helper: "Add a short name everyone will recognize.",
  },
  {
    id: "notes",
    title: "Add notes (optional)",
    helper: "Include ingredients or special instructions.",
  },
  {
    id: "confirm",
    title: "Confirm the details",
    helper: "Review everything before adding the meal.",
  },
] as const;

export const Route = createFileRoute("/_authed/meals/new")({
  validateSearch: searchSchema,
  component: MealCreateRoute,
});

type MealCreateProps = {
  initialWeekStart?: Date;
  onCancel?: () => void;
  onComplete?: () => void;
};

function MealCreateRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const initialWeekStart = parseWeekStart(search.weekStart);

  return (
    <MealCreateWizard
      initialWeekStart={initialWeekStart}
      onCancel={() =>
        navigate({
          to: "/meals",
          search: { weekStart: initialWeekStart.toISOString() },
        })
      }
      onComplete={() =>
        navigate({
          to: "/meals",
          search: { weekStart: initialWeekStart.toISOString() },
        })
      }
    />
  );
}

export function MealCreateWizard({
  initialWeekStart,
  onCancel,
  onComplete,
}: MealCreateProps) {
  const queryClient = useQueryClient();
  const weekStart = useMemo(
    () => parseWeekStart(initialWeekStart),
    [initialWeekStart]
  );
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<MealFormData>(() => ({
    day: weekDates[0],
    mealType: MEAL_TYPE_OPTIONS[0].value,
    name: "",
    notes: "",
  }));

  useEffect(() => {
    const normalizedDay = getWeekDateForDay(weekDates, data.day);
    if (normalizedDay.toDateString() === data.day.toDateString()) return;
    setData((prev) => ({ ...prev, day: normalizedDay }));
  }, [weekDates, data.day]);

  const step = ADD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ADD_STEPS.length - 1;
  const progress = ((currentStep + 1) / ADD_STEPS.length) * 100;
  const nameIsValid = isMealNameValid(data.name);

  const mutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      onComplete?.();
    },
  });

  const setPartialData = (next: Partial<MealFormData>) => {
    setData((prev) => ({ ...prev, ...next }));
  };

  const canProceed = useMemo(() => {
    if (step.id === "name" || step.id === "confirm") {
      return nameIsValid;
    }
    return true;
  }, [step.id, nameIsValid]);

  const canSkip = step.id === "notes";

  const handleBack = () => {
    if (isFirstStep) {
      onCancel?.();
      return;
    }
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isLastStep) {
      mutation.mutate({
        data: {
          name: data.name.trim(),
          date: startOfDay(data.day).toISOString(),
          mealType: data.mealType,
          notes: data.notes.trim() || undefined,
        },
      });
      return;
    }
    setCurrentStep((prev) => Math.min(ADD_STEPS.length - 1, prev + 1));
  };

  const handleSkip = () => {
    if (!canSkip) return;
    setCurrentStep((prev) => Math.min(ADD_STEPS.length - 1, prev + 1));
  };

  return (
    <div className="bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
            aria-label={isFirstStep ? "Back to meals" : "Go back"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {ADD_STEPS.length}
            </span>
          </div>
          <div className="w-10" />
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-2">{step.title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {step.helper}
        </p>

        <div className="flex-1">
          {step.id === "day" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {weekDates.map((day) => (
                <SelectionCard
                  key={day.toISOString()}
                  label={format(day, "EEEE")}
                  description={format(day, "MMM d")}
                  selected={day.toDateString() === data.day.toDateString()}
                  onSelect={() => setPartialData({ day })}
                />
              ))}
            </div>
          )}

          {step.id === "mealType" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MEAL_TYPE_OPTIONS.map((option) => (
                <SelectionCard
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  selected={data.mealType === option.value}
                  onSelect={() =>
                    setPartialData({ mealType: option.value as MealTypeValue })
                  }
                />
              ))}
            </div>
          )}

          {step.id === "name" && (
            <div className="space-y-3">
              <label
                htmlFor="meal-name"
                className="text-sm font-medium text-foreground"
              >
                Meal Name
              </label>
              <input
                id="meal-name"
                type="text"
                autoFocus
                value={data.name}
                onChange={(event) => setPartialData({ name: event.target.value })}
                placeholder="e.g., Spaghetti and Meatballs"
                className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {!nameIsValid && (
                <p className="text-sm text-destructive">
                  Meal name is required.
                </p>
              )}
            </div>
          )}

          {step.id === "notes" && (
            <div className="space-y-3">
              <label
                htmlFor="meal-notes"
                className="text-sm font-medium text-foreground"
              >
                Notes (optional)
              </label>
              <textarea
                id="meal-notes"
                value={data.notes}
                onChange={(event) => setPartialData({ notes: event.target.value })}
                placeholder="Any special instructions or ingredients..."
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          )}

          {step.id === "confirm" && (
            <div className="space-y-4">
              <div className="bg-secondary/40 border border-border rounded-xl p-5 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Day:</span>{" "}
                  {format(data.day, "EEEE")}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Meal Type:</span>{" "}
                  {
                    MEAL_TYPE_OPTIONS.find(
                      (option) => option.value === data.mealType
                    )?.label
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Meal Name:</span>{" "}
                  {data.name || "Not set"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Notes:</span>{" "}
                  {data.notes.trim() ? data.notes.trim() : "None"}
                </p>
              </div>
              {!nameIsValid && (
                <p className="text-sm text-destructive">
                  Meal name is required.
                </p>
              )}
              {mutation.error instanceof Error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    {mutation.error.message || "Failed to add meal"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed || mutation.isPending}
            className="w-full h-14 text-lg"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : isLastStep ? (
              "Add Meal"
            ) : (
              "Next"
            )}
          </Button>
          {canSkip && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Skip this step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
