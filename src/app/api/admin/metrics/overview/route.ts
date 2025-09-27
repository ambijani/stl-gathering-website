export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";

export async function GET() {
  await requireAdmin();
  await connect();

  // Find the most recent date that has shoe count data
  const mostRecentShoeCountDate = await Gathering.aggregate([
    { $match: { shoeCount: { $exists: true, $ne: [], $not: { $size: 0 } } } },
    { $sort: { date: -1 } },
    { $limit: 1 },
    { $project: { date: 1, _id: 0 } }
  ]);

  const cutoffDate = mostRecentShoeCountDate.length > 0 ? mostRecentShoeCountDate[0].date : null;

  // If no shoe count data exists, return empty arrays
  if (!cutoffDate) {
    return Response.json({ 
      signupsByInterest: [], 
      pairsByDate: [], 
      varoFill: [] 
    });
  }

  // Filter all data to only include dates up to the most recent shoe count date
  const dateFilter = { $lte: cutoffDate };

  const signupsByInterest = await Person.aggregate([
    { $unwind: { path: "$interests", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$interests", count: { $sum: 1 } } },
    { $project: { interest: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);

  const pairsByDate = await Gathering.aggregate([
    { $match: { date: dateFilter } },
    { $unwind: { path: "$shoeCount", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$date", pairs: { $sum: "$shoeCount.qty" } } },
    { $match: { pairs: { $gt: 0 } } }, // Only include dates with pairs > 0
    { $project: { date: "$_id", pairs: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);

  const varoFill = await Gathering.aggregate([
    { $match: { date: dateFilter } },
    { $unwind: { path: "$varos", preserveNullAndEmptyArrays: true } },
    { $project: { date: "$date", cap: { $ifNull: ["$varos.capacity", 0] }, assigned: { $size: { $ifNull: ["$varos.assignedPeople", []] } } } },
    { $group: { _id: "$date", capacity: { $sum: "$cap" }, assigned: { $sum: "$assigned" } } },
    { $project: { date: "$_id", capacity: 1, assigned: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);

  return Response.json({ signupsByInterest, pairsByDate, varoFill });
}