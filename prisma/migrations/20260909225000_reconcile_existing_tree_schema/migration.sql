-- Reconcile ProductCategory recursive tree schema.
-- These changes already exist in the current Neon database.
-- This migration is being baselined into Prisma migration history.

ALTER TABLE "ProductCategory"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "parentId" TEXT,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ProductCategory_isActive_idx"
ON "ProductCategory"("isActive");

CREATE INDEX "ProductCategory_parentId_idx"
ON "ProductCategory"("parentId");

CREATE INDEX "ProductCategory_parentId_position_idx"
ON "ProductCategory"("parentId", "position");

ALTER TABLE "ProductCategory"
ADD CONSTRAINT "ProductCategory_parentId_fkey"
FOREIGN KEY ("parentId")
REFERENCES "ProductCategory"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


-- Reconcile Service recursive tree schema.
-- These changes already exist in the current Neon database.

ALTER TABLE "Service"
ADD COLUMN "parentId" TEXT,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Service_isActive_idx"
ON "Service"("isActive");

CREATE INDEX "Service_parentId_idx"
ON "Service"("parentId");

CREATE INDEX "Service_parentId_position_idx"
ON "Service"("parentId", "position");

ALTER TABLE "Service"
ADD CONSTRAINT "Service_parentId_fkey"
FOREIGN KEY ("parentId")
REFERENCES "Service"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;