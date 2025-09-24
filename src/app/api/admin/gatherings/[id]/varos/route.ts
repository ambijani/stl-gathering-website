export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

type VaroLean = {
  _id?: string;
  title: string;
  description?: string;
  location?: string;
  capacity?: number;
  startTime?: Date;
  endTime?: Date;
  tags: string[];
  assignedPeople: string[];
};

type GatheringLean = {
  _id: string;
  varos?: VaroLean[];
};

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await connect();
  const g = await Gathering.findById(id).lean<GatheringLean | null>();
  if (!g) return new Response("Not found", { status: 404 });
  return Response.json(g.varos ?? []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await connect();

  const body = (await request.json()) as { title?: string; description?: string; location?: string; capacity?: number; startTime?: string | Date; endTime?: string | Date; tags?: string[]; };
  if (!body.title || !body.title.trim()) return new Response("Missing title", { status: 400 });

  const g = await Gathering.findById(id);
  if (!g) return new Response("Not found", { status: 404 });

  const newVaro: VaroLean = {
    title: body.title.trim(),
    description: body.description,
    location: body.location,
    capacity: typeof body.capacity === "number" ? body.capacity : undefined,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    endTime: body.endTime ? new Date(body.endTime) : undefined,
    tags: Array.isArray(body.tags) ? body.tags : [],
    assignedPeople: []
  };

  g.varos.push(newVaro);
  await g.save();

  const saved = await Gathering.findById(id).select('varos').lean<GatheringLean | null>();
  return Response.json(saved?.varos ?? []);
}