"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { Service } from "@/data/site";

type Props = { service?: Service };

const blank: Service = {
  slug: "",
  name: "",
  shortName: "",
  summary: "",
  description: "",
  image: "",
  heroImage: "/media/hero-services.jpg",
  scope: [],
  process: [],
  applications: [],
  active: true,
  featured: false,
};

const lines = (value?: string[]) => (value ?? []).join("\n");
const parseLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export function ServiceEditor({ service }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Service>(service ? structuredClone(service) : structuredClone(blank));
  const [scope, setScope] = useState(lines(service?.scope));
  const [process, setProcess] = useState(lines(service?.process));
  const [applications, setApplications] = useState(lines(service?.applications));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function patch<K extends keyof Service>(key: K, value: Service[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function upload(file?: File, field: "image" | "heroImage" = "image") {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", "services");
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      patch(field, result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Service = { ...form, scope: parseLines(scope), process: parseLines(process), applications: parseLines(applications) };
      const endpoint = service ? `/api/admin/services/${encodeURIComponent(service.slug)}` : "/api/admin/services";
      const response = await fetch(endpoint, { method: service ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save service.");
      router.push(`/admin/services/${result.service.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save service.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!service || !confirm(`Delete ${service.name}?`)) return;
    const response = await fetch(`/api/admin/services/${encodeURIComponent(service.slug)}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error || "Unable to delete service.");
      return;
    }
    router.push("/admin/services");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-6">
        <section className="card p-6 md:p-7">
          <div className="eyebrow">Service identity</div><h2 className="mt-2 text-xl font-black">Core service content</h2>
          <div className="form-grid mt-6">
            <div className="field"><label>Service name *</label><input required value={form.name} onChange={(e) => patch("name", e.target.value)} /></div>
            <div className="field"><label>Slug</label><input value={form.slug} onChange={(e) => patch("slug", e.target.value)} placeholder="auto-generated if blank" /></div>
            <div className="field"><label>Short name</label><input value={form.shortName ?? ""} onChange={(e) => patch("shortName", e.target.value)} /></div>
            <div className="field span-2"><label>Summary *</label><textarea required value={form.summary} onChange={(e) => patch("summary", e.target.value)} /></div>
            <div className="field span-2"><label>Full description</label><textarea className="!min-h-[180px]" value={form.description ?? ""} onChange={(e) => patch("description", e.target.value)} /></div>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">Delivery structure</div><h2 className="mt-2 text-xl font-black">Scope, process & applications</h2>
          <div className="form-grid mt-6">
            <div className="field"><label>Scope of work — one per line</label><textarea className="!min-h-[220px]" value={scope} onChange={(e) => setScope(e.target.value)} /></div>
            <div className="field"><label>Delivery process — one per line</label><textarea className="!min-h-[220px]" value={process} onChange={(e) => setProcess(e.target.value)} /></div>
            <div className="field span-2"><label>Applications — one per line</label><textarea value={applications} onChange={(e) => setApplications(e.target.value)} /></div>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="card p-6">
          <div className="eyebrow">Service media</div><h2 className="mt-2 text-lg font-black">Images</h2>
          <div className="field mt-5"><label>Card image URL</label><input value={form.image} onChange={(e) => patch("image", e.target.value)} /></div>
          <label className="btn btn-secondary mt-3 w-full cursor-pointer"><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0], "image")} />{uploading ? "Uploading..." : "Upload Card Image"}</label>
          <div className="field mt-5"><label>Hero image URL</label><input value={form.heroImage} onChange={(e) => patch("heroImage", e.target.value)} /></div>
          <label className="btn btn-secondary mt-3 w-full cursor-pointer"><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0], "heroImage")} />Upload Hero Image</label>
        </section>

        <section className="card p-6">
          <div className="eyebrow">Publishing</div><h2 className="mt-2 text-lg font-black">Visibility</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <label className="flex items-center gap-3"><input type="checkbox" checked={form.active !== false} onChange={(e) => patch("active", e.target.checked)} /> Visible on public website</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={form.featured === true} onChange={(e) => patch("featured", e.target.checked)} /> Featured service</label>
          </div>
        </section>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <section className="card p-5"><button disabled={saving} type="submit" className="btn btn-primary w-full">{saving ? "Saving..." : service ? "Save Service Changes" : "Create Service"}</button>{service && <button type="button" onClick={remove} className="mt-3 w-full rounded-md border border-red-200 py-3 text-xs font-extrabold text-red-600 hover:bg-red-50">Delete Service</button>}</section>
      </aside>
    </form>
  );
}
