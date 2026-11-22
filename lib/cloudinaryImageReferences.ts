import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Cloudinary public IDs can be reused by a card and hero image,
 * or by multiple records. Never destroy an image while Neon
 * still references it.
 *
 * If the database cannot be checked, the caller must not delete
 * the asset. Preserving an orphan is safer than breaking a page.
 */
export async function isCloudinaryImageReferenced(
  publicId: string,
): Promise<boolean> {
  const id = publicId.trim();

  if (!id) {
    return false;
  }

  const [
    productImage,
    category,
    service,
    resource,
  ] = await Promise.all([
    prisma.productImage.findFirst({
      where: { cloudinaryPublicId: id },
      select: { id: true },
    }),
    prisma.productCategory.findFirst({
      where: {
        OR: [
          { imagePublicId: id },
          { heroImagePublicId: id },
        ],
      },
      select: { id: true },
    }),
    prisma.service.findFirst({
      where: {
        OR: [
          { imagePublicId: id },
          { heroImagePublicId: id },
        ],
      },
      select: { id: true },
    }),
    prisma.resource.findFirst({
      where: { imagePublicId: id },
      select: { id: true },
    }),
  ]);

  return Boolean(
    productImage || category || service || resource,
  );
}
