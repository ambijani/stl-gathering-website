export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin, isValidObjectId } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

type VaroDoc = NonNullable<(typeof Gathering)["prototype"]["varos"]>[number];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; varoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id, varoId } = await context.params;
  if (!isValidObjectId(id) || !isValidObjectId(varoId)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const varo = g.varos.id(varoId) as VaroDoc | null;
  if (!varo) return new Response("Varo not found", { status: 404 });

  const body = (await request.json()) as Partial<{ title: string; description?: string; capacity?: number | null }>;

  if (body.title !== undefined) varo.title = body.title;
  if (body.description !== undefined) varo.description = body.description ?? undefined;
  if (body.capacity !== undefined) varo.capacity = body.capacity ?? undefined;

  await g.save();
  return Response.json(varo);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string; varoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id, varoId } = await context.params;
  if (!isValidObjectId(id) || !isValidObjectId(varoId)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const varo = g.varos.id(varoId) as VaroDoc | null;
  if (!varo) return new Response("Varo not found", { status: 404 });

  varo.deleteOne();
  await g.save();

  return Response.json({ ok: true });
}
