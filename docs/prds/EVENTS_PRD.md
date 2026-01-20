# PRD: Events System

## Introduction

The Events system gives families a single place to track appointments, activities, and reminders without relying on external calendars or sticky notes. Today, the calendar UI exists but needs a full product definition aligned to the database schema and a reusable, composable calendar UI that can be used anywhere in the app (dashboard, tasks, member profiles, and dedicated calendar pages).

**Problem**: Families struggle to keep schedules organized across multiple members and commitments. Existing calendar screens are not fully supported by a defined backend contract, and there is no clear spec for reusable calendar UI components or view switching (daily/weekly/monthly).

**Solution**: Implement a full-stack Events system with household-scoped CRUD, participant assignment, recurrence, in-app reminders, and composable calendar UI building blocks that support daily, weekly, and monthly views.

## Goals

- Persist events to the database using the existing `CalendarEvent` model
- Ensure all events are scoped to the current household (multi-tenant support)
- Provide composable calendar UI components usable across the app
- Support daily, weekly, and monthly views with consistent data models
- Allow assigning events to specific household members (participant)
- Support simple recurrence (daily/weekly/monthly) with optional end date
- Provide in-app reminders (UI-level only; no push/SMS/email)

## User Stories

### US-001: Create server-side event API functions

**Description:** As a developer, I need server functions to create, read, update, and delete events so the UI can persist data to the database.

passes: true

**Acceptance Criteria:**

- [x] Create `src/server/calendar.ts` functions following patterns in `src/server/tasks.ts`
- [x] Implement `getEvents()` for a date range and current household
- [x] Implement `createEvent()` with input validation
- [x] Implement `updateEvent()` with authorization checks
- [x] Implement `deleteEvent()` with authorization checks
- [x] Reuse `getCurrentUserHouseholdId()` helper for household scoping
- [x] Functions return typed responses matching the `CalendarEvent` schema
- [x] Typecheck passes

### US-002: Fetch and render household events in the calendar UI

**Description:** As a user, I want to see my household events in the calendar so the schedule is always up to date.

passes: true

**Acceptance Criteria:**

- [x] Use TanStack Query to fetch events for a selected date range
- [x] Show loading and error states in calendar views
- [x] Filter events by date range and optional participant
- [x] Display event type, title, time, and participant at a glance
- [x] Typecheck passes

### US-003: Composable calendar UI components

**Description:** As a developer, I need a composable calendar UI so any feature can embed a calendar view consistently.

passes: true

**Acceptance Criteria:**

- [x] Create composable calendar components that can be assembled per view
- [x] Components are view-agnostic and reusable across routes
- [x] Include primitives such as:
  - `CalendarShell` (layout + view controls)
  - `CalendarHeader` (month/week/day label + navigation)
  - `CalendarGrid` (day cells for week/month)
  - `CalendarDayColumn` (day layout for week/day)
  - `CalendarEventCard` (event display)
  - `AgendaList` (list-based view)
- [x] Components use existing UI primitives from `src/components/ui/`
- [x] No inline styles; use class-based styling
- [x] Typecheck passes

### US-004: Daily, weekly, and monthly views

**Description:** As a user, I want to switch between daily, weekly, and monthly views to see the schedule at different levels of detail.

passes: false

**Acceptance Criteria:**

- [ ] Provide view switcher between Daily / Weekly / Monthly
- [ ] Daily view shows a single day timeline or list
- [ ] Weekly view shows Monday–Sunday with events grouped by day
- [ ] Monthly view shows a grid of days with event indicators
- [ ] Views share a consistent data model and reuse composable components
- [ ] Typecheck passes

### US-005: Event recurrence

**Description:** As a user, I want to create repeating events so I do not have to re-enter the same schedule every time.

passes: false

**Acceptance Criteria:**

- [ ] Support recurrence types: daily, weekly, monthly
- [ ] Allow optional recurrence end date
- [ ] Recurring events appear in all relevant views
- [ ] Editing a recurring event updates future occurrences only (define behavior)
- [ ] Typecheck passes

### US-006: Participant assignment

**Description:** As a user, I want to attach events to specific household members so I can filter by person.

passes: false

**Acceptance Criteria:**

- [ ] Events can be assigned to a `HouseholdMember` (participant)
- [ ] Calendar views support filtering by participant
- [ ] Event cards show participant name or avatar color
- [ ] Typecheck passes

### US-007: In-app reminders (UI-level)

**Description:** As a user, I want reminders for upcoming events so I do not forget important commitments.

passes: false

**Acceptance Criteria:**

- [ ] UI supports a reminder setting (e.g., "10 min before")
- [ ] Reminder is stored in event metadata or UI state (no external delivery)
- [ ] Reminder display is visible in event details
- [ ] No push/SMS/email implementation required
- [ ] Typecheck passes

### US-008: Dashboard event summary

**Description:** As a user, I want to see upcoming events on the dashboard for quick awareness.

passes: false

**Acceptance Criteria:**

- [ ] Dashboard shows upcoming events for the next 7 days
- [ ] Summary links to the full calendar view
- [ ] Respects household scoping and participant filters
- [ ] Typecheck passes

## Functional Requirements

- FR-1: All event operations are scoped to the current household
- FR-2: Events are stored using `CalendarEvent` fields: `title`, `description`, `date`, `time`, `type`, `recurrence`, `endDate`, `participantId`
- FR-3: Calendar views support daily, weekly, and monthly perspectives
- FR-4: View switching keeps date context consistent (e.g., same week/day)
- FR-5: Recurring events expand into view ranges correctly
- FR-6: Participant filtering is available across all views
- FR-7: In-app reminders are configurable but do not require external delivery
- FR-8: Permissions align with `calendar_create`, `calendar_update`, `calendar_delete`

## Non-Goals

- No external calendar sync (Google/Apple/Outlook)
- No push, SMS, or email notifications
- No complex recurrence rules (e.g., custom schedules beyond daily/weekly/monthly)
- No shared events between households

## Design Considerations

- Calendar UI must be composable and reusable across multiple pages
- Touch-friendly targets and readable event cards for mobile
- Use existing UI primitives from `src/components/ui/` and match app styling
- Keep event creation simple with clear labels and minimal required fields
- Prioritize visual clarity for busy parents and kids

## Technical Considerations

- Follow server function patterns from `src/server/tasks.ts`
- Use `auth()` from Clerk and `getCurrentUserHouseholdId()` for scoping
- Use TanStack Query for fetching and mutations within calendar routes
- Avoid client bundling of server-only modules (use server helpers)
- Recurrence expansion happens server-side or in view-specific helpers
- Reuse existing date utilities in `src/utils/date.ts` where possible
- Schema already supports `CalendarEvent` with participant linkage

## Success Metrics

- Families can create and view events that persist across sessions
- Daily/weekly/monthly views load quickly and accurately
- Users can filter by member without losing context
- Recurring events appear reliably across views

## Open Questions

- How should edits to recurring events affect past occurrences?
- Should reminders be stored in the database or only in UI state?
- What is the preferred time zone handling for event time display?
- Should monthly view show event titles or only indicators for density?
