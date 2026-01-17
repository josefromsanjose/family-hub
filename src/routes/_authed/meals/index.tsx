import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { addWeeks, endOfDay, format, startOfDay } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { getDayKey, getWeekDates } from "@/utils/date";
import {
  createMeal,
  deleteMeal,
  getMealLibraryItems,
  getMeals,
  type MealLibraryItemResponse,
  type MealResponse,
} from "@/server/meals";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SelectionCard } from "@/components/touch/SelectionCard";
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
  onCreateNewMeal?: (weekStart: Date) => void;
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
      onCreateNewMeal={(weekStart) =>
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
  onCreateNewMeal,
  onEditMeal,
}: MealPlanningProps) {
  const queryClient = useQueryClient();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addStepIndex, setAddStepIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<MealLibraryItemResponse | null>(
    null
  );
  const [weekReferenceDate, setWeekReferenceDate] = useState(
    () => parseWeekStart(initialWeekStart)
  );
  const [selectedDay, setSelectedDay] = useState(weekReferenceDate);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeValue>(
    MEAL_TYPE_OPTIONS[0].value
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
  const addSteps = [
    { id: "meal", title: "Pick a meal", helper: "Start with something familiar." },
    {
      id: "day",
      title: "Pick the day",
      helper: "Choose which day this meal belongs to.",
    },
    {
      id: "mealType",
      title: "Pick a meal type",
      helper: "Is this breakfast, lunch, or dinner?",
    },
  ] as const;
  const currentAddStep = addSteps[addStepIndex];
  const addProgress = ((addStepIndex + 1) / addSteps.length) * 100;
  const isLastAddStep = addStepIndex === addSteps.length - 1;
  const searchValue = searchTerm.trim();
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

  const { data: recentMeals = [], isLoading: isRecentMealsLoading } = useQuery({
    queryKey: ["meal-library-items", "recent"],
    queryFn: () => getMealLibraryItems({ data: {} }),
    enabled: isAddSheetOpen,
  });

  const { data: searchMeals = [], isLoading: isSearchMealsLoading } = useQuery({
    queryKey: ["meal-library-items", "search", searchValue],
    queryFn: () => getMealLibraryItems({ data: { query: searchValue } }),
    enabled: isAddSheetOpen && searchValue.length > 0,
  });

  const createMealMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      setIsAddSheetOpen(false);
    },
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

  useEffect(() => {
    setSelectedDay(weekStart);
  }, [weekStart]);

  useEffect(() => {
    if (!isAddSheetOpen) return;
    setAddStepIndex(0);
    setSearchTerm("");
    setSelectedMeal(null);
    setSelectedDay(weekStart);
    setSelectedMealType(MEAL_TYPE_OPTIONS[0].value);
  }, [isAddSheetOpen, weekStart]);

  const handleAddExistingMeal = () => {
    if (!selectedMeal) return;
    createMealMutation.mutate({
      data: {
        date: startOfDay(selectedDay).toISOString(),
        mealType: selectedMealType,
        mealLibraryItemId: selectedMeal.id,
      },
    });
  };

  const mealResults = searchValue.length > 0 ? searchMeals : recentMeals;
  const isMealListLoading =
    searchValue.length > 0 ? isSearchMealsLoading : isRecentMealsLoading;

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
              variant="outline"
              onClick={() => onCreateNewMeal?.(weekStart)}
            >
              Create Meal
            </Button>
            <Button
              onClick={() => {
                setIsAddSheetOpen(true);
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
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-3xl sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:w-full"
        >
          <SheetHeader className="space-y-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (addStepIndex === 0) {
                    setIsAddSheetOpen(false);
                    return;
                  }
                  setAddStepIndex((prev) => Math.max(0, prev - 1));
                }}
                aria-label={addStepIndex === 0 ? "Close add meal" : "Go back"}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Step {addStepIndex + 1} of {addSteps.length}
              </span>
            </div>
            <Progress value={addProgress} className="h-1" />
            <div className="space-y-1 text-center">
              <SheetTitle className="text-xl">{currentAddStep.title}</SheetTitle>
              <SheetDescription>{currentAddStep.helper}</SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {currentAddStep.id === "meal" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="meal-search"
                    className="text-sm font-medium text-foreground"
                  >
                    Search meals
                  </label>
                  <input
                    id="meal-search"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by meal name..."
                    className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {searchValue.length > 0 ? "Search results" : "Recent meals"}
                    </h3>
                    {selectedMeal && (
                      <span className="text-xs text-muted-foreground">
                        Selected: {selectedMeal.name}
                      </span>
                    )}
                  </div>
                  {isMealListLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading meals...
                    </div>
                  )}
                  {!isMealListLoading && mealResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {searchValue.length > 0
                        ? "No meals match that search."
                        : "No meals in your library yet. Create one to get started."}
                    </p>
                  )}
                  <div className="space-y-3">
                    {mealResults.map((meal) => {
                      const isSelected = selectedMeal?.id === meal.id;
                      return (
                        <button
                          key={meal.id}
                          type="button"
                          onClick={() => {
                            setSelectedMeal(meal);
                            setAddStepIndex(1);
                          }}
                          className={`w-full min-h-[80px] rounded-xl border px-4 py-3 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                          aria-label={`Select ${meal.name}`}
                        >
                          <p className="text-base font-semibold text-foreground">
                            {meal.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meal.notes?.trim() || "No notes"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentAddStep.id === "day" && (
              <div className="space-y-6">
                {selectedMeal && (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Meal:</span>{" "}
                      {selectedMeal.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Notes:</span>{" "}
                      {selectedMeal.notes?.trim() || "No notes"}
                    </p>
                  </div>
                )}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Day</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {weekDates.map((day) => (
                      <SelectionCard
                        key={day.toISOString()}
                        label={format(day, "EEEE")}
                        description={format(day, "MMM d")}
                        selected={day.toDateString() === selectedDay.toDateString()}
                        onSelect={() => {
                          setSelectedDay(day);
                          setAddStepIndex(2);
                        }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {currentAddStep.id === "mealType" && (
              <div className="space-y-6">
                {selectedMeal && (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Meal:</span>{" "}
                      {selectedMeal.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Day:</span>{" "}
                      {format(selectedDay, "EEEE")}
                    </p>
                  </div>
                )}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Meal Type
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {MEAL_TYPE_OPTIONS.map((option) => (
                      <SelectionCard
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        selected={selectedMealType === option.value}
                        onSelect={() => setSelectedMealType(option.value)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          {isLastAddStep && (
            <div className="border-t border-border px-6 py-4 space-y-3">
              <Button
                className="w-full h-14 text-lg"
                disabled={createMealMutation.isPending || !selectedMeal}
                onClick={handleAddExistingMeal}
              >
                {createMealMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add to week"
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
