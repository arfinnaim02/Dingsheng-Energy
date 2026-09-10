import {
  notFound,
  redirect,
} from "next/navigation";

import {
  buildCategoryHref,
  getPublicProductCategories,
} from "@/lib/publicProductTree";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props) {
  const {
    category: rawSlug,
  } = await params;

  let slug: string;

  try {
    slug =
      decodeURIComponent(
        rawSlug,
      );
  } catch {
    return {
      title:
        "Product Category | Dingsheng Energy Limited",
    };
  }

  const categories =
    await getPublicProductCategories();

  const category =
    categories.find(
      (item) =>
        item.slug === slug,
    );

  if (!category) {
    return {
      title:
        "Product Category | Dingsheng Energy Limited",
    };
  }

  return {
    title:
      `${category.name} | Dingsheng Energy Limited`,

    description:
      category.description ||
      category.summary ||
      `Explore ${category.name} products and LPG equipment from Dingsheng Energy Limited.`,
  };
}

export default async function LegacyCategoryPage({
  params,
}: Props) {
  const {
    category: rawSlug,
  } = await params;

  let slug: string;

  try {
    slug =
      decodeURIComponent(
        rawSlug,
      );
  } catch {
    notFound();
  }

  const categories =
    await getPublicProductCategories();

  const category =
    categories.find(
      (item) =>
        item.slug === slug,
    );

  if (!category) {
    notFound();
  }

  /*
   * This route exists only for
   * backward compatibility.
   *
   * Example:
   *
   * /products/storage-tank
   *
   * becomes:
   *
   * /products/category/lpg/
   * filling-plant/storage-tank
   */
  redirect(
    buildCategoryHref(
      categories,
      category.id,
    ),
  );
}