import "server-only";

import {
  prisma,
} from "@/lib/prisma";

import {
  slugify,
} from "@/lib/catalog";

export const MAX_SERVICE_TREE_DEPTH =
  9;

export type AdminService = {
  id: string;
  name: string;
  slug: string;

  shortName:
    | string
    | null;

  summary:
    | string
    | null;

  description:
    | string
    | null;

  image:
    | string
    | null;

  imagePublicId:
    | string
    | null;

  heroImage:
    | string
    | null;

  heroImagePublicId:
    | string
    | null;

  parentId:
    | string
    | null;

  position: number;

  scope: string[];
  process: string[];
  applications: string[];

  featured: boolean;
  isActive: boolean;
};

export type ServiceInput = {
  name: string;
  slug?: string;

  shortName?:
    | string
    | null;

  summary?:
    | string
    | null;

  description?:
    | string
    | null;

  image?:
    | string
    | null;

  imagePublicId?:
    | string
    | null;

  heroImage?:
    | string
    | null;

  heroImagePublicId?:
    | string
    | null;

  parentId?:
    | string
    | null;

  position?: number;

  scope?: string[];
  process?: string[];
  applications?: string[];

  featured?: boolean;
  isActive?: boolean;
};

export type ServiceMediaState = {
  imagePublicId:
    | string
    | null;

  heroImagePublicId:
    | string
    | null;
};

export type ServiceUpdateResult = {
  service: AdminService;

  before:
    ServiceMediaState;

  after:
    ServiceMediaState;
};

export type ServiceDeleteResult = {
  media:
    ServiceMediaState;
};

type ServiceHierarchyNode = {
  id: string;

  parentId:
    | string
    | null;
};

function cleanNullable(
  value:
    | string
    | null
    | undefined,
) {
  if (
    value ===
    undefined
  ) {
    return undefined;
  }

  const cleaned =
    value?.trim() ??
    "";

  return (
    cleaned ||
    null
  );
}

function toStringArray(
  value: unknown,
): string[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item ===
        "string",
    )
    .map(
      (
        item,
      ) =>
        item.trim(),
    )
    .filter(Boolean);
}

export async function getAdminServices(): Promise<
  AdminService[]
> {
  const services =
    await prisma.service.findMany({
      orderBy: [
        {
          position:
            "asc",
        },

        {
          name:
            "asc",
        },
      ],
    });

  return services.map(
    (
      service,
    ) => ({
      id:
        service.id,

      name:
        service.name,

      slug:
        service.slug,

      shortName:
        service.shortName,

      summary:
        service.summary,

      description:
        service.description,

      image:
        service.image,

      imagePublicId:
        service.imagePublicId,

      heroImage:
        service.heroImage,

      heroImagePublicId:
        service.heroImagePublicId,

      parentId:
        service.parentId,

      position:
        service.position,

      scope:
        toStringArray(
          service.scopeJson,
        ),

      process:
        toStringArray(
          service.processJson,
        ),

      applications:
        toStringArray(
          service.applicationsJson,
        ),

      featured:
        service.featured,

      isActive:
        service.isActive,
    }),
  );
}

async function getDepth(
  parentId:
    | string
    | null,
): Promise<number> {
  if (!parentId) {
    return 0;
  }

  let currentId:
    | string
    | null =
      parentId;

  let depth =
    0;

  const visited =
    new Set<string>();

  while (
    currentId
  ) {
    if (
      visited.has(
        currentId,
      )
    ) {
      throw new Error(
        "Invalid service hierarchy detected.",
      );
    }

    visited.add(
      currentId,
    );

    const current:
      ServiceHierarchyNode | null =
      await prisma.service.findUnique({
        where: {
          id:
            currentId,
        },

        select: {
          id: true,
          parentId: true,
        },
      });

    if (!current) {
      throw new Error(
        "Selected parent service does not exist.",
      );
    }

    depth +=
      1;

    currentId =
      current.parentId;
  }

  return depth;
}

async function getDescendantIds(
  serviceId: string,
): Promise<
  Set<string>
> {
  const services:
    ServiceHierarchyNode[] =
    await prisma.service.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

  const result =
    new Set<string>();

  function visit(
    parentId: string,
  ): void {
    for (
      const service
      of services
    ) {
      if (
        service.parentId !==
        parentId
      ) {
        continue;
      }

      if (
        result.has(
          service.id,
        )
      ) {
        continue;
      }

      result.add(
        service.id,
      );

      visit(
        service.id,
      );
    }
  }

  visit(
    serviceId,
  );

  return result;
}

async function validateParent(
  parentId:
    | string
    | null,

  currentId?: string,
): Promise<void> {
  if (!parentId) {
    return;
  }

  if (
    currentId &&
    parentId ===
      currentId
  ) {
    throw new Error(
      "A service cannot be its own parent.",
    );
  }

  if (currentId) {
    const descendants =
      await getDescendantIds(
        currentId,
      );

    if (
      descendants.has(
        parentId,
      )
    ) {
      throw new Error(
        "A service cannot be moved under one of its own child services.",
      );
    }
  }

  const parentDepth =
    await getDepth(
      parentId,
    );

  if (
    parentDepth >=
    MAX_SERVICE_TREE_DEPTH
  ) {
    throw new Error(
      `Service hierarchy supports a maximum of ${MAX_SERVICE_TREE_DEPTH} levels.`,
    );
  }
}

export async function createService(
  input: ServiceInput,
): Promise<AdminService> {
  const name =
    input.name?.trim();

  if (!name) {
    throw new Error(
      "Service name is required.",
    );
  }

  const slug =
    slugify(
      input.slug?.trim() ||
        name,
    );

  if (!slug) {
    throw new Error(
      "A valid service slug is required.",
    );
  }

  const existing =
    await prisma.service.findUnique({
      where: {
        slug,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    throw new Error(
      `A service with slug "${slug}" already exists.`,
    );
  }

  const parentId =
    input.parentId ||
    null;

  await validateParent(
    parentId,
  );

  await prisma.service.create({
    data: {
      name,
      slug,

      shortName:
        cleanNullable(
          input.shortName,
        ),

      summary:
        cleanNullable(
          input.summary,
        ),

      description:
        cleanNullable(
          input.description,
        ),

      image:
        cleanNullable(
          input.image,
        ),

      imagePublicId:
        cleanNullable(
          input.imagePublicId,
        ),

      heroImage:
        cleanNullable(
          input.heroImage,
        ),

      heroImagePublicId:
        cleanNullable(
          input.heroImagePublicId,
        ),

      parentId,

      position:
        Math.max(
          0,

          Math.trunc(
            Number(
              input.position,
            ) || 0,
          ),
        ),

      scopeJson:
        input.scope ??
        [],

      processJson:
        input.process ??
        [],

      applicationsJson:
        input.applications ??
        [],

      featured:
        input.featured ===
        true,

      isActive:
        input.isActive !==
        false,
    },
  });

  const services =
    await getAdminServices();

  const created =
    services.find(
      (
        service,
      ) =>
        service.slug ===
        slug,
    );

  if (!created) {
    throw new Error(
      "Unable to load created service.",
    );
  }

  return created;
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<ServiceUpdateResult> {
  const existing =
    await prisma.service.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new Error(
      "Service not found.",
    );
  }

  const name =
    input.name?.trim();

  if (!name) {
    throw new Error(
      "Service name is required.",
    );
  }

  const slug =
    slugify(
      input.slug?.trim() ||
        name,
    );

  if (!slug) {
    throw new Error(
      "A valid service slug is required.",
    );
  }

  const collision =
    await prisma.service.findFirst({
      where: {
        slug,

        NOT: {
          id,
        },
      },

      select: {
        id: true,
      },
    });

  if (collision) {
    throw new Error(
      `A service with slug "${slug}" already exists.`,
    );
  }

  const parentId =
    input.parentId ||
    null;

  await validateParent(
    parentId,
    id,
  );

  await prisma.service.update({
    where: {
      id,
    },

    data: {
      name,
      slug,

      shortName:
        cleanNullable(
          input.shortName,
        ),

      summary:
        cleanNullable(
          input.summary,
        ),

      description:
        cleanNullable(
          input.description,
        ),

      image:
        cleanNullable(
          input.image,
        ),

      imagePublicId:
        cleanNullable(
          input.imagePublicId,
        ),

      heroImage:
        cleanNullable(
          input.heroImage,
        ),

      heroImagePublicId:
        cleanNullable(
          input.heroImagePublicId,
        ),

      parentId,

      position:
        Math.max(
          0,

          Math.trunc(
            Number(
              input.position,
            ) || 0,
          ),
        ),

      scopeJson:
        input.scope ??
        [],

      processJson:
        input.process ??
        [],

      applicationsJson:
        input.applications ??
        [],

      featured:
        input.featured ===
        true,

      isActive:
        input.isActive !==
        false,
    },
  });

  const services =
    await getAdminServices();

  const updated =
    services.find(
      (
        service,
      ) =>
        service.id ===
        id,
    );

  if (!updated) {
    throw new Error(
      "Unable to load updated service.",
    );
  }

  return {
    service:
      updated,

    before: {
      imagePublicId:
        existing.imagePublicId,

      heroImagePublicId:
        existing.heroImagePublicId,
    },

    after: {
      imagePublicId:
        updated.imagePublicId,

      heroImagePublicId:
        updated.heroImagePublicId,
    },
  };
}

export async function deleteService(
  id: string,
): Promise<ServiceDeleteResult> {
  const service =
    await prisma.service.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        imagePublicId:
          true,

        heroImagePublicId:
          true,

        _count: {
          select: {
            children:
              true,
          },
        },
      },
    });

  if (!service) {
    throw new Error(
      "Service not found.",
    );
  }

  if (
    service._count
      .children >
    0
  ) {
    throw new Error(
      "Cannot delete this service because it contains child services.",
    );
  }

  await prisma.service.delete({
    where: {
      id,
    },
  });

  return {
    media: {
      imagePublicId:
        service.imagePublicId,

      heroImagePublicId:
        service.heroImagePublicId,
    },
  };
}