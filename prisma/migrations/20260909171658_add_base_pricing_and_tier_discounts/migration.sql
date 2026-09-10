-- AlterTable
ALTER TABLE "PriceGroup" ADD COLUMN     "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "basePrice" DECIMAL(14,2),
ADD COLUMN     "leadTimeText" TEXT,
ADD COLUMN     "minimumQty" INTEGER,
ADD COLUMN     "pricingNote" TEXT;
