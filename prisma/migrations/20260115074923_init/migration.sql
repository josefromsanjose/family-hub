-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('admin', 'adult', 'child');

-- CreateEnum
CREATE TYPE "HouseholdRelation" AS ENUM ('parent', 'child', 'grandparent', 'sibling', 'aunt_uncle', 'cousin', 'guardian', 'partner', 'roommate', 'other');

-- CreateEnum
CREATE TYPE "MemberLocale" AS ENUM ('en', 'es');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('member_add', 'member_delete', 'member_role_change', 'task_create', 'task_update', 'task_delete', 'chores_complete', 'chores_delete', 'calendar_create', 'calendar_update', 'calendar_delete', 'shopping_add', 'shopping_update', 'shopping_delete', 'meal_create', 'meal_update', 'meal_delete');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('appointment', 'event', 'reminder');

-- CreateEnum
CREATE TYPE "EventRecurrence" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "name" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL,
    "locale" "MemberLocale" NOT NULL DEFAULT 'en',
    "relation" "HouseholdRelation",
    "relationLabel" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL,
    "permission" "PermissionKey" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_permissions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "permission" "PermissionKey" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "recurrence" "TaskRecurrence",
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completion_records" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedById" TEXT NOT NULL,

    CONSTRAINT "completion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "category" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "listId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "type" "EventType" NOT NULL,
    "recurrence" "EventRecurrence",
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "households_ownerId_idx" ON "households"("ownerId");

-- CreateIndex
CREATE INDEX "households_name_idx" ON "households"("name");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_clerkUserId_key" ON "household_members"("clerkUserId");

-- CreateIndex
CREATE INDEX "household_members_householdId_idx" ON "household_members"("householdId");

-- CreateIndex
CREATE INDEX "household_members_name_idx" ON "household_members"("name");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");

-- CreateIndex
CREATE INDEX "member_permissions_memberId_idx" ON "member_permissions"("memberId");

-- CreateIndex
CREATE INDEX "member_permissions_permission_idx" ON "member_permissions"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "member_permissions_memberId_permission_key" ON "member_permissions"("memberId", "permission");

-- CreateIndex
CREATE INDEX "tasks_householdId_idx" ON "tasks"("householdId");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_recurrence_idx" ON "tasks"("recurrence");

-- CreateIndex
CREATE INDEX "tasks_completed_idx" ON "tasks"("completed");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "completion_records_householdId_idx" ON "completion_records"("householdId");

-- CreateIndex
CREATE INDEX "completion_records_taskId_idx" ON "completion_records"("taskId");

-- CreateIndex
CREATE INDEX "completion_records_completedAt_idx" ON "completion_records"("completedAt");

-- CreateIndex
CREATE INDEX "completion_records_completedById_idx" ON "completion_records"("completedById");

-- CreateIndex
CREATE INDEX "meals_householdId_idx" ON "meals"("householdId");

-- CreateIndex
CREATE INDEX "meals_date_idx" ON "meals"("date");

-- CreateIndex
CREATE INDEX "meals_mealType_idx" ON "meals"("mealType");

-- CreateIndex
CREATE INDEX "shopping_items_householdId_idx" ON "shopping_items"("householdId");

-- CreateIndex
CREATE INDEX "shopping_items_category_idx" ON "shopping_items"("category");

-- CreateIndex
CREATE INDEX "shopping_items_completed_idx" ON "shopping_items"("completed");

-- CreateIndex
CREATE INDEX "shopping_items_listId_idx" ON "shopping_items"("listId");

-- CreateIndex
CREATE INDEX "calendar_events_householdId_idx" ON "calendar_events"("householdId");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_recurrence_idx" ON "calendar_events"("recurrence");

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_permissions" ADD CONSTRAINT "member_permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
