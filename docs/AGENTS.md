## Agent Patterns

- Prefer existing helper utilities for cross-cutting concerns (auth, household scoping, validation) instead of re-implementing logic.
- Keep server function CRUD patterns consistent: validate inputs, enforce ownership/authorization, and return typed, frontend-friendly data.
