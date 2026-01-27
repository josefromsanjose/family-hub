import { format, parseISO } from "date-fns";
import type { HouseholdMember } from "@/contexts/HouseholdContext";
import { AvatarCard } from "@/components/touch/AvatarCard";
import { QuickDatePicker } from "@/components/touch/QuickDatePicker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarEventFormData = {
  title: string;
  description: string;
  date: Date;
  time: string;
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly";
  endDate: Date | null;
  participantId: string | null;
};

type CalendarEventFormProps = {
  isOpen: boolean;
  members: HouseholdMember[];
  formData: CalendarEventFormData;
  onChange: (next: CalendarEventFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  mode?: "create" | "edit";
};

function CalendarEventForm({
  isOpen,
  members,
  formData,
  onChange,
  onSubmit,
  onCancel,
  mode = "create",
}: CalendarEventFormProps) {
  if (!isOpen) return null;

  const updateForm = (updates: Partial<CalendarEventFormData>) => {
    onChange({ ...formData, ...updates });
  };

  const headerLabel = mode === "edit" ? "Edit Event" : "Add New Event";
  const submitLabel = mode === "edit" ? "Save Changes" : "Add Event";

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-card-foreground">
        {headerLabel}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-foreground">
            Event Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            placeholder="e.g., Doctor appointment, School play, Birthday party"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-foreground">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(event) => updateForm({ description: event.target.value })}
            placeholder="Additional details..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Date
          </label>
          <QuickDatePicker
            value={formData.date}
            onChange={(date) => date && updateForm({ date })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Time (optional)
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(event) => updateForm({ time: event.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Recurrence
          </label>
          <Select
            value={formData.recurrence}
            onValueChange={(value) =>
              updateForm({
                recurrence: value as CalendarEventFormData["recurrence"],
                endDate: value === "none" ? null : formData.endDate,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Does not repeat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Does not repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.recurrence !== "none" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              End date (optional)
            </label>
            <input
              type="date"
              value={
                formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : ""
              }
              onChange={(event) =>
                updateForm({
                  endDate: event.target.value
                    ? parseISO(event.target.value)
                    : null,
                })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
            />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Who is this for?
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AvatarCard
              name="Family"
              color="bg-muted"
              selected={formData.participantId === null}
              onSelect={() => updateForm({ participantId: null })}
            />
            {members.map((member) => (
              <AvatarCard
                key={member.id}
                name={member.name}
                color={member.color || "bg-muted"}
                selected={formData.participantId === member.id}
                onSelect={() => updateForm({ participantId: member.id })}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={onSubmit}>{submitLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export { CalendarEventForm };
