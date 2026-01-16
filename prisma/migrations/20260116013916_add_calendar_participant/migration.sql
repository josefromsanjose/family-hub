-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "participantId" TEXT;

-- CreateIndex
CREATE INDEX "calendar_events_participantId_idx" ON "calendar_events"("participantId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
