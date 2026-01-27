/*
  Warnings:

  - You are about to drop the column `type` on the `calendar_events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "calendar_events_type_idx";

-- AlterTable
ALTER TABLE "calendar_events" DROP COLUMN "type";

-- DropEnum
DROP TYPE "EventType";
