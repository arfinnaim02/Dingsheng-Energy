-- AlterTable
ALTER TABLE "DealerProfile" ADD COLUMN     "interests" TEXT,
ADD COLUMN     "status" "DealerStatus" NOT NULL DEFAULT 'PENDING';
