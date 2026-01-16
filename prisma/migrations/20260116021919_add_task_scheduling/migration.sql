-- CreateEnum
CREATE TYPE "TaskRotationMode" AS ENUM ('none', 'odd_even_week');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "recurrenceDayOfMonth" INTEGER,
ADD COLUMN     "recurrenceDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "recurrenceWeekOfMonth" INTEGER,
ADD COLUMN     "recurrenceWeekday" INTEGER,
ADD COLUMN     "rotationAnchorDate" TIMESTAMP(3),
ADD COLUMN     "rotationAssignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rotationMode" "TaskRotationMode" NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "task_assignment_overrides" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignment_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_assignment_overrides_taskId_idx" ON "task_assignment_overrides"("taskId");

-- CreateIndex
CREATE INDEX "task_assignment_overrides_assignedToId_idx" ON "task_assignment_overrides"("assignedToId");

-- CreateIndex
CREATE INDEX "task_assignment_overrides_date_idx" ON "task_assignment_overrides"("date");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignment_overrides_taskId_date_key" ON "task_assignment_overrides"("taskId", "date");

-- AddForeignKey
ALTER TABLE "task_assignment_overrides" ADD CONSTRAINT "task_assignment_overrides_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignment_overrides" ADD CONSTRAINT "task_assignment_overrides_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
