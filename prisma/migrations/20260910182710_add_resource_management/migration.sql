-- CreateEnum
CREATE TYPE "ResourceAccess" AS ENUM ('PUBLIC', 'DEALER', 'CONTROLLED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('COMPANY', 'CATALOGUE', 'DATASHEET', 'TECHNICAL', 'COMMERCIAL', 'INSTALLATION', 'SERVICE', 'OTHER');

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "type" "ResourceType" NOT NULL DEFAULT 'OTHER',
    "access" "ResourceAccess" NOT NULL DEFAULT 'PUBLIC',
    "image" TEXT,
    "imagePublicId" TEXT,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "originalFileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "externalUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE INDEX "Resource_isActive_idx" ON "Resource"("isActive");

-- CreateIndex
CREATE INDEX "Resource_access_idx" ON "Resource"("access");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_position_idx" ON "Resource"("position");
