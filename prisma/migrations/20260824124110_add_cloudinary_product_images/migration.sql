-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "cloudinaryPublicId" TEXT;

-- CreateIndex
CREATE INDEX "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");

-- CreateIndex
CREATE INDEX "ProductImage_cloudinaryPublicId_idx" ON "ProductImage"("cloudinaryPublicId");
