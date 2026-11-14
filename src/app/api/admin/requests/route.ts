export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";
import Person from "@/models/Person";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connect();

  const gatherings = await Gathering.find({ "varos.requests.0": { $exists: true } })
    .lean<{ _id: object; title?: string; tags?: string[]; date: Date; varos: { _id: object; title: string; assignedPeople?: object[]; requests?: { personId: object; requestedAt: Date }[] }[] }[]>();

  const personIds = new Set<string>();
  for (const g of gatherings) {
    for (const v of g.varos) {
      for (const r of v.requests ?? []) personIds.add(r.personId.toString());
    }
  }
  const people = await Person.find({ _id: { $in: [...personIds] } }).select("name").lean<{ _id: object; name: string }[]>();
  const nameById = new Map(people.map(p => [p._id.toString(), p.name]));

  const requests: { personName: string; personId: string; gatheringId: string; gatheringTitle: string; gatheringDate: string; varoId: string; varoTitle: string; requestedAt: string }[] = [];
  for (const g of gatherings) {
    for (const v of g.varos) {
      const assignedIds = new Set((v.assignedPeople ?? []).map(p => p.toString()));
      for (const r of v.requests ?? []) {
        const personId = r.personId.toString();
        if (assignedIds.has(personId)) continue;
        requests.push({
          personName: nameById.get(personId) ?? "Unknown",
          personId,
          gatheringId: g._id.toString(),
          gatheringTitle: (Array.isArray(g.tags) ? g.tags : (g.title ? [g.title] : [])).join(", "),
          gatheringDate: g.date.toISOString(),
          varoId: v._id.toString(),
          varoTitle: v.title,
          requestedAt: r.requestedAt.toISOString(),
        });
      }
    }
  }

  requests.sort((a, b) => a.gatheringDate.localeCompare(b.gatheringDate));

  return Response.json({ requests });
}
