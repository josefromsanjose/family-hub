import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Minus } from "lucide-react";
import { useWizard } from "./-hooks/useWizard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks } from "@/contexts/TasksContext";
import {
  type FrequencyOption,
  type PriorityOption,
  type TaskData,
} from "./TaskWizard.types";
import { AssigneeStep } from "./AssigneeStep";
import { ConfirmStep } from "./ConfirmStep";
import { DueDateStep } from "./DueDateStep";
import { FrequencyStep } from "./FrequencyStep";
import { PriorityStep } from "./PriorityStep";
import { RotationStep } from "./RotationStep";
import { ScheduleStep } from "./ScheduleStep";
import { TitleStep } from "./TitleStep";

const STEPS = [
  { id: "title", title: "What needs to be done?" },
  { id: "assignee", title: "Who should do this?", optional: true },
  { id: "frequency", title: "How often?", optional: true },
  { id: "schedule", title: "When should it happen?", optional: true },
  { id: "rotation", title: "Rotate who does this?", optional: true },
  { id: "priority", title: "How important is it?", optional: true },
  { id: "dueDate", title: "When is it due?", optional: true },
  { id: "confirm", title: "Ready to create?" },
];

const FREQUENCIES: FrequencyOption[] = [
  { id: "once", label: "Just Once", description: "One-time task" },
  { id: "daily", label: "Every Day", description: "Resets daily" },
  { id: "weekly", label: "Every Week", description: "Resets weekly" },
  { id: "monthly", label: "Every Month", description: "Resets monthly" },
];

const PRIORITIES: PriorityOption[] = [
  { id: "low", label: "Low", description: "Nice to do", icon: ArrowDown },
  { id: "medium", label: "Medium", description: "Should do", icon: Minus },
  { id: "high", label: "High", description: "Must do", icon: ArrowUp },
];

export function TaskWizard() {
  const navigate = useNavigate();
  const { members } = useHousehold();
  const { addTask } = useTasks();

  const {
    step,
    currentStep,
    totalSteps,
    progress,
    data,
    isFirstStep,
    isLastStep,
    isOptional,
    next,
    back,
    skip,
    updateData,
    reset,
  } = useWizard<TaskData>({
    steps: STEPS,
    initialData: {
      title: "",
      assignedTo: null,
      recurrence: "once",
      priority: "medium",
      dueDate: null,
      recurrenceDays: [],
      recurrenceDayOfMonth: null,
      recurrenceWeekday: null,
      recurrenceWeekOfMonth: null,
      monthlyPattern: null,
      rotationMode: "none",
      rotationAssignees: [],
      rotationAnchorDate: null,
    },
    onComplete: (taskData) => {
      addTask({
        title: taskData.title.trim(),
        assignedTo: taskData.assignedTo || undefined,
        recurrence:
          taskData.recurrence === "once" ? undefined : taskData.recurrence,
        priority: taskData.priority,
        dueDate:
          taskData.recurrence === "once" && taskData.dueDate
            ? taskData.dueDate.toISOString()
            : undefined,
        recurrenceDays: taskData.recurrenceDays,
        recurrenceDayOfMonth:
          taskData.recurrence === "monthly"
            ? (taskData.recurrenceDayOfMonth ?? undefined)
            : undefined,
        recurrenceWeekday:
          taskData.recurrence === "monthly"
            ? (taskData.recurrenceWeekday ?? undefined)
            : undefined,
        recurrenceWeekOfMonth:
          taskData.recurrence === "monthly"
            ? (taskData.recurrenceWeekOfMonth ?? undefined)
            : undefined,
        rotationMode:
          taskData.recurrence === "weekly" ? taskData.rotationMode : "none",
        rotationAssignees:
          taskData.recurrence === "weekly" ? taskData.rotationAssignees : [],
        rotationAnchorDate: taskData.rotationAnchorDate
          ? taskData.rotationAnchorDate.toISOString()
          : undefined,
        assignmentOverrides: [],
      });
      reset();
      navigate({ to: "/tasks" });
    },
  });

  const canProceed = step.id === "title" ? data.title.trim().length > 0 : true;

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      navigate({ to: "/tasks" });
      return;
    }
    back();
  }, [back, isFirstStep, navigate]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    next();
  }, [canProceed, next]);

  const handleSkip = useCallback(() => {
    skip();
  }, [skip]);

  const recurrenceLabel = useMemo(
    () =>
      FREQUENCIES.find((f) => f.id === data.recurrence)?.label ?? "Just Once",
    [data.recurrence]
  );

  const priorityConfig = useMemo(
    () => PRIORITIES.find((p) => p.id === data.priority) ?? PRIORITIES[1],
    [data.priority]
  );
  const PriorityIcon = priorityConfig.icon;
  const priorityLabel = priorityConfig.label;

  return (
    <div className="bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <div className="w-10" />
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-8">{step.title}</h1>

        <div className="flex-1">
          {step.id === "title" && (
            <TitleStep data={data} onChange={updateData} />
          )}
          {step.id === "assignee" && (
            <AssigneeStep data={data} onChange={updateData} members={members} />
          )}
          {step.id === "frequency" && (
            <FrequencyStep
              data={data}
              onChange={updateData}
              frequencies={FREQUENCIES}
            />
          )}
          {step.id === "schedule" && (
            <ScheduleStep data={data} onChange={updateData} />
          )}
          {step.id === "rotation" && (
            <RotationStep data={data} onChange={updateData} members={members} />
          )}
          {step.id === "priority" && (
            <PriorityStep
              data={data}
              onChange={updateData}
              priorities={PRIORITIES}
            />
          )}
          {step.id === "dueDate" && (
            <DueDateStep data={data} onChange={updateData} />
          )}
          {step.id === "confirm" && (
            <ConfirmStep
              data={data}
              recurrenceLabel={recurrenceLabel}
              priorityLabel={priorityLabel}
              PriorityIcon={PriorityIcon}
              members={members}
            />
          )}
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full h-14 text-lg"
          >
            {isLastStep ? "Create Task" : "Next"}
          </Button>

          {isOptional && !isLastStep && (
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
