import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks } from "@/contexts/TasksContext";
import {
  type FrequencyOption,
  type PriorityOption,
  type TaskData,
} from "./-components/TaskWizard.types";
import { AssigneeStep } from "./-components/AssigneeStep";
import { DueDateStep } from "./-components/DueDateStep";
import { FrequencyStep } from "./-components/FrequencyStep";
import { PriorityStep } from "./-components/PriorityStep";
import { RotationStep } from "./-components/RotationStep";
import { ScheduleStep } from "./-components/ScheduleStep";
import { TitleStep } from "./-components/TitleStep";
import {
  createEmptyTaskData,
  taskToWizardData,
  wizardDataToTaskUpdateInput,
} from "./-components/taskWizardData";

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

export const Route = createFileRoute("/_authed/tasks/$taskId/edit")({
  component: TaskEditPage,
});

function TaskEditPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { members } = useHousehold();

  const task = useMemo(
    () => tasks.find((candidate) => candidate.id === taskId),
    [tasks, taskId]
  );

  const [data, setData] = useState<TaskData>(() => createEmptyTaskData());

  useEffect(() => {
    if (!task) return;
    setData(taskToWizardData(task));
  }, [task]);

  const handleChange = useCallback((next: Partial<TaskData>) => {
    setData((prev) => ({ ...prev, ...next }));
  }, []);

  const canSave = data.title.trim().length > 0;

  if (!task && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Loading task details...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Task not found
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              The task you are looking for is no longer available.
            </p>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link to="/tasks">Back to tasks</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!task || !canSave) return;
    updateTask(task.id, wizardDataToTaskUpdateInput(data));
    navigate({ to: "/tasks" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/tasks" aria-label="Back to tasks">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit task</h1>
            <p className="text-sm text-muted-foreground">
              Update the task details and schedule.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Title</h2>
          <TitleStep data={data} onChange={handleChange} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Assignee</h2>
          <AssigneeStep data={data} onChange={handleChange} members={members} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Frequency</h2>
          <FrequencyStep
            data={data}
            onChange={handleChange}
            frequencies={FREQUENCIES}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Schedule</h2>
          <ScheduleStep data={data} onChange={handleChange} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Rotation</h2>
          <RotationStep data={data} onChange={handleChange} members={members} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Priority</h2>
          <PriorityStep
            data={data}
            onChange={handleChange}
            priorities={PRIORITIES}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Due date</h2>
          <DueDateStep data={data} onChange={handleChange} />
        </section>

        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-12"
          >
            <Save className="w-4 h-4" />
            Save changes
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/tasks">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
