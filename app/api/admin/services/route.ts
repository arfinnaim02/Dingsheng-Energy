import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { Service } from "@/data/site";
import { isAdminSession } from "@/lib/adminAuth";
import { getServices, upsertService } from "@/lib/catalog";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ services: await getServices({ activeOnly: false }) });
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Service;
    if (!body.name?.trim()) return NextResponse.json({ error: "Service name is required." }, { status: 400 });
    const service = await upsertService(body);
    revalidatePath("/");
    revalidatePath("/services");
    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save service." }, { status: 400 });
  }
}
