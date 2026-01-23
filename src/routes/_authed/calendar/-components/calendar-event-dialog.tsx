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
} from "@/components/calendar/CalendarEventForm";
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

function CalendarEventDialog({
  participantId,
  onActionsReady,
}: CalendarEventDialogProps) {
  const queryClient = useQueryClient();
  const { members } = useHousehold();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarEventFormData>({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    type: "event",
    participantId: null,
  });

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

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      type: "event",
      participantId: participantId,
    });
  }, [participantId]);

  const openCreate = useCallback(() => {
    setEditingEventId(null);
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      type: "event",
      participantId: participantId,
    });
    setIsOpen(true);
  }, [participantId]);

  const openForDate = useCallback(
    (date: Date) => {
      setEditingEventId(null);
      setFormData({
        title: "",
        description: "",
        date,
        time: "",
        type: "event",
        participantId: participantId,
      });
      setIsOpen(true);
    },
    [participantId]
  );

  const openForEvent = useCallback((event: CalendarEventResponse) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description ?? "",
      date: new Date(event.date),
      time: event.time ?? "",
      type: event.type,
      participantId: event.participantId ?? null,
    });
    setIsOpen(true);
  }, []);

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
        type: formData.type,
        participantId: formData.participantId,
      };
      updateMutation.mutate({ data: input });
    } else {
      const input: CreateCalendarEventInput = {
        title: formData.title,
        description: formData.description || undefined,
        date: formData.date.toISOString(),
        time: formData.time || undefined,
        type: formData.type,
        participantId: formData.participantId,
      };
      createMutation.mutate({ data: input });
    }

    setEditingEventId(null);
    setIsOpen(false);
    resetForm();
  }, [createMutation, editingEventId, formData, resetForm, updateMutation]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setEditingEventId(null);
    resetForm();
  }, [resetForm]);

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
