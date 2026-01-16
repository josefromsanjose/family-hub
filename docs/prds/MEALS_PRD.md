# PRD: Meal Planning Feature

## Introduction

The Meal Planning feature allows families to plan meals for the week in advance, eliminating daily "what's for dinner?" stress. Currently, the feature has a basic UI that uses local state only - meals are not persisted to the database. This PRD outlines the complete implementation to connect the UI to the database, add week navigation, enable meal editing, and integrate with shopping lists.

**Problem**: The current meal planning UI (`src/routes/_authed/meals.tsx`) stores meals in component state, so data is lost on page refresh. The database schema exists (`Meal` model in `prisma/schema.prisma`) but is not being used. Users cannot navigate between weeks, edit existing meals, or generate shopping lists from meal plans.

**Solution**: Implement a full-stack meal planning system with server-side API, database persistence, week navigation, edit functionality, and shopping list integration.

## Goals

- Persist meals to database using existing `Meal` model
- Enable week navigation (previous/next week with week range display)
- Allow editing existing meals via edit button on meal cards
- Integrate with shopping lists to auto-generate items from meal plans
- Display current week by default with proper date handling
- Maintain weekly grid view (Monday-Sunday, Breakfast/Lunch/Dinner)
- Ensure meals are scoped to household (multi-tenant support)

## User Stories

### US-001: Create server-side meal API functions

**Description:** As a developer, I need server functions to create, read, update, and delete meals so the UI can persist data to the database.

passes: false

**Acceptance Criteria:**

- [x] Create `src/server/meals.ts` following the pattern from `src/server/tasks.ts`
- [x] Implement `getMeals()` function that fetches meals for current user's household
- [x] Implement `createMeal()` function with input validation
- [x] Implement `updateMeal()` function with authorization checks
- [x] Implement `deleteMeal()` function with authorization checks
- [x] All functions use `getCurrentUserHouseholdId()` helper (create if needed)
- [x] Functions return properly typed responses matching database schema
- [x] Typecheck passes

### US-002: Reuse existing household ID helper

**Description:** As a developer, I need to reuse the existing household ID helper to avoid duplicate logic.

passes: true

**Acceptance Criteria:**

- [x] Reuse `getCurrentUserHouseholdId()` from `src/server/household.ts` (do not re-create it)
- [x] Function uses `auth()` from Clerk to get current user
- [x] Function queries `householdMember` table by `clerkUserId`
- [x] Function throws error if user not authenticated or no household found
- [x] Typecheck passes

### US-003: Replace local state with server API calls

**Description:** As a user, I want my meal plans to persist across page refreshes so I don't lose my planning work.

passes: true

**Acceptance Criteria:**

- [x] Remove `useState` for meals in `src/routes/_authed/meals.tsx`
- [x] Use TanStack Query to fetch meals via `getMeals()` server function
- [x] Use mutations for create/update/delete operations
- [x] Invalidate queries after mutations to refresh data
- [x] Show loading state while fetching
- [x] Show error state if fetch fails
- [x] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Convert day names to actual dates

**Description:** As a user, I want meals to be associated with specific dates so I can navigate between weeks and see historical meal plans.

**Acceptance Criteria:**

- [ ] Replace day name strings ("Monday", "Tuesday", etc.) with actual Date objects
- [ ] Calculate week start (Monday) based on current date or selected week
- [ ] Store meals with proper `date` field (DateTime) in database
- [ ] Display day names in UI but use dates for data operations
- [ ] Handle timezone correctly (store dates at midnight UTC or local time)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Add week navigation controls

**Description:** As a user, I want to navigate between weeks to plan meals for different weeks and view past meal plans.

**Acceptance Criteria:**

- [ ] Add "Previous Week" and "Next Week" buttons to meal planning page
- [ ] Display current week range (e.g., "January 15-21, 2024") between navigation buttons
- [ ] Default to current week on page load
- [ ] Update week state when navigating
- [ ] Fetch meals for the selected week from database
- [ ] Filter meals to show only those in the selected week
- [ ] Disable "Previous Week" if at earliest reasonable date (optional, can be unlimited)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Add edit functionality to meal cards

**Description:** As a user, I want to edit existing meals when plans change or I make mistakes.

**Acceptance Criteria:**

- [ ] Add edit button (pencil icon) to each meal card
- [ ] Clicking edit button opens edit form (can reuse add form with pre-filled data)
- [ ] Edit form pre-populates: day, mealType, name, notes
- [ ] Edit form shows all fields at once (no step-by-step flow)
- [ ] Update button saves changes via `updateMeal()` server function
- [ ] Cancel button closes form without saving
- [ ] Form validation matches add form (name required)
- [ ] Successfully updated meals reflect changes immediately
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Update add meal form to use dates

**Description:** As a developer, I need the add meal form to work with actual dates instead of day names.

**Acceptance Criteria:**

- [ ] Update form to accept Date object for selected day
- [ ] Convert selected day to proper date within current week
- [ ] Store meal with correct date in database
- [ ] Form still displays day names in dropdown for user convenience
- [ ] Date calculation handles week boundaries correctly
- [ ] Add flow is touch-friendly and not overwhelming (progressive disclosure allowed)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Meal data managed locally in feature

**Description:** As a developer, I want meal data managed within the Meal Planning feature without adding a global provider.

**Acceptance Criteria:**

- [ ] Manage meal queries and mutations inside `src/routes/_authed/meals.tsx`
- [ ] Use TanStack Query for data fetching and mutations
- [ ] Keep state local to the Meal Planning page (no new global provider)
- [ ] If reuse is needed later, extract to a feature-scoped hook (not app-wide context)
- [ ] Typecheck passes

### US-009: Reuse previously created meals with autocomplete

**Description:** As a user, I want to reuse meals I've already created by selecting them from an autocomplete list instead of retyping.

**Acceptance Criteria:**

- [ ] Add an autocomplete input for meal name in the add/edit form
- [ ] Autocomplete suggestions show previously created meal names for the household
- [ ] Selecting a suggestion fills the meal name (and notes if available)
- [ ] Users can still type a new meal name not in the list
- [ ] Suggestions are filtered as the user types
- [ ] No duplicate meal names are created when selecting an existing meal
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Integrate meal planning with shopping lists

**Description:** As a user, I want to generate shopping list items from my meal plan to streamline grocery shopping.

**Acceptance Criteria:**

- [ ] Add "Generate Shopping List" button to meal planning page
- [ ] Button opens dialog/modal with list of meals for selected week
- [ ] User can select which meals to include in shopping list
- [ ] System extracts ingredients/notes from selected meals
- [ ] Creates shopping list items via existing shopping list API (check `src/server/` for shopping functions)
- [ ] Items are categorized appropriately (may need manual categorization or default category)
- [ ] Shows success message after generation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Update dashboard to show actual meal count

**Description:** As a user, I want the dashboard to show accurate meal planning statistics.

**Acceptance Criteria:**

- [ ] Update "Meals This Week" card in `src/routes/_authed/index.tsx` to fetch actual meal count
- [ ] Query meals for current week from database
- [ ] Display count of meals planned for current week
- [ ] Show "0 planned" if no meals exist
- [ ] Card links to meal planning page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: All meal operations must be scoped to the current user's household (multi-tenant support)
- FR-2: Meals must be stored with specific dates (DateTime), not just day names
- FR-3: Week navigation must default to current week on page load
- FR-4: Week range display must show format: "Month Day-Day, Year" (e.g., "January 15-21, 2024")
- FR-5: Meal form must validate that meal name is required and non-empty
- FR-6: Edit form must pre-populate with existing meal data
- FR-7: All CRUD operations must persist to database via server functions
- FR-8: Shopping list generation must allow user to select which meals to include
- FR-9: Generated shopping items must be associated with the household
- FR-10: Week calculation must use Monday as week start (ISO 8601 standard)
- FR-11: Meal data fetching and mutations must use React Query
- FR-12: Meal creation UI must be touch-friendly and avoid showing all fields at once when possible
- FR-13: Meal edit UI must show all fields at once for quick updates

## Non-Goals

- No recipe management (future feature)
- No meal suggestions or AI-powered meal planning (future feature)
- No meal sharing between households (future feature)
- No meal photos or images (future feature)
- No meal ratings or favorites (future feature)
- No automatic meal rotation or scheduling (future feature)
- No integration with external recipe APIs (future feature)
- No meal cost tracking or budgeting (future feature)

## Design Considerations

- Reuse existing UI components from `src/components/ui/` (Button, Card, Dialog, etc.)
- Follow design patterns from Tasks and Calendar features for consistency
- Meal cards should be visually distinct but match overall app theme
- Week navigation controls should be prominent and easy to use
- Edit form can reuse the add meal form component to reduce duplication
- Shopping list generation dialog should be clear and non-intrusive
- Consider mobile responsiveness for weekly grid layout
- Meal creation UX should follow the simplified, step-focused pattern used in `src/routes/_authed/settings/members.new.tsx` when it improves clarity
- Editing should present all fields together (similar to editing a member) to minimize steps

## Technical Considerations

- Follow existing server function patterns from `src/server/tasks.ts`:
- Use `createServerFn` from `@tanstack/react-start`
- Use `auth()` from Clerk for authentication
- Validate inputs before database operations
- Check household ownership before mutations
- Follow existing context patterns from `src/contexts/TasksContext.tsx`:
- Use TanStack Query for data fetching
- Use mutations with query invalidation
- Provide typed interfaces matching database schema
- Date handling:
- Store dates as DateTime in database (Prisma handles this)
- Use JavaScript Date objects in frontend
- Consider timezone implications (store in UTC, display in user's timezone)
- Week calculation: Monday = start of week
- Database schema already exists in `prisma/schema.prisma`:
- `Meal` model has: id, householdId, name, date, mealType, notes
- No migration needed unless schema changes
- Shopping list integration:
- Check if `ShoppingItem` model exists and has API functions
- If not, may need to create shopping list server functions first
- Items should be created with appropriate category (may default to "Other" or "Meal Planning")

## Success Metrics

- Users can create meals that persist across page refreshes
- Week navigation works smoothly without data loss
- Meal editing completes successfully in under 2 seconds
- Shopping list generation creates items correctly
- Zero data loss when navigating between weeks
- All meals are properly scoped to household (no cross-household data leaks)

## Open Questions

- Should we support multiple meals of the same type on the same day? (Current UI allows this via array)
- Should shopping list generation parse meal notes for ingredients, or just add meal names as items?
- Should we add a "Copy from previous week" feature to speed up meal planning?
- Should meal dates be stored in UTC or user's local timezone?
- Should we add meal deletion confirmation dialog to prevent accidental deletions?
