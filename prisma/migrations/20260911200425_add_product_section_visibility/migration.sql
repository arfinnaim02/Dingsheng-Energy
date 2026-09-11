-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "showApplications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStandards" BOOLEAN NOT NULL DEFAULT true;
