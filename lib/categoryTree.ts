export const MAX_TREE_DEPTH = 9;

export type TreeSource = {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
};

export type TreeNode<T extends TreeSource> = T & {
  children: TreeNode<T>[];
  depth: number;
};

function sortNodes<T extends TreeSource>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );
}

export function buildTree<T extends TreeSource>(
  items: T[],
): TreeNode<T>[] {
  const byParent = new Map<string | null, T[]>();

  for (const item of items) {
    const siblings = byParent.get(item.parentId) ?? [];
    siblings.push(item);
    byParent.set(item.parentId, siblings);
  }

  const visit = (
    parentId: string | null,
    depth: number,
    path: Set<string>,
  ): TreeNode<T>[] => {
    const children = sortNodes(byParent.get(parentId) ?? []);

    return children
      .filter((item) => !path.has(item.id))
      .map((item) => {
        const nextPath = new Set(path);
        nextPath.add(item.id);

        return {
          ...item,
          depth,
          children: visit(item.id, depth + 1, nextPath),
        };
      });
  };

  return visit(null, 1, new Set());
}

export function flattenTree<T extends TreeSource>(
  tree: TreeNode<T>[],
): TreeNode<T>[] {
  return tree.flatMap((node) => [
    node,
    ...flattenTree(node.children),
  ]);
}

export function getDescendantIds<T extends TreeSource>(
  items: T[],
  rootId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>();

  for (const item of items) {
    if (!item.parentId) continue;
    const children = childrenByParent.get(item.parentId) ?? [];
    children.push(item.id);
    childrenByParent.set(item.parentId, children);
  }

  const result = new Set<string>();
  const stack = [...(childrenByParent.get(rootId) ?? [])];

  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }

  return result;
}

export function getAncestorChain<T extends TreeSource>(
  items: T[],
  id: string,
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const result: T[] = [];
  const visited = new Set<string>();

  let current = byId.get(id);

  while (current?.parentId) {
    if (visited.has(current.parentId)) {
      throw new Error("A category cycle was detected.");
    }

    visited.add(current.parentId);
    const parent = byId.get(current.parentId);
    if (!parent) break;

    result.unshift(parent);
    current = parent;
  }

  return result;
}

export function getNodeDepth<T extends TreeSource>(
  items: T[],
  id: string,
): number {
  return getAncestorChain(items, id).length + 1;
}

export function getSubtreeHeight<T extends TreeSource>(
  items: T[],
  rootId: string,
): number {
  const childrenByParent = new Map<string, string[]>();

  for (const item of items) {
    if (!item.parentId) continue;
    const children = childrenByParent.get(item.parentId) ?? [];
    children.push(item.id);
    childrenByParent.set(item.parentId, children);
  }

  const visit = (id: string, path: Set<string>): number => {
    if (path.has(id)) {
      throw new Error("A category cycle was detected.");
    }

    const nextPath = new Set(path);
    nextPath.add(id);
    const children = childrenByParent.get(id) ?? [];

    if (!children.length) return 1;

    return 1 + Math.max(...children.map((childId) => visit(childId, nextPath)));
  };

  return visit(rootId, new Set());
}

export function validateParentChange<T extends TreeSource>(
  items: T[],
  nodeId: string | null,
  parentId: string | null,
): void {
  if (!parentId) {
    if (nodeId) {
      const subtreeHeight = getSubtreeHeight(items, nodeId);
      if (subtreeHeight > MAX_TREE_DEPTH) {
        throw new Error(`Maximum tree depth is ${MAX_TREE_DEPTH} levels.`);
      }
    }
    return;
  }

  const parent = items.find((item) => item.id === parentId);
  if (!parent) {
    throw new Error("Selected parent no longer exists.");
  }

  if (nodeId && parentId === nodeId) {
    throw new Error("An item cannot be its own parent.");
  }

  if (nodeId) {
    const descendants = getDescendantIds(items, nodeId);
    if (descendants.has(parentId)) {
      throw new Error("Cannot move an item inside one of its descendants.");
    }
  }

  const parentDepth = getNodeDepth(items, parentId);
  const subtreeHeight = nodeId ? getSubtreeHeight(items, nodeId) : 1;

  if (parentDepth + subtreeHeight > MAX_TREE_DEPTH) {
    throw new Error(`Maximum tree depth is ${MAX_TREE_DEPTH} levels.`);
  }
}

export function getBreadcrumbs<T extends TreeSource>(
  items: T[],
  id: string,
): T[] {
  const current = items.find((item) => item.id === id);
  if (!current) return [];
  return [...getAncestorChain(items, id), current];
}
