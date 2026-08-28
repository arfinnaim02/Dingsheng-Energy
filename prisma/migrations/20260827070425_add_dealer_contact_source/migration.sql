-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('PUBLIC', 'DEALER');

-- AlterTable
ALTER TABLE "ContactInquiry" ADD COLUMN     "dealerId" TEXT,
ADD COLUMN     "source" "ContactSource" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "ContactInquiry_source_createdAt_idx" ON "ContactInquiry"("source", "createdAt");

-- CreateIndex
CREATE INDEX "ContactInquiry_dealerId_createdAt_idx" ON "ContactInquiry"("dealerId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContactInquiry" ADD CONSTRAINT "ContactInquiry_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "DealerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
