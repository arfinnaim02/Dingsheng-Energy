"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProductCategory } from "@/data/site";

export function CategoryEditor({ initial }: { initial: ProductCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>(structuredClone(initial));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(index: number, patch: Partial<ProductCategory>) {
    setCategories((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error || "Unable to save categories.");
      return;
    }
    setMessage("Categories saved successfully.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {categories.map((category, index) => (
        <section className="card p-6 md:p-7" key={category.slug}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow">Product system {String(index + 1).padStart(2, "0")}</div><h2 className="mt-2 text-xl font-black">{category.name}</h2></div><span className="status">{category.slug}</span></div>
          <div className="form-grid mt-6">
            <div className="field"><label>Name</label><input value={category.name} onChange={(e) => update(index, { name: e.target.value })} /></div>
            <div className="field"><label>Short name</label><input value={category.shortName ?? ""} onChange={(e) => update(index, { shortName: e.target.value })} /></div>
            <div className="field span-2"><label>Summary</label><textarea value={category.summary} onChange={(e) => update(index, { summary: e.target.value })} /></div>
            <div className="field span-2"><label>Description</label><textarea className="!min-h-[150px]" value={category.description} onChange={(e) => update(index, { description: e.target.value })} /></div>
            <div className="field"><label>Card image URL</label><input value={category.image} onChange={(e) => update(index, { image: e.target.value })} /></div>
            <div className="field"><label>Hero image URL</label><input value={category.heroImage} onChange={(e) => update(index, { heroImage: e.target.value })} /></div>
            <div className="field span-2"><label>Product groups — one per line</label><textarea value={category.groups.join("\n")} onChange={(e) => update(index, { groups: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></div>
          </div>
        </section>
      ))}
      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dfe8e4] bg-white/95 p-4 shadow-xl backdrop-blur"><span className="text-sm text-[#627780]">{message}</span><button disabled={saving} className="btn btn-primary">{saving ? "Saving..." : "Save Category Changes"}</button></div>
    </form>
  );
}
