export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export async function GET() {
  await requireAdmin();
  await connect();
  const rows = await Gathering.find().sort({ date: 1 }).lean();
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  await connect();
  const body = (await request.json()) as { title?: string; date?: string | Date; notes?: string };

  if (!body.date) return new Response("Missing date", { status: 400 });
  const d = new Date(body.date);
  if (isNaN(d.getTime())) return new Response("Invalid date", { status: 400 });

  const doc = await Gathering.create({ title: body.title, date: d, notes: body.notes, varos: [], shoeCount: [] });
  return Response.json(doc);
}