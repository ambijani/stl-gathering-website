export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin, isValidObjectId } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

function normalizeTags(doc: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(doc.tags)) {
    doc.tags = typeof doc.title === "string" && doc.title ? [doc.title] : [];
  }
  return doc;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const g = await Gathering.findById(id).lean() as Record<string, unknown> | null;
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(normalizeTags(g));
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const body = (await req.json()) as { tags?: string[]; notes?: string };
  const set: Record<string, unknown> = {};
  if (body.tags !== undefined) set.tags = body.tags;
  if (body.notes !== undefined) set.notes = body.notes;
  if (!Object.keys(set).length) return new Response("nothing to update", { status: 400 });

  const g = await Gathering.findByIdAndUpdate(id, { $set: set }, { new: true }).lean() as Record<string, unknown> | null;
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(normalizeTags(g));
}
