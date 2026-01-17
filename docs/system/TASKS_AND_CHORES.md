# Tasks and Chores System

This document describes the task system, recurrence scheduling, and rotation behavior. It is intended for future expansion and integration work.

## Overview

The system supports:

- One-time tasks (optionally with due dates)
- Recurring chores (daily, weekly, monthly)
- Schedule-aware recurrence for weekly and monthly chores
- Weekly rotation (odd/even weeks) between two assignees
- Per-date assignment overrides (data model in place)

Core behavior:

- A recurring chore is represented by a single task record.
- Completions are stored separately in `completion_records`.
- "Due" is derived from recurrence schedule + completion history.

## Data Model

Primary tables (Prisma models):

- `Task` (tasks + recurring chores)
- `CompletionRecord` (recurring completion history)
- `TaskAssignmentOverride` (per-date assignment override)

### Task

Key fields:

- `assignedToId`: default assignee (member ID)
- `recurrence`: `daily | weekly | monthly | null`
- `recurrenceDays`: array of weekday numbers (0-6, Sun-Sat) for weekly schedules
- `recurrenceDayOfMonth`: day of month for monthly schedules (1-31)
- `recurrenceWeekday`: weekday number for monthly "nth weekday"
- `recurrenceWeekOfMonth`: week number for monthly "nth weekday" (1-5)
- `rotationMode`: `none | odd_even_week`
- `rotationAssignees`: array of member IDs (first = odd weeks, second = even weeks)
- `rotationAnchorDate`: anchor date for odd/even calculation

### CompletionRecord

For recurring chores, each completion creates a row with:

- `taskId`
- `completedAt`
- `completedById`

### TaskAssignmentOverride

Per-date override for assignee:

- `taskId`
- `date`
- `assignedToId`

Overrides are intended to swap the assignee for a specific day without changing the long-term rotation.

## Scheduling Rules

Scheduling is applied only to recurring chores. One-time tasks ignore schedule fields.

### Daily

- Always scheduled for every day.

### Weekly

- If `recurrenceDays` is set, the chore is only scheduled on those weekdays.
- If `recurrenceDays` is empty, the chore is scheduled any day of the week.

### Monthly

Two patterns are supported:

- **Day of month**: `recurrenceDayOfMonth` (e.g., 1st of every month)
- **Nth weekday**: `recurrenceWeekOfMonth` + `recurrenceWeekday` (e.g., 2nd Sunday)

If neither pattern is specified, the chore is scheduled any day of the month.

## Rotation Rules

Rotation is applied only to weekly chores.

Mode: `odd_even_week`

- `rotationAssignees[0]` is assigned on odd ISO weeks
- `rotationAssignees[1]` is assigned on even ISO weeks
- `rotationAnchorDate` sets the week parity reference

If rotation is enabled and there are fewer than two assignees, the rotation falls back to the default assignee.

## Due Logic

The `isTaskDue()` logic combines schedule and completion history:

- If a chore is not scheduled for today, it is not due today.
- If scheduled for today, it is due if there is no completion for the current scheduled period.

Period granularity:

- Daily chores: due if not completed today
- Weekly chores with multiple scheduled days: due if not completed today
- Monthly scheduled chores: due if not completed today
- Weekly chores without explicit scheduled days: due if not completed this week

## Assignment Resolution

The UI uses `getTaskAssigneeForDate()`:

1. If a `TaskAssignmentOverride` exists for the date, use it.
2. If rotation is `odd_even_week` and two assignees exist, pick based on week parity.
3. Otherwise, use `assignedToId`.

This ensures the member landing page only shows chores for the intended assignee on that day.

## Task Creation Wizard

Wizard steps:

1. Title
2. Assignee (optional)
3. Frequency
4. Schedule (weekly days or monthly pattern)
5. Rotation (weekly only)
6. Priority
7. Due Date (one-time only)
8. Confirm

Notes:

- Selecting weekly defaults schedule to today if none set.
- Selecting monthly defaults to "day of month" using today.
- Rotation uses two assignees and odd/even weeks.

## Key Files

Schema:

- `prisma/schema.prisma`

Server API:

- `src/server/tasks.ts`

Context + due logic:

- `src/contexts/TasksContext.tsx`

Wizard UI:

- `src/routes/_authed/tasks/-components/TaskWizard.tsx`
- `src/routes/_authed/tasks/-components/TaskWizard.types.ts`
- `src/routes/_authed/tasks/-components/ScheduleStep.tsx`
- `src/routes/_authed/tasks/-components/RotationStep.tsx`

Member views:

- `src/routes/_authed/members/$memberId.index.tsx`
- `src/routes/_authed/members/$memberId.chores.tsx`

## Use Cases

### Weekly on specific days

Example: Trash on Monday and Thursday

- Recurrence: weekly
- Recurrence days: [1, 4]
- Rotation: none

### Weekly with rotation

Example: Dog bath every other Sunday

- Recurrence: weekly
- Recurrence days: [0]
- Rotation mode: odd_even_week
- Rotation assignees: [EmmaId, NoahId]
- Rotation anchor date: set on creation

### Monthly day of month

Example: Pay rent on the 1st

- Recurrence: monthly
- Day of month: 1

### Monthly nth weekday

Example: Family meeting 2nd Sunday

- Recurrence: monthly
- Week of month: 2
- Weekday: 0 (Sunday)

### One-time task

Example: Bring trash to curb on holiday week

- Recurrence: none
- Due date: set

## Expansion Ideas

Potential future additions:

- Per-day completion tracking for weekly chores with multiple days
- UI for assignment overrides (swap week)
- Calendar-style schedule view for a member
- Notification system for due chores
