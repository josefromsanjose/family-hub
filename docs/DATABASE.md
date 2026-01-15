# Database Management Guide

## Overview

Family Hub uses **Prisma 7 ORM** with **Supabase PostgreSQL** as the database. This document covers our architecture decisions, connection setup, and schema management process.

**Note:** This guide is written for Prisma 7, which has different configuration requirements than Prisma 6. See the Prisma 7 Configuration section for details.

## Architecture Decisions

### Why Prisma + Clerk + Supabase (Storage/DB Only)?

We chose this hybrid approach for the following reasons:

1. **Prisma for Database Queries**
   - Superior query API and type safety
   - Better developer experience with Prisma Studio
   - Excellent migration system
   - Database-agnostic (can switch providers if needed)

2. **Clerk for Authentication**
   - Better UX for family apps (invite flows, family accounts)
   - More advanced auth features (social logins, MFA, user management)
   - Better developer experience
   - Independent from database provider

3. **Supabase PostgreSQL for Database**
   - Managed PostgreSQL with excellent performance
   - Connection pooling for serverless environments
   - Reliable and scalable

4. **Supabase Storage for File Uploads** (Future)
   - Built-in file storage
   - Easy integration
   - Can be used alongside Prisma (store URLs in database)

### What We're NOT Using

- **Supabase.js full client** - We use Prisma for queries instead
- **Supabase Auth** - We use Clerk for authentication instead
- **Supabase real-time** - Can be added later if needed, alongside Prisma

### Database Environment

- **Production database only** - No separate dev database (personal project)
- All schema changes go directly to production
- Use migrations for all changes after initial setup

## Connection Setup

### Connection Pooling

We use **connection pooling** for TanStack Start (serverless environment):

- **Pooled connection** (port 6543): Used for application queries
- **Direct connection** (port 5432): Used for migrations only

This setup is required because:

- TanStack Start runs on serverless platforms (Vercel/Netlify)
- Serverless functions need connection pooling to avoid connection limits
- Migrations require direct connections to create schema changes

### Environment Variables

Required environment variables in `.env.local`:

```env
# Database Connection (Pooled - for application queries)
# Get from: Supabase Dashboard → ORMs tab → Prisma → Connection Pooling
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"

# Direct Connection (for migrations only)
# Same as DATABASE_URL but:
# - Port 5432 (instead of 6543)
# - Remove &pgbouncer=true parameter
# Get from: Supabase Dashboard → ORMs tab → Prisma → Direct Connection
# OR manually: Copy DATABASE_URL, change port to 5432, remove &pgbouncer=true
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"

# Supabase Storage (for future file uploads)
# Get from: Supabase Dashboard → App Frameworks tab → TanStack Start
VITE_SUPABASE_URL="https://PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_..."

# Supabase Service Role (for server-side storage operations)
# Get from: Supabase Dashboard → Project Settings → API → Service Role Key
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
```

**Important Notes:**

- `DATABASE_URL` uses port **6543** (connection pooling) - for application queries
- `DIRECT_URL` uses port **5432** (direct connection) - **REQUIRED for migrations**
- `DIRECT_URL` is the same connection string as `DATABASE_URL` but:
  - Change port from `6543` to `5432`
  - Remove `&pgbouncer=true` parameter
- `VITE_` prefix is required for client-side variables in TanStack Start
- Never commit `.env.local` to git (already in `.gitignore`)

**Quick Setup:**
If you have `DATABASE_URL` but not `DIRECT_URL`, copy your `DATABASE_URL` and:

1. Change `:6543` to `:5432`
2. Remove `&pgbouncer=true` (if present)
3. That's your `DIRECT_URL`!

### Prisma 7 Configuration

**Important:** Prisma 7 requires a different setup than Prisma 6:

1. **Schema File** (`prisma/schema.prisma`) - No connection URLs:

```prisma
datasource db {
  provider = "postgresql"
  // Connection URLs are NOT in schema file (Prisma 7 change)
}
```

2. **Config File** (`prisma.config.ts`) - Contains connection URLs:

```typescript
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"), // Use DIRECT_URL for migrations
  },
});
```

3. **Database Client** (`src/db.ts`) - Uses adapter pattern:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
```

**Required Packages:**

- `@prisma/adapter-pg` - Prisma adapter for PostgreSQL (Prisma 7 requirement)
- `pg` - PostgreSQL client library

## First-Time Schema Publishing

This process creates all database tables for the first time.

### Prerequisites

1. ✅ Supabase project created
2. ✅ Environment variables configured in `.env.local`:
   - `DATABASE_URL` (pooled connection, port 6543)
   - `DIRECT_URL` (direct connection, port 5432) - **REQUIRED**
3. ✅ Database password set in Supabase dashboard
4. ✅ Prisma 7 packages installed:
   ```bash
   npm install @prisma/adapter-pg pg
   ```

**Note:** If you only have `DATABASE_URL`, create `DIRECT_URL` by copying it and:

- Change port from `6543` to `5432`
- Remove `&pgbouncer=true` parameter

### Steps

1. **Verify Environment Variables**

   ```bash
   # Check that .env.local exists and has DATABASE_URL and DIRECT_URL
   cat .env.local
   ```

2. **Install Prisma 7 Dependencies** (if not already installed)

   ```bash
   npm install @prisma/adapter-pg pg
   ```

   Prisma 7 requires these packages for PostgreSQL connections.

3. **Generate Prisma Client**

   ```bash
   npm run db:generate
   ```

   This generates the Prisma Client based on your schema.

4. **Push Schema to Database** (First Time Only)

   ```bash
   npm run db:push
   ```

   This command:
   - Connects to Supabase using `DIRECT_URL`
   - Creates all tables, indexes, and relationships
   - Does NOT create migration files (this is fine for first-time setup)

5. **Verify Tables Created**

   ```bash
   npm run db:studio
   ```

   Opens Prisma Studio in your browser where you can:
   - View all tables
   - See the schema structure
   - Verify data (should be empty initially)

6. **Test Connection**
   ```bash
   npm run dev
   ```
   Start the app and verify it connects to the database without errors.

### Expected Result

After running `db:push`, you should have these tables in Supabase:

- `household_members`
- `tasks`
- `completion_records`
- `meals`
- `shopping_items`
- `calendar_events`

You can verify in:

- **Prisma Studio**: `npm run db:studio`
- **Supabase Dashboard**: Table Editor

## Ongoing Schema Changes

After the first-time setup, **always use migrations** for schema changes.

### Why Migrations?

- **Version control**: Track all schema changes in git
- **Rollback support**: Can revert changes if needed
- **Production safety**: Review SQL before applying
- **Team collaboration**: Others can see what changed

### Process for Schema Changes

1. **Edit Schema**

   ```bash
   # Edit prisma/schema.prisma
   # Add/modify models, fields, indexes, etc.
   ```

2. **Create Migration**

   ```bash
   npm run db:migrate
   ```

   This will:
   - Prompt for a migration name (e.g., "add_reminder_fields")
   - Generate migration SQL files in `prisma/migrations/`
   - Apply the migration to your database

3. **Review Migration**

   ```bash
   # Check the generated SQL in prisma/migrations/
   # Review the changes before committing
   ```

4. **Verify Changes**

   ```bash
   npm run db:studio
   # Verify the schema changes in Prisma Studio
   ```

5. **Commit Changes**
   ```bash
   git add prisma/schema.prisma prisma/migrations/
   git commit -m "feat: add reminder fields to tasks"
   ```

### Important Rules

⚠️ **Never use `db:push` after first-time setup**

- `db:push` doesn't create migration files
- Makes it impossible to track changes
- Can't rollback changes

✅ **Always use `db:migrate` for changes**

- Creates migration files
- Tracks changes in git
- Can rollback if needed

## Database Schema Overview

### Models

1. **Household** - Household container for all data
2. **HouseholdMember** - Family members with roles, colors, and Clerk IDs
3. **RolePermission** - Global role default permissions (data-driven templates)
4. **MemberPermission** - Per-member permissions (source of truth)
5. **Task** - Tasks and chores (one-time and recurring)
6. **CompletionRecord** - Completion history for recurring tasks
7. **Meal** - Meal planning entries
8. **ShoppingItem** - Shopping list items
9. **CalendarEvent** - Calendar events (one-time and recurring)

### Key Relationships

- `Household.ownerId` → `HouseholdMember.id` (owner reference, set after member creation)
- `HouseholdMember.householdId` → `Household.id` (cascade delete)
- `MemberPermission.memberId` → `HouseholdMember.id` (cascade delete)
- `RolePermission.role` → `HouseholdRole` enum (global template per role)
- `Task.householdId` → `Household.id` (cascade delete)
- `CompletionRecord.householdId` → `Household.id` (cascade delete)
- `Meal.householdId` → `Household.id` (cascade delete)
- `ShoppingItem.householdId` → `Household.id` (cascade delete)
- `CalendarEvent.householdId` → `Household.id` (cascade delete)
- `Task.assignedToId` → `HouseholdMember.id` (optional)
- `CompletionRecord.taskId` → `Task.id` (cascade delete)
- `CompletionRecord.completedById` → `HouseholdMember.id` (cascade delete)

### Permissions Model

- `RolePermission` defines **global default permissions** for each role.
- At member creation, permissions are **copied** into `MemberPermission`.
- `MemberPermission` is the **source of truth** and does not auto-update if role defaults change.

### Indexes

Indexes are defined in the schema for optimal query performance:

- `households.name` - Household lookup
- `household_members.householdId` - Household scoping
- `member_permissions.memberId` - Member permission lookup
- `member_permissions.permission` - Permission filtering
- `role_permissions.role` - Role default lookup
- `role_permissions.permission` - Permission filtering
- `tasks.householdId` - Household scoping
- `tasks.assignedToId` - Task assignment queries
- `tasks.recurrence` - Recurring task filtering
- `completion_records.householdId` - Household scoping
- `completion_records.taskId` - Completion history
- `completion_records.completedAt` - Date-based queries

## Troubleshooting

### Prisma 7 Errors

**Error: "The datasource property `url` is no longer supported in schema files"**

- **Cause:** Prisma 7 moved connection URLs out of `schema.prisma`
- **Fix:**
  1. Remove `url` and `directUrl` from `prisma/schema.prisma`
  2. Add connection URLs to `prisma.config.ts` (see Prisma 7 Configuration section above)
  3. Install required packages: `npm install @prisma/adapter-pg pg`
  4. Update `src/db.ts` to use adapter pattern (see example above)

**Error: "Cannot find module '@prisma/adapter-pg'"**

- **Cause:** Prisma 7 requires adapter packages
- **Fix:** Run `npm install @prisma/adapter-pg pg`

### Connection Errors

**Error: "Connection timeout"**

- Check that `DATABASE_URL` uses port 6543 (pooling)
- Verify database password is correct
- Check Supabase dashboard for connection issues

**Error: "Too many connections"**

- Make sure you're using pooled connection (port 6543) for queries
- Direct connection (port 5432) should only be used for migrations

### Migration Errors

**Error: "Migration failed"**

- Check that `DIRECT_URL` is set correctly
- Verify database password hasn't changed
- Review the migration SQL for syntax errors

**Error: "Migration already applied"**

- Check `_prisma_migrations` table in database
- Delete the migration file if it was partially applied
- Re-run migration

### Schema Sync Issues

**Error: "Schema is out of sync"**

- Run `npm run db:generate` to regenerate Prisma Client
- Check that schema matches database structure
- Use `db:studio` to compare schema vs database

## Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema to database (FIRST TIME ONLY)
npm run db:push

# Create and apply migration (for all changes after first setup)
npm run db:migrate

# Open Prisma Studio (visual database browser)
npm run db:studio

# Seed database (if seed script exists)
npm run db:seed
```

## Future Considerations

### Adding Supabase Storage

When you're ready to add file uploads:

1. Install Supabase client:

   ```bash
   npm install @supabase/supabase-js
   ```

2. Create storage utility:

   ```typescript
   // src/utils/supabase.ts
   import { createClient } from "@supabase/supabase-js";

   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```

3. Use for file uploads:

   ```typescript
   await supabase.storage.from("meal-photos").upload("recipe.jpg", file);
   ```

4. Store URLs in Prisma:
   ```typescript
   await prisma.meal.update({
     where: { id: mealId },
     data: { photoUrl: url },
   });
   ```

### Adding Real-Time (Optional)

If you need real-time updates later:

1. Add Supabase real-time subscriptions alongside Prisma
2. Use Prisma for queries, Supabase real-time for live updates
3. No need to replace Prisma

---

**Last Updated:** January 2025  
**Status:** Active Development
