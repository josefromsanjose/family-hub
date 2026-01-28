-- Remove calendar event type enum and column
DROP INDEX "calendar_events_type_idx";
ALTER TABLE "calendar_events" DROP COLUMN "type";
DROP TYPE "EventType";
