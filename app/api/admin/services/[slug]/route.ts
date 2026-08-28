import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { Service } from "@/data/site";
import { isAdminSession } from "@/lib/adminAuth";
import { deleteService, getService, upsertService } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  const service = await getService(slug);
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  try {
    const body = (await request.json()) as Service;
    const service = await upsertService(body, slug);
    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    return NextResponse.json({ ok: true, service });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update service." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await context.params;
  await deleteService(slug);
  revalidatePath("/");
  revalidatePath("/services");
  return NextResponse.json({ ok: true });
}
