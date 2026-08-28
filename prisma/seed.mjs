import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const catalogPath = path.resolve(
  currentDirectory,
  "../data/catalog.json",
);

const commercialModeMap = {
  information: "INFORMATION_ONLY",
  rfq: "RFQ_ONLY",
  "dealer-purchase": "DEALER_PURCHASE",
  "dealer-purchase-rfq": "DEALER_PURCHASE_AND_RFQ",
};

function optionalString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function documentTitle(filePath) {
  const cleanPath = String(filePath).split("?")[0];
  const fileName = cleanPath.split("/").pop() || "Document";

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values.filter(
        (value) =>
          typeof value === "string" &&
          value.trim().length > 0,
      ),
    ),
  ];
}

async function loadCatalog() {
  const raw = await readFile(catalogPath, "utf8");
  return JSON.parse(raw);
}

async function seed() {
  const catalog = await loadCatalog();

  console.log(`Reading catalogue: ${catalogPath}`);
  console.log(`Categories: ${catalog.categories.length}`);
  console.log(`Products: ${catalog.products.length}`);
  console.log(`Services: ${catalog.services.length}`);
  console.log(`Price groups: ${catalog.priceGroups.length}`);

  const categoryIds = new Map();

  for (const category of catalog.categories) {
    const savedCategory = await prisma.productCategory.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        shortName: optionalString(category.shortName),
        summary: optionalString(category.summary),
        description: optionalString(category.description),
        image: optionalString(category.image),
        heroImage: optionalString(category.heroImage),
        groupsJson: category.groups ?? [],
      },
      create: {
        slug: category.slug,
        name: category.name,
        shortName: optionalString(category.shortName),
        summary: optionalString(category.summary),
        description: optionalString(category.description),
        image: optionalString(category.image),
        heroImage: optionalString(category.heroImage),
        groupsJson: category.groups ?? [],
      },
    });

    categoryIds.set(category.slug, savedCategory.id);
  }

  const priceGroupIds = new Map();

  for (const group of catalog.priceGroups) {
    const savedGroup = await prisma.priceGroup.upsert({
      where: {
        slug: group.slug,
      },
      update: {
        name: group.name,
        description: optionalString(group.description),
        active: group.active !== false,
      },
      create: {
        slug: group.slug,
        name: group.name,
        description: optionalString(group.description),
        active: group.active !== false,
      },
    });

    priceGroupIds.set(group.slug, savedGroup.id);
  }

  await prisma.dealerPortalSetting.upsert({
    where: {
      id: "default",
    },
    update: {
      demoPriceGroupSlug:
        catalog.dealerPortal?.demoPriceGroupSlug ?? "standard",
      demoCompanyName:
        catalog.dealerPortal?.demoCompanyName ??
        "Demo Dealer Company",
      demoContactName:
        catalog.dealerPortal?.demoContactName ?? "Demo User",
    },
    create: {
      id: "default",
      demoPriceGroupSlug:
        catalog.dealerPortal?.demoPriceGroupSlug ?? "standard",
      demoCompanyName:
        catalog.dealerPortal?.demoCompanyName ??
        "Demo Dealer Company",
      demoContactName:
        catalog.dealerPortal?.demoContactName ?? "Demo User",
    },
  });

  for (const product of catalog.products) {
    const categoryAssignments = uniqueStrings(
      product.categorySlugs,
    ).map((categorySlug) => {
      const categoryId = categoryIds.get(categorySlug);

      if (!categoryId) {
        throw new Error(
          `Category "${categorySlug}" was not found for product "${product.slug}".`,
        );
      }

      return {
        categoryId,
        groupName:
          optionalString(
            product.categoryGroups?.[categorySlug],
          ) ?? optionalString(product.subcategory),
      };
    });

    const specifications = (product.specs ?? [])
      .filter(
        (specification) =>
          Array.isArray(specification) &&
          specification.length >= 2,
      )
      .map(([label, value], position) => ({
        label: String(label),
        value: String(value),
        position,
      }));

    const applications = uniqueStrings(
      product.applications,
    ).map((label, position) => ({
      label,
      position,
    }));

    const standards = uniqueStrings(product.standards).map(
      (label, position) => ({
        label,
        position,
      }),
    );

    const imageUrls = uniqueStrings([
      product.image,
      ...(product.gallery ?? []),
    ]);

    const images = imageUrls.map((url, position) => ({
      url,
      alt: product.name,
      position,
    }));

    const publicDocuments = uniqueStrings(
      product.publicDownloads,
    ).map((filePath) => ({
      title: documentTitle(filePath),
      filePath,
      dealerOnly: false,
    }));

    const dealerDocuments = uniqueStrings(
      product.dealerDownloads,
    ).map((filePath) => ({
      title: documentTitle(filePath),
      filePath,
      dealerOnly: true,
    }));

    const documents = [
      ...publicDocuments,
      ...dealerDocuments,
    ];

    const prices = (product.dealerPrices ?? [])
      .filter(
        (price) =>
          typeof price.amount === "number" &&
          Number.isFinite(price.amount) &&
          price.amount >= 0 &&
          priceGroupIds.has(price.priceGroupSlug),
      )
      .map((price) => ({
        priceGroupId: priceGroupIds.get(
          price.priceGroupSlug,
        ),
        currency:
          typeof price.currency === "string" &&
          /^[A-Za-z]{3}$/.test(price.currency)
            ? price.currency.toUpperCase()
            : "USD",
        amount: price.amount,
        minimumQty:
          Number.isInteger(price.minimumQty) &&
          price.minimumQty > 0
            ? price.minimumQty
            : null,
        leadTimeText: optionalString(price.leadTimeText),
        note: optionalString(price.note),
      }));

    const productData = {
      name: product.name,
      sku: optionalString(product.sku),
      subcategory: optionalString(product.subcategory),
      eyebrow: optionalString(product.eyebrow),
      summary: optionalString(product.summary),
      description: optionalString(product.description),
      primaryCategorySlug: optionalString(
        product.primaryCategorySlug,
      ),
      commercialMode:
        commercialModeMap[product.commercialMode] ??
        "RFQ_ONLY",
      dealerPriceProtected:
        product.dealerPriceProtected !== false,
      featured: product.featured === true,
      availability: optionalString(product.availability),
      unitLabel: optionalString(product.unitLabel) ?? "Unit",
      dealerCommercialDetails: optionalString(
        product.dealerCommercialDetails,
      ),
      relatedProductsJson: product.relatedProducts ?? [],
      isActive: product.active !== false,
    };

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        ...productData,

        categories: {
          deleteMany: {},
          create: categoryAssignments,
        },

        specs: {
          deleteMany: {},
          create: specifications,
        },

        applications: {
          deleteMany: {},
          create: applications,
        },

        standards: {
          deleteMany: {},
          create: standards,
        },

        images: {
          deleteMany: {},
          create: images,
        },

        documents: {
          deleteMany: {},
          create: documents,
        },

        prices: {
          deleteMany: {},
          create: prices,
        },
      },
      create: {
        slug: product.slug,
        ...productData,

        categories: {
          create: categoryAssignments,
        },

        specs: {
          create: specifications,
        },

        applications: {
          create: applications,
        },

        standards: {
          create: standards,
        },

        images: {
          create: images,
        },

        documents: {
          create: documents,
        },

        prices: {
          create: prices,
        },
      },
    });

    console.log(`Imported product: ${product.slug}`);
  }

  for (const service of catalog.services) {
    await prisma.service.upsert({
      where: {
        slug: service.slug,
      },
      update: {
        name: service.name,
        shortName: optionalString(service.shortName),
        summary: optionalString(service.summary),
        description: optionalString(service.description),
        image: optionalString(service.image),
        heroImage: optionalString(service.heroImage),
        scopeJson: service.scope ?? [],
        processJson: service.process ?? [],
        applicationsJson: service.applications ?? [],
        featured: service.featured === true,
        isActive: service.active !== false,
      },
      create: {
        slug: service.slug,
        name: service.name,
        shortName: optionalString(service.shortName),
        summary: optionalString(service.summary),
        description: optionalString(service.description),
        image: optionalString(service.image),
        heroImage: optionalString(service.heroImage),
        scopeJson: service.scope ?? [],
        processJson: service.process ?? [],
        applicationsJson: service.applications ?? [],
        featured: service.featured === true,
        isActive: service.active !== false,
      },
    });

    console.log(`Imported service: ${service.slug}`);
  }

  const [
    categoryCount,
    productCount,
    serviceCount,
    priceGroupCount,
    productPriceCount,
    settingsCount,
  ] = await Promise.all([
    prisma.productCategory.count(),
    prisma.product.count(),
    prisma.service.count(),
    prisma.priceGroup.count(),
    prisma.productPrice.count(),
    prisma.dealerPortalSetting.count(),
  ]);

  console.log("");
  console.log("Neon import completed.");
  console.log(`Categories: ${categoryCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Services: ${serviceCount}`);
  console.log(`Price groups: ${priceGroupCount}`);
  console.log(`Configured price records: ${productPriceCount}`);
  console.log(`Dealer portal settings: ${settingsCount}`);
}

seed()
  .catch((error) => {
    console.error("");
    console.error("Catalogue import failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });