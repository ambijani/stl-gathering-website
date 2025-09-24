import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

// Infer the element type of the varos array from the Mongoose model
type VaroDoc = NonNullable<(typeof Gathering)["prototype"]["varos"]>[number];

// PATCH: update selected fields on one varo
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; varoId: string }> }
) {
  const { id, varoId } = await context.params;
  await connect();

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const varo = g.varos.id(varoId) as VaroDoc | null;
  if (!varo) return new Response("Varo not found", { status: 404 });

  const body = (await request.json()) as Partial<{
    title: string;
    description?: string;
    location?: string;
    capacity?: number | null;
    startTime?: string | Date | null;
    endTime?: string | Date | null;
    tags?: string[];
  }>;

  if (body.title !== undefined) varo.title = body.title;
  if (body.description !== undefined) varo.description = body.description ?? undefined;
  if (body.location !== undefined) varo.location = body.location ?? undefined;
  if (body.capacity !== undefined) varo.capacity = body.capacity ?? undefined;
  if (body.startTime !== undefined)
    varo.startTime = body.startTime ? new Date(body.startTime) : undefined;
  if (body.endTime !== undefined)
    varo.endTime = body.endTime ? new Date(body.endTime) : undefined;
  if (Array.isArray(body.tags)) varo.tags = body.tags;

  await g.save();
  return Response.json(varo);
}

// DELETE: remove one varo
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; varoId: string }> }
) {
  const { id, varoId } = await context.params;
  await connect();

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const varo = g.varos.id(varoId) as VaroDoc | null;
  if (!varo) return new Response("Varo not found", { status: 404 });

  varo.deleteOne();
  await g.save();

  return Response.json({ ok: true });
}