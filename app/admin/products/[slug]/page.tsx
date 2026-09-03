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
  getCategories,
  getPriceGroups,
  getProduct,
} from "@/lib/catalog";

import {
  getProductImages,
  legacyProductImages,
} from "@/lib/databaseProductImages";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditProductPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const [
    product,
    categories,
    priceGroups,
    databaseImages,
  ] = await Promise.all([
    getProduct(slug, {
      includeProtected: true,
      activeOnly: false,
    }),

    getCategories(),
    getPriceGroups(),
    getProductImages(slug),
  ]);

  if (!product) {
    notFound();
  }

  const initialImages =
    databaseImages.length
      ? databaseImages
      : legacyProductImages({
          primaryImage: product.image,
          gallery: product.gallery,
          productName: product.name,
        });

  return (
    <PortalShell
      admin
      title={`Edit: ${product.name}`}
    >
      <ProductEditor
        product={product}
        categories={categories}
        priceGroups={priceGroups}
        initialImages={initialImages}
      />
    </PortalShell>
  );
}