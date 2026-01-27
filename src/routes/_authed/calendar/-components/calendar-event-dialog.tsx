import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { CalendarEventResponse } from "@/server/calendar";
import {
  createCalendarEvent,
  updateCalendarEvent,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
} from "@/server/calendar";
import {
  CalendarEventForm,
  type CalendarEventFormData,
} from "./calendar-event-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useHousehold } from "@/contexts/HouseholdContext";

export type CalendarEventDialogActions = {
  openCreate: () => void;
  openForDate: (date: Date) => void;
  openForEvent: (event: CalendarEventResponse) => void;
};

type CalendarEventDialogProps = {
  participantId: string | null;
  onActionsReady: (actions: CalendarEventDialogActions) => void;
};

const defaultFormData: CalendarEventFormData = {
  title: "",
  description: "",
  date: new Date(),
  time: "",
  recurrence: "none",
  endDate: null,
  participantId: null,
};

const buildDefaultFormData = (
  participantId: string | null,
  overrides?: Partial<CalendarEventFormData>
): CalendarEventFormData => ({
  ...defaultFormData,
  participantId,
  ...overrides,
});

const useCalendarEventMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  return { createMutation, updateMutation };
};

const useCalendarEventDialogState = (participantId: string | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarEventFormData>(
    buildDefaultFormData(participantId)
  );

  const resetForm = useCallback(() => {
    setFormData(buildDefaultFormData(participantId));
  }, [participantId]);

  const openCreate = useCallback(() => {
    setEditingEventId(null);
    setFormData(buildDefaultFormData(participantId));
    setIsOpen(true);
  }, [participantId]);

  const openForDate = useCallback(
    (date: Date) => {
      setEditingEventId(null);
      setFormData(buildDefaultFormData(participantId, { date }));
      setIsOpen(true);
    },
    [participantId]
  );

  const openForEvent = useCallback((event: CalendarEventResponse) => {
    setEditingEventId(event.id);
    setFormData(
      buildDefaultFormData(event.participantId ?? null, {
        title: event.title,
        description: event.description ?? "",
        date: new Date(event.date),
        time: event.time ?? "",
        recurrence: event.recurrence ?? "none",
        endDate: event.endDate ? new Date(event.endDate) : null,
      })
    );
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setEditingEventId(null);
    resetForm();
  }, [resetForm]);

  return {
    isOpen,
    setIsOpen,
    editingEventId,
    setEditingEventId,
    formData,
    setFormData,
    openCreate,
    openForDate,
    openForEvent,
    resetForm,
    handleCancel,
  };
};

function CalendarEventDialog({
  participantId,
  onActionsReady,
}: CalendarEventDialogProps) {
  const { members } = useHousehold();
  const { createMutation, updateMutation } = useCalendarEventMutations();
  const {
    isOpen,
    setIsOpen,
    editingEventId,
    setEditingEventId,
    formData,
    setFormData,
    openCreate,
    openForDate,
    openForEvent,
    resetForm,
    handleCancel,
  } = useCalendarEventDialogState(participantId);

  const actions = useMemo(
    () => ({
      openCreate,
      openForDate,
      openForEvent,
    }),
    [openCreate, openForDate, openForEvent]
  );

  useEffect(() => {
    onActionsReady(actions);
  }, [actions, onActionsReady]);

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) return;

    if (editingEventId) {
      const input: UpdateCalendarEventInput = {
        id: editingEventId,
        title: formData.title,
        description: formData.description ? formData.description : null,
        date: formData.date.toISOString(),
        time: formData.time ? formData.time : null,
        recurrence: formData.recurrence === "none" ? null : formData.recurrence,
        endDate:
          formData.recurrence === "none" || !formData.endDate
            ? null
            : formData.endDate.toISOString(),
        participantId: formData.participantId,
      };
      updateMutation.mutate({ data: input });
    } else {
      const input: CreateCalendarEventInput = {
        title: formData.title,
        description: formData.description || undefined,
        date: formData.date.toISOString(),
        time: formData.time || undefined,
        recurrence:
          formData.recurrence === "none" ? undefined : formData.recurrence,
        endDate:
          formData.recurrence === "none" || !formData.endDate
            ? null
            : formData.endDate.toISOString(),
        participantId: formData.participantId,
      };
      createMutation.mutate({ data: input });
    }

    setEditingEventId(null);
    setIsOpen(false);
    resetForm();
  }, [createMutation, editingEventId, formData, resetForm, updateMutation]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto lg:max-w-4xl">
        <CalendarEventForm
          isOpen={isOpen}
          members={members}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          mode={editingEventId ? "edit" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}

export { CalendarEventDialog };
