# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task

1. Read the PRD at `prd-[feature].md` (feature will be provided) in the PRDs directory
2. Read `docs/skills/frontend-engineer/SKILL.md` and follow those conventions for implementation and testing.
3. Read the progress log at `progress.txt` (check Codebase Patterns section first)
4. Review global `docs/AGENTS.md` and any relevant local `AGENTS.md` before starting the story
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story only
7. Write unit tests for any non-trivial UI or logic change, following project testing conventions.
8. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
9. Update AGENTS.md files if you discover reusable patterns (see below)
10. Update the PRD to set `passes: true` for the completed story and mark completed acceptance criteria with `[x]`
11. Append your progress to `progress.txt`
12. Stop immediately after completing one story (even if more remain)

## Progress Report Format

APPEND to progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]
Thread: https://ampcode.com/threads/$AMP_CURRENT_THREAD_ID
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

Include the thread URL so future iterations can use the `read_thread` tool to reference previous work if needed.

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

Add a dedicated step to review patterns in `progress.txt` and document new ones (up to ten) when applicable.

## Update AGENTS.md Files

Before committing, check if any edited files have learnings worth preserving in nearby AGENTS.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing AGENTS.md** - Look for AGENTS.md in those directories or parent directories; if none exists, create a local `AGENTS.md` in the nearest relevant directory.
3. **Add valuable learnings** - If you discovered something or start a pattern future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good AGENTS.md additions:**

- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**

- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update AGENTS.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Quality Requirements

- ALL commits must pass your project's quality checks (typecheck, lint, test)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns
- Tests should be isolated, fast, and deterministic; mock external services (DB/auth/network) when needed.
- If behavior changes, update or add tests in the same story to prevent regressions.

## Browser Testing (Required for Frontend Stories)

For any story that changes UI, you MUST verify it works in the browser:

1. Load the `dev-browser` skill
2. Navigate to the relevant page
3. Verify the UI changes work as expected
4. Take a screenshot if helpful for the progress log

A frontend story is NOT complete until browser verification passes.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.
Do NOT attempt additional stories in the same run.
This allows the next agent run to start with fresh context.

## Important

- Work on ONE story per iteration (never the full PRD in one run)
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
- Stop and think before finishing: did you notice or implement any patterns that should be recorded? If so, document them.
