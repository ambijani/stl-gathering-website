export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { NextRequest } from "next/server";
import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";
import mongoose from "mongoose";

// POST { fromId, toId }
// Replaces all Varo assignments of `fromId` with `toId` across every gathering,
// deduplicates if both were already on the same Varo, then deletes `fromId`.
export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connect();

  const { fromId, toId } = (await req.json()) as { fromId?: string; toId?: string };
  if (!fromId || !toId) return new Response("fromId and toId required", { status: 400 });
  if (fromId === toId)  return new Response("fromId and toId must be different", { status: 400 });

  const fromOid = new mongoose.Types.ObjectId(fromId);
  const toOid   = new mongoose.Types.ObjectId(toId);

  // Verify both people exist
  const [from, to] = await Promise.all([
    Person.findById(fromOid).lean(),
    Person.findById(toOid).lean(),
  ]);
  if (!from) return new Response("fromId not found", { status: 404 });
  if (!to)   return new Response("toId not found",   { status: 404 });

  // Find every gathering that has fromId in any varo's assignedPeople
  const gatherings = await Gathering.find({ "varos.assignedPeople": fromOid });

  let varosUpdated = 0;

  for (const g of gatherings) {
    let changed = false;
    for (const varo of g.varos) {
      const ids = (varo.assignedPeople as mongoose.Types.ObjectId[]);
      const hasFrom = ids.some(id => id.equals(fromOid));
      if (!hasFrom) continue;

      const hasTo   = ids.some(id => id.equals(toOid));
      if (hasTo) {
        // Both present — just remove the fromId (dedup)
        varo.assignedPeople = ids.filter(id => !id.equals(fromOid)) as typeof varo.assignedPeople;
      } else {
        // Replace fromId with toId
        varo.assignedPeople = ids.map(id => id.equals(fromOid) ? toOid : id) as typeof varo.assignedPeople;
      }
      changed = true;
      varosUpdated++;
    }
    if (changed) await g.save();
  }

  // Delete the old person
  await Person.findByIdAndDelete(fromOid);

  return Response.json({
    ok: true,
    from: (from as unknown as { name: string }).name,
    to:   (to   as unknown as { name: string }).name,
    varosUpdated,
    gatheringsAffected: gatherings.length,
  });
}
