import { createFileRoute } from "@tanstack/react-router";
import { TaskWizard } from "./-components/TaskWizard";

export const Route = createFileRoute("/_authed/tasks/new")({
  component: NewTaskPage,
});

function NewTaskPage() {
  return (
    <div className="min-h-screen">
      <TaskWizard />
    </div>
  );
}
