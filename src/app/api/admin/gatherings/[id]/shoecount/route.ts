export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin, isValidObjectId } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await context.params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const body = (await request.json()) as { items?: { size: string; qty: number }[] };
  const items = Array.isArray(body.items) ? body.items : [];
  const cleaned = items.filter((r) => r && typeof r.size === "string").map((r) => ({ size: r.size.trim(), qty: Number(r.qty) || 0 }));

  const g = await Gathering.findById(id);
  if (!g) return new Response("Not found", { status: 404 });

  g.shoeCount = cleaned;
  await g.save();

  return Response.json({ ok: true, shoeCount: g.shoeCount });
}