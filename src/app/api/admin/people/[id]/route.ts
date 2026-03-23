export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  await connect();

  const body = (await req.json()) as { name?: string; phone?: string; interests?: string[] };
  const set: Record<string, unknown> = {};
  if (body.name?.trim())               set.name      = body.name.trim();
  if (body.phone !== undefined)        set.phone     = body.phone;
  if (Array.isArray(body.interests))   set.interests = body.interests;

  const doc = await Person.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  if (!doc) return new Response("Not found", { status: 404 });
  return Response.json(doc);
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  await connect();

  const doc = await Person.findByIdAndDelete(id).lean();
  if (!doc) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
