import type { LucideIcon } from "lucide-react";
import type { HouseholdMember } from "@/contexts/HouseholdContext";

export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";
export type TaskPriority = "low" | "medium" | "high";
export type MonthlyPattern = "day_of_month" | "nth_weekday" | null;
export type RotationMode = "none" | "odd_even_week";

export interface TaskData {
  title: string;
  assignedTo: string | null;
  recurrence: TaskFrequency;
  priority: TaskPriority;
  dueDate: Date | null;
  recurrenceDays: number[];
  recurrenceDayOfMonth: number | null;
  recurrenceWeekday: number | null;
  recurrenceWeekOfMonth: number | null;
  monthlyPattern: MonthlyPattern;
  rotationMode: RotationMode;
  rotationAssignees: string[];
  rotationAnchorDate: Date | null;
}

export interface FrequencyOption {
  id: TaskFrequency;
  label: string;
  description: string;
}

export interface PriorityOption {
  id: TaskPriority;
  label: string;
  description: string;
  icon: LucideIcon;
}

export type MemberList = HouseholdMember[];
