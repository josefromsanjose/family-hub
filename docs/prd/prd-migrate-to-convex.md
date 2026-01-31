# PRD: Migrate Data Layer to Convex

## Introduction

Migrate the Family Hub data layer from Prisma + Postgres to Convex while preserving the existing schema and user-facing behavior. The goal is to remove Prisma/Postgres dependencies, re-implement data access with Convex, and update all affected areas of the app so feature parity is maintained. Data migration is out of scope because existing data does not matter, but we must preserve the current schema shape and seed logic for roles and permissions.

## Goals

- Replace Prisma + Postgres with Convex across all features.
- Keep the same schema shape and domain concepts (household, members, tasks, meals, shopping, calendar, permissions).
- Update all affected app areas to use Convex queries/mutations without changing UI behavior.
- Preserve role/permission seeding logic in the Convex world.
- Remove Prisma dependencies and configuration from the project.

## User Stories

### US-001: Define Convex schema that matches current Prisma schema

**Description:** As a developer, I want a Convex schema that mirrors the existing Prisma models so I can keep the same data shape and minimize app changes.

passes: true

**Acceptance Criteria:**

- [x] Convex schema includes tables for: households, household members, tasks, completion records, meals, meal library items, shopping items, calendar events, role permissions, member permissions.
- [x] Field names and data types match the current Prisma schema intent (including nullability).
- [x] Indexes reflect current query patterns (householdId, assignedToId, date, etc.).
- [x] Typecheck/lint passes.

### US-002: Replace server data access with Convex queries/mutations

**Description:** As a developer, I want to replace Prisma CRUD operations with Convex queries/mutations so the app no longer depends on Prisma/Postgres.

Reference: https://docs.convex.dev/quickstart/tanstack-start

passes: true

**Acceptance Criteria:**

- [x] Run `npx convex dev` at the start of the story to set up a dev deployment and sync functions.
- [x] Add Convex client/router wiring per the quickstart (ConvexProvider + ConvexQueryClient integration).
- [x] All Prisma access in `src/server/*` is replaced with Convex queries/mutations.
- [x] Input validation and authorization patterns remain consistent.
- [x] Returned data matches existing response shapes used by the UI.
- [x] Typecheck/lint passes.

### US-003: Preserve household scoping and Clerk auth checks

**Description:** As a developer, I want household-scoped access to remain consistent so users only access their household data.

passes: false

**Acceptance Criteria:**

- [ ] All Convex queries/mutations enforce household scoping.
- [ ] Clerk auth is integrated with Convex and user identity is available in Convex functions.
- [ ] Auth token verification and identity mapping are documented.
- [ ] Unauthorized access returns clear errors.
- [ ] Typecheck/lint passes.

### US-004: Account for role/permission seeding

**Description:** As a developer, I want the roles/permissions seed logic to exist in Convex so the app can rely on consistent defaults.

passes: false

**Acceptance Criteria:**

- [ ] Convex includes a migration/seed path to populate role permissions and default member permissions.
- [ ] Seed logic is idempotent.
- [ ] Seed is invoked in a documented, repeatable way.
- [ ] Typecheck/lint passes.

### US-005: Remove Prisma/Postgres infrastructure and scripts

**Description:** As a developer, I want the old database tooling removed to simplify the project and avoid confusion.

passes: false

**Acceptance Criteria:**

- [ ] Prisma dependencies and config are removed from `package.json`.
- [ ] Prisma scripts (`db:*`) are removed or replaced with Convex equivalents.
- [ ] Prisma schema/config files are removed from the repo.
- [ ] Typecheck/lint passes.

## Functional Requirements

- FR-1: The Convex schema must represent all existing Prisma models and relations.
- FR-2: All server-side CRUD operations must be re-implemented as Convex queries/mutations.
- FR-3: Household scoping must be enforced in every data access path.
- FR-4: Role/permission seed logic must be available and repeatable.
- FR-5: The UI must continue to receive the same response shapes as before.
- FR-6: Prisma/Postgres dependencies and config must be removed.
- FR-7: Environment variables must be updated for Convex (no Prisma URLs).

## Non-Goals (Out of Scope)

- No UI redesigns or feature changes beyond wiring to Convex.
- No data migration from Postgres to Convex.
- No real-time UX enhancements unless already supported by current flows.

## Design Considerations (Optional)

- Reuse existing UI and state management patterns; changes should be limited to data access wiring.
- Keep route components thin and delegate to server/data modules as currently structured.

## Technical Considerations

### Seed/Migration Strategy

- Create an idempotent Convex seed/migration to insert role permissions and default member permissions.
- Provide a documented command or script to run the seed during setup.

### Environment

- Add Convex environment variables (e.g., `CONVEX_URL`, `CONVEX_ADMIN_KEY`) and remove Prisma connection URLs.
- Update any docs referencing Prisma/Postgres.

## Success Metrics

- All data-dependent features work with Convex and Prisma is removed.
- App builds and runs without Prisma/Postgres configuration.
- Tests pass (or updated/added for new data paths).

## Open Questions

- Where should the seed/migration script live (Convex migration, npm script, or dev-only task)?
- Do we want to keep TanStack Start server functions as a wrapper around Convex, or call Convex directly in the client?
