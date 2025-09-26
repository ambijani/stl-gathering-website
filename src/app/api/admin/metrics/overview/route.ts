export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";

export async function GET() {
  await requireAdmin();
  await connect();

  const signupsByInterest = await Person.aggregate([
    { $unwind: { path: "$interests", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$interests", count: { $sum: 1 } } },
    { $project: { interest: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);

  const pairsByDate = await Gathering.aggregate([
    { $unwind: { path: "$shoeCount", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$date", pairs: { $sum: "$shoeCount.qty" } } },
    { $project: { date: "$_id", pairs: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);

  const varoFill = await Gathering.aggregate([
    { $unwind: { path: "$varos", preserveNullAndEmptyArrays: true } },
    { $project: { date: "$date", cap: { $ifNull: ["$varos.capacity", 0] }, assigned: { $size: { $ifNull: ["$varos.assignedPeople", []] } } } },
    { $group: { _id: "$date", capacity: { $sum: "$cap" }, assigned: { $sum: "$assigned" } } },
    { $project: { date: "$_id", capacity: 1, assigned: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);

  return Response.json({ signupsByInterest, pairsByDate, varoFill });
}