## Agent Patterns

- Prefer existing helper utilities for cross-cutting concerns (auth, household scoping, validation) instead of re-implementing logic.
- Keep server function CRUD patterns consistent: validate inputs, enforce ownership/authorization, and return typed, frontend-friendly data.
- Avoid top-level imports of Node-only modules (e.g., `@/db`, Prisma, `pg`) in code that may be bundled for the client; use server-only helpers or dynamic imports (e.g., `getPrisma()` from `src/server/db.ts`) inside server handlers.
