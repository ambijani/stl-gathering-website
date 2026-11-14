export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin, isValidObjectId } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; varoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id, varoId } = await context.params;
  if (!isValidObjectId(id) || !isValidObjectId(varoId)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const body = (await request.json()) as { personId?: string };
  if (!body.personId || !isValidObjectId(body.personId)) return new Response("Invalid person ID", { status: 400 });

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const v = g.varos.id(varoId);
  if (!v) return new Response("Varo not found", { status: 404 });

  v.requests = ((v.requests as { personId: { toString(): string } }[]) ?? [])
    .filter(r => r.personId?.toString() !== body.personId) as typeof v.requests;

  await g.save();
  return Response.json({ ok: true });
}
