export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; varoId: string }> }) {
  const { id, varoId } = await context.params;
  await connect();

  const body = (await request.json()) as { personIds?: string[]; mode?: "merge" | "replace" };
  const personIds = Array.isArray(body.personIds) ? body.personIds : [];
  const mode = body.mode === "replace" ? "replace" : "merge";

  const g = await Gathering.findById(id);
  if (!g) return new Response("Gathering not found", { status: 404 });

  const v = g.varos.id(varoId);
  if (!v) return new Response("Varo not found", { status: 404 });

  const current = new Set<string>((v.assignedPeople as string[]) ?? []);
  if (mode === "replace") v.assignedPeople = personIds;
  else { for (const pid of personIds) current.add(String(pid)); v.assignedPeople = Array.from(current); }

  await g.save();
  return Response.json({ ok: true, assignedPeople: v.assignedPeople });
}