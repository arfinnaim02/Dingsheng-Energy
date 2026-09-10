import {
  notFound,
} from "next/navigation";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  ProductEditor,
} from "@/components/admin/ProductEditor";

import {
  getPriceGroups,
  getProduct,
} from "@/lib/catalog";

import {
  getAdminCategories,
} from "@/lib/databaseCategories";

import {
  getProductDocuments,
  legacyProductDocuments,
} from "@/lib/databaseProductDocuments";

import {
  getProductImages,
  legacyProductImages,
} from "@/lib/databaseProductImages";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditProductPage({
  params,
}: PageProps) {
  const { slug } =
    await params;

  const [
    product,
    categories,
    priceGroups,
    databaseImages,
    databaseDocuments,
  ] =
    await Promise.all([
      getProduct(
        slug,
        {
          includeProtected:
            true,

          activeOnly:
            false,
        },
      ),

      getAdminCategories(),

      getPriceGroups(),

      getProductImages(
        slug,
      ),

      getProductDocuments(
        slug,
      ),
    ]);

  if (!product) {
    notFound();
  }

  const initialImages =
    databaseImages.length
      ? databaseImages
      : legacyProductImages({
          primaryImage:
            product.image,

          gallery:
            product.gallery,

          productName:
            product.name,
        });

  const initialDocuments =
    databaseDocuments.length
      ? databaseDocuments
      : legacyProductDocuments(
          {
            publicDownloads:
              product.publicDownloads,

            dealerDownloads:
              product.dealerDownloads,
          },
        );

  return (
    <PortalShell
      admin
      title={`Edit: ${product.name}`}
    >
      <ProductEditor
        product={
          product
        }

        categories={
          categories
        }

        priceGroups={
          priceGroups
        }

        initialImages={
          initialImages
        }

        initialDocuments={
          initialDocuments
        }
      />
    </PortalShell>
  );
}