# Database Management Guide

## Overview

Family Hub uses **Convex** as the primary data layer. This document covers how we
set up Convex for local development, how schema changes are applied, and how we
deploy updates. **Never reset the database.**

## Architecture Decisions

### Why Convex + Clerk

1. **Convex for Data**
   - Schema-defined data model in `convex/schema.ts`
   - Server-side functions in `convex/*` (queries, mutations, actions)
   - Realtime updates and typed API generation

2. **Clerk for Authentication**
   - Centralized auth and user identity
   - Compatible with Convex auth integration

### Environment Strategy

- **Local dev** uses a Convex dev deployment.
- **Production** uses a Convex production deployment.
- Auth is handled by Clerk in both environments.

## Connection Setup

### Environment Variables

Required variables in `.env.local`:

```env
# Convex client URL (used by the app)
VITE_CONVEX_URL="https://YOUR-DEPLOYMENT.convex.cloud"

# Convex deployment URL for server-side access
CONVEX_URL="https://YOUR-DEPLOYMENT.convex.cloud"

# Convex admin key (server-only)
CONVEX_ADMIN_KEY="YOUR-CONVEX-ADMIN-KEY"

# Clerk OIDC issuer for Convex auth config
CLERK_ISSUER_URL="https://your-clerk-domain.clerk.accounts.dev"

# Clerk JWT audience (Convex JWT template audience)
CLERK_JWT_AUDIENCE="convex"
```

**Important Notes:**

- Use `VITE_` prefix for client-side access in TanStack Start.
- Do not commit `.env.local` to git.

## Clerk + Convex Auth

Convex verifies Clerk-issued JWTs using `convex/auth.config.ts`. The issuer
and audience are read from `CLERK_ISSUER_URL` and `CLERK_JWT_AUDIENCE`, so
tokens are validated server-side before user identity is exposed to functions.

Server-side TanStack Start functions authenticate the request with Clerk
(`auth()` in `src/server/clerk.ts`), then call Convex internal functions with
`actingAsIdentity` via `getConvexClient()`. Convex functions read the current
user with `ctx.auth.getUserIdentity()` (see `convex/lib/household.ts`) to map
the Clerk user ID and enforce household scoping.

## Local Development

### First-Time Setup

1. **Install dependencies** (Convex is already in `package.json`).
2. **Start Convex dev deployment**:
   ```bash
   npx convex dev
   ```
3. **Run the app**:
   ```bash
   npm run dev
   ```

Convex generates API types under `convex/_generated` during `convex dev`. Keep
`npx convex dev` running while developing.

## Schema Changes

### Where the Schema Lives

- `convex/schema.ts` is the source of truth for tables, fields, and indexes.

### How to Apply Schema Updates

1. Edit `convex/schema.ts`.
2. Run `npx convex dev` (or keep it running) to sync changes in dev.
3. Deploy to production with `npx convex deploy` when ready.

Convex does **not** use SQL migrations. Schema changes are applied through the
schema file and deployment tooling.

## Data Migrations and Backfills

If schema changes require backfills, implement a dedicated script or Convex
function to migrate data explicitly. Do not reset data to "fix" schema changes.

### Role/Permission Seed

Role and member permission defaults are seeded via a Convex mutation. Run this
after starting Convex dev or deploying the backend:

```bash
npm run convex:seed
```

## Deployment

### Production Deployment

Use the Convex CLI to deploy backend changes:

```bash
npx convex deploy
```

Ensure the frontend is configured with the production `VITE_CONVEX_URL` before
deploying the app.

## Guardrails

- **Never reset the database.**
- Keep Convex schema changes small and review indexes for query performance.
- Use explicit scripts/functions for data backfills instead of manual edits.
