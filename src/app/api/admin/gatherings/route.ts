export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

function normalizeTags(doc: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(doc.tags)) {
    doc.tags = typeof doc.title === "string" && doc.title ? [doc.title] : [];
  }
  return doc;
}

export async function GET() {
  await requireAdmin();
  await connect();
  const rows = await Gathering.find().sort({ date: 1 }).lean() as Record<string, unknown>[];
  return Response.json(rows.map(normalizeTags));
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  await connect();
  const body = (await request.json()) as { tags?: string[]; date?: string | Date; notes?: string };

  if (!body.date) return new Response("Missing date", { status: 400 });
  const d = new Date(body.date);
  if (isNaN(d.getTime())) return new Response("Invalid date", { status: 400 });

  const doc = await Gathering.create({ tags: body.tags ?? [], date: d, notes: body.notes, varos: [], shoeCount: [] });
  return Response.json(doc);
}