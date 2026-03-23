export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  await connect();

  const g = await Gathering.findById(id).lean();
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(g);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  await connect();

  const body = (await req.json()) as { title?: string; notes?: string };
  const set: Record<string, unknown> = {};
  if (body.title) set.title = body.title;
  if (body.notes !== undefined) set.notes = body.notes;
  if (!Object.keys(set).length) return new Response("nothing to update", { status: 400 });

  const g = await Gathering.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(g);
}
