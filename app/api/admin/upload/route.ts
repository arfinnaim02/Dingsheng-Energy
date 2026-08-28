import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { slugify } from "@/lib/catalog";

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const maxBytes = 12 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "products");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WEBP and PDF files are supported." }, { status: 400 });
  if (file.size > maxBytes) return NextResponse.json({ error: "File is larger than 12 MB." }, { status: 400 });

  const safeKind = kind === "services" ? "services" : kind === "documents" ? "documents" : "products";
  const ext = path.extname(file.name).toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".bin");
  const stem = slugify(path.basename(file.name, path.extname(file.name))) || "upload";
  const filename = `${stem}-${Date.now()}${ext}`;
  const relative = `/uploads/${safeKind}/${filename}`;
  const directory = path.join(process.cwd(), "public", "uploads", safeKind);
  await fs.mkdir(directory, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(directory, filename), bytes);

  return NextResponse.json({ ok: true, url: relative, name: file.name });
}
