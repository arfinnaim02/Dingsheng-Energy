"use client";

import { useMemo, useState } from "react";

import {
  buildTree,
  type TreeNode,
} from "@/lib/categoryTree";

export type ProductCategoryTreeItem = {
  id: string;
  name: string;
  slug: string;

  shortName: string | null;
  summary: string | null;
  description: string | null;

  image: string | null;
  heroImage: string | null;

  parentId: string | null;
  position: number;
  isActive: boolean;

  productCount: number;
  childCount: number;
};

type Props = {
  categories: ProductCategoryTreeItem[];

  selectedSlugs: string[];
  primarySlug: string;

  onToggle: (slug: string) => void;
  onPrimaryChange: (slug: string) => void;
};

export function ProductCategoryTreePicker({
  categories,
  selectedSlugs,
  primarySlug,
  onToggle,
  onPrimaryChange,
}: Props) {
  const [query, setQuery] = useState("");

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(),
  );

  const tree = useMemo(
    () => buildTree(categories),
    [categories],
  );

  const normalizedQuery =
    query.trim().toLowerCase();

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function expandAll() {
    setExpanded(
      new Set(
        categories.map(
          (category) => category.id,
        ),
      ),
    );
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function nodeMatches(
    node: TreeNode<ProductCategoryTreeItem>,
  ): boolean {
    if (!normalizedQuery) {
      return true;
    }

    if (
      node.name
        .toLowerCase()
        .includes(normalizedQuery) ||
      node.slug
        .toLowerCase()
        .includes(normalizedQuery) ||
      node.summary
        ?.toLowerCase()
        .includes(normalizedQuery)
    ) {
      return true;
    }

    return node.children.some(
      nodeMatches,
    );
  }

  function renderNode(
    node: TreeNode<ProductCategoryTreeItem>,
  ) {
    if (!nodeMatches(node)) {
      return null;
    }

    const selected =
      selectedSlugs.includes(node.slug);

    const hasChildren =
      node.children.length > 0;

    const open = normalizedQuery
      ? true
      : expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-start gap-3 rounded-lg border p-3 transition ${
            selected
              ? "border-[#0a9c63] bg-[#eff9f4]"
              : "border-[#dfe8e4] bg-white hover:bg-[#fafcfb]"
          }`}
          style={{
            marginLeft: `${
              Math.max(
                0,
                node.depth - 1,
              ) * 18
            }px`,
          }}
        >
          <button
            type="button"
            onClick={() =>
              hasChildren &&
              toggleExpanded(node.id)
            }
            className="mt-0.5 w-5 shrink-0 text-xs font-black text-[#627780]"
            aria-label={
              hasChildren
                ? "Toggle child categories"
                : "Leaf category"
            }
          >
            {hasChildren
              ? open
                ? "−"
                : "+"
              : "·"}
          </button>

          <input
            type="checkbox"
            className="mt-1"
            checked={selected}
            onChange={() =>
              onToggle(node.slug)
            }
          />

          <button
            type="button"
            onClick={() =>
              onToggle(node.slug)
            }
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-[#17313d]">
                {node.name}
              </strong>

              <span className="text-[10px] font-black uppercase tracking-wide text-[#71858d]">
                Level {node.depth}
              </span>

              {node.childCount > 0 && (
                <span className="text-[10px] font-bold text-[#71858d]">
                  {node.childCount} children
                </span>
              )}

              <span className="text-[10px] font-bold text-[#71858d]">
                {node.productCount} products
              </span>

              {!node.isActive && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-600">
                  Hidden
                </span>
              )}
            </div>

            {node.summary && (
              <span className="mt-1 block text-xs leading-5 text-[#71838b]">
                {node.summary}
              </span>
            )}
          </button>

          {selected && (
            <label className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#d7e4df] bg-white px-2 py-1.5 text-[10px] font-black text-[#17313d]">
              <input
                type="radio"
                name="primary-product-category"
                checked={
                  primarySlug ===
                  node.slug
                }
                onChange={() =>
                  onPrimaryChange(
                    node.slug,
                  )
                }
              />

              Primary
            </label>
          )}
        </div>

        {hasChildren &&
          open &&
          node.children.map(
            (child) =>
              renderNode(child),
          )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Search product categories..."
          className="min-w-[220px] flex-1 rounded-md border border-[#d8e4df] px-3 py-2.5 text-sm outline-none focus:border-[#0a9c63]"
        />

        <button
          type="button"
          onClick={expandAll}
          className="btn btn-secondary"
        >
          Expand all
        </button>

        <button
          type="button"
          onClick={collapseAll}
          className="btn btn-secondary"
        >
          Collapse all
        </button>
      </div>

      <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {tree.length ? (
          tree.map(
            (node) =>
              renderNode(node),
          )
        ) : (
          <div className="rounded-lg border border-dashed border-[#d7e4df] p-5 text-sm text-[#71838b]">
            No product categories
            are available.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-[#dfe8e4] bg-[#fafcfb] p-3 text-xs leading-5 text-[#627780]">
        Assign a product to the most
        specific relevant category.
        Parent category pages will
        later include products from
        their descendant categories
        automatically. Select multiple
        categories only when the product
        genuinely belongs to multiple
        branches.
      </div>
    </div>
  );
}