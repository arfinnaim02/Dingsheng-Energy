import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { ProductCategory } from "@/data/site";
import { isAdminSession } from "@/lib/adminAuth";
import { getCategories, updateCategories } from "@/lib/catalog";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: await getCategories() });
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { categories?: ProductCategory[] };
    if (!Array.isArray(body.categories) || !body.categories.length) {
      return NextResponse.json({ error: "At least one category is required." }, { status: 400 });
    }
    await updateCategories(body.categories);
    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save categories." }, { status: 400 });
  }
}
