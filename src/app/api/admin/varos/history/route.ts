export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";
import Person from "@/models/Person";

export async function GET(request: NextRequest) {
  await requireAdmin();
  await connect();

  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "8"), 20);

  if (!title) return Response.json({ error: "title is required" }, { status: 400 });

  // Find all gatherings that have a varo with this title (case-insensitive)
  const gatherings = await Gathering.find({
    "varos.title": { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  })
    .select("title tags date varos")
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  // Collect all unique person IDs across these gatherings for this varo
  const personIdSet = new Set<string>();
  for (const g of gatherings) {
    const varo = (g.varos as { title: string; assignedPeople?: unknown[] }[]).find(
      v => v.title.toLowerCase() === title.toLowerCase()
    );
    for (const pid of varo?.assignedPeople ?? []) personIdSet.add(String(pid));
  }

  const people = await Person.find({ _id: { $in: Array.from(personIdSet) } })
    .select("name")
    .lean();
  const personMap: Record<string, string> = {};
  for (const p of people) personMap[String(p._id)] = p.name;

  const result = gatherings.map(g => {
    const varo = (g.varos as { title: string; assignedPeople?: unknown[] }[]).find(
      v => v.title.toLowerCase() === title.toLowerCase()
    );
    const assigned = (varo?.assignedPeople ?? []).map(pid => ({
      _id: String(pid),
      name: personMap[String(pid)] ?? String(pid),
    }));
    return {
      date: g.date,
      gatheringTitle: (Array.isArray(g.tags) ? (g.tags as string[]) : (g.title ? [g.title as string] : [])).join(", "),
      assigned,
    };
  });

  return Response.json(result);
}
