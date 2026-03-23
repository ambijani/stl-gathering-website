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

  const { title } = (await req.json()) as { title?: string };
  if (!title) return new Response("title required", { status: 400 });

  const g = await Gathering.findByIdAndUpdate(id, { $set: { title } }, { new: true }).lean();
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(g);
}
