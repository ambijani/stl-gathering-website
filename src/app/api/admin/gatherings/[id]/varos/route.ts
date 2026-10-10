export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin, isValidObjectId } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

type VaroDoc = NonNullable<(typeof Gathering)["prototype"]["varos"]>[number];
type GatheringWithVaros = {
  varos?: VaroDoc[];
  [key: string]: unknown;
};

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await context.params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();
  const g = await Gathering.findById(id).lean() as GatheringWithVaros | null;
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(g.varos ?? []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await context.params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const body = (await request.json()) as { title?: string; description?: string; capacity?: number };
  if (!body.title || !body.title.trim()) return new Response("Missing title", { status: 400 });

  const g = await Gathering.findById(id);
  if (!g) return new Response("Not found", { status: 404 });

  const newVaro = {
    title: body.title.trim(),
    description: body.description,
    capacity: typeof body.capacity === "number" ? body.capacity : undefined,
    assignedPeople: []
  } as unknown as VaroDoc;

  g.varos.push(newVaro);
  await g.save();

  const saved = await Gathering.findById(id).lean() as GatheringWithVaros | null;
  return Response.json(saved?.varos ?? []);
}
