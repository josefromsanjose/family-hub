-- Add meal library items table
CREATE TABLE "meal_library_items" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_library_items_pkey" PRIMARY KEY ("id")
);

-- Add optional link from meals to library items
ALTER TABLE "meals" ADD COLUMN "mealLibraryItemId" TEXT;

-- Indexes for library items and the new link
CREATE INDEX "meal_library_items_householdId_idx" ON "meal_library_items"("householdId");
CREATE INDEX "meal_library_items_name_idx" ON "meal_library_items"("name");
CREATE INDEX "meals_mealLibraryItemId_idx" ON "meals"("mealLibraryItemId");

-- Foreign keys
ALTER TABLE "meal_library_items" ADD CONSTRAINT "meal_library_items_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meals" ADD CONSTRAINT "meals_mealLibraryItemId_fkey"
    FOREIGN KEY ("mealLibraryItemId") REFERENCES "meal_library_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
