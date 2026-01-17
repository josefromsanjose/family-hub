import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MealResponse } from "@/server/meals";
import { createShoppingItemsFromMeals } from "@/server/shopping";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEAL_TYPE_OPTIONS, type MealTypeValue } from "./-meal-form";

type ShoppingListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: MealResponse[];
  weekRangeLabel: string;
  onNavigateToShopping?: () => void;
};

const mealTypeOrder: Record<MealTypeValue, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
};

export function ShoppingListDialog({
  open,
  onOpenChange,
  meals,
  weekRangeLabel,
  onNavigateToShopping,
}: ShoppingListDialogProps) {
  const queryClient = useQueryClient();
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mealTypeLabels = useMemo(
    () =>
      MEAL_TYPE_OPTIONS.reduce<Record<MealTypeValue, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {} as Record<MealTypeValue, string>),
    []
  );
  const weeklyMeals = useMemo(
    () =>
      [...meals].sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
      }),
    [meals]
  );

  const createShoppingItemsMutation = useMutation({
    mutationFn: createShoppingItemsFromMeals,
    onSuccess: async (result) => {
      const message = `Added ${result.count} item${result.count === 1 ? "" : "s"} to your shopping list.`;
      toast.success(message);
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      onOpenChange(false);
      onNavigateToShopping?.();
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create shopping items."
      );
    },
  });

  useEffect(() => {
    if (!open) return;
    setSelectedMealIds(weeklyMeals.map((meal) => meal.id));
    setErrorMessage(null);
  }, [open, weeklyMeals]);

  const toggleMeal = (mealId: string) => {
    setSelectedMealIds((current) =>
      current.includes(mealId)
        ? current.filter((id) => id !== mealId)
        : [...current, mealId]
    );
    setErrorMessage(null);
  };

  const handleGenerateList = () => {
    if (selectedMealIds.length === 0) {
      setErrorMessage("Select at least one meal to generate items.");
      return;
    }
    createShoppingItemsMutation.mutate({ data: { mealIds: selectedMealIds } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Shopping List</DialogTitle>
          <DialogDescription>
            Choose which meals from {weekRangeLabel} to include.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {errorMessage && (
            <Alert
              variant="destructive"
              aria-live="polite"
              aria-label={`Unable to generate list. ${errorMessage}`}
            >
              <AlertTitle>Unable to generate list</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {selectedMealIds.length} of {weeklyMeals.length} meals selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedMealIds(weeklyMeals.map((meal) => meal.id))
                }
                disabled={weeklyMeals.length === 0}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMealIds([])}
                disabled={weeklyMeals.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
          {weeklyMeals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No meals planned for this week yet.
            </div>
          ) : (
            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">
              {weeklyMeals.map((meal) => {
                const checkboxId = `shopping-meal-${meal.id}`;
                const isChecked = selectedMealIds.includes(meal.id);
                return (
                  <div
                    key={meal.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isChecked}
                      onCheckedChange={() => toggleMeal(meal.id)}
                      aria-label={`Select ${meal.name}`}
                    />
                    <label
                      htmlFor={checkboxId}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {meal.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(meal.date), "EEE, MMM d")} ·{" "}
                        {mealTypeLabels[meal.mealType]}
                      </div>
                      {meal.notes && (
                        <div className="text-xs text-muted-foreground">
                          {meal.notes}
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Items will be added with the default category "Other."
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerateList}
            disabled={
              weeklyMeals.length === 0 ||
              selectedMealIds.length === 0 ||
              createShoppingItemsMutation.isPending
            }
          >
            {createShoppingItemsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate list"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
