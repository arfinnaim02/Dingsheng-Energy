-- AlterTable
ALTER TABLE "ProductDocument" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "originalFileName" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ProductDocument_productId_dealerOnly_position_idx" ON "ProductDocument"("productId", "dealerOnly", "position");

-- CreateIndex
CREATE INDEX "ProductDocument_cloudinaryPublicId_idx" ON "ProductDocument"("cloudinaryPublicId");
