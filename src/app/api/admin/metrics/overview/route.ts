export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connect();

    // Find the most recent date that has shoe count data
    const mostRecentShoeCountDate = await Gathering.aggregate([
      { $match: { shoeCount: { $exists: true, $ne: [], $not: { $size: 0 } } } },
      { $sort: { date: -1 } },
      { $limit: 1 },
      { $project: { date: 1, _id: 0 } }
    ]);

    const cutoffDate = mostRecentShoeCountDate.length > 0 ? mostRecentShoeCountDate[0].date : null;

    if (!cutoffDate) {
      return Response.json({ signupsByInterest: [], pairsByDate: [], varoFill: [] });
    }

    const cutoffDateObj = new Date(cutoffDate);
    const dateFilter = { $lte: cutoffDateObj };

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
      { $match: { pairs: { $gt: 0 } } },
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

    const varoFrequency = await Gathering.aggregate([
      { $unwind: "$varos" },
      { $unwind: "$varos.assignedPeople" },
      { $group: { _id: "$varos.assignedPeople", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 40 },
      { $lookup: { from: "people", localField: "_id", foreignField: "_id", as: "person" } },
      { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ["$person.name", "Unknown"] }, count: 1, _id: 0 } },
    ]);

    return Response.json({ signupsByInterest, pairsByDate, varoFill, varoFrequency });
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json(
      { error: "Failed to fetch analytics data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
