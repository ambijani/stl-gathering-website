export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";
import { computeWindowStats, EXCLUDED_VARO_TITLES } from "@/lib/varoDiversity";

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
      { $group: { _id: "$_id", date: { $first: "$date" }, pairs: { $sum: "$shoeCount.qty" } } },
      { $match: { pairs: { $gt: 0 } } },
      { $project: { date: 1, pairs: 1, _id: 0 } },
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

    const shoeCountByMonth = await Gathering.aggregate([
      // Sum shoe count per gathering
      { $unwind: "$shoeCount" },
      { $match: { "shoeCount.qty": { $gt: 0 } } },
      {
        $group: {
          _id: { gatheringId: "$_id", year: { $year: "$date" }, month: { $month: "$date" } },
          gatheringTotal: { $sum: "$shoeCount.qty" },
        },
      },
      // Average those totals across gatherings in the same month
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          avg: { $avg: "$gatheringTotal" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $dateToString: {
              format: "%Y-%m",
              date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: 1 } },
            },
          },
          avg: { $round: ["$avg", 0] },
        },
      },
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const inactiveMembers = await Person.aggregate([
      {
        $lookup: {
          from: "gatherings",
          let: { personId: "$_id" },
          pipeline: [
            { $match: { date: { $lte: now } } },
            { $unwind: "$varos" },
            { $match: { $expr: { $in: ["$$personId", "$varos.assignedPeople"] } } },
            { $group: { _id: null, lastDate: { $max: "$date" } } },
          ],
          as: "assignments",
        },
      },
      {
        $project: {
          name: 1,
          lastVaro: { $arrayElemAt: ["$assignments.lastDate", 0] },
        },
      },
      {
        $match: {
          $or: [
            { lastVaro: { $exists: false } },
            { lastVaro: null },
            { lastVaro: { $lt: thirtyDaysAgo } },
          ],
        },
      },
      { $sort: { lastVaro: 1 } },
    ]);

    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const excludedTitles = [...EXCLUDED_VARO_TITLES];

    const distinctTitles = await Gathering.aggregate([
      { $match: { date: { $lte: now } } },
      { $unwind: "$varos" },
      { $match: { "varos.title": { $nin: excludedTitles } } },
      { $group: { _id: "$varos.title" } },
    ]);
    const distinctTitleCount = distinctTitles.length;

    const personVaroHistory = await Gathering.aggregate([
      { $match: { date: { $lte: now } } },
      { $unwind: "$varos" },
      { $match: { "varos.title": { $nin: excludedTitles } } },
      { $unwind: "$varos.assignedPeople" },
      { $project: { personId: "$varos.assignedPeople", title: "$varos.title", date: "$date" } },
      { $group: { _id: "$personId", assignments: { $push: { title: "$title", date: "$date" } } } },
    ]);

    const diversityPeople = await Person.find(
      { _id: { $in: personVaroHistory.map(h => h._id) } },
      { name: 1 }
    );
    const nameById = new Map(diversityPeople.map(p => [p._id.toString(), p.name]));

    const varoDiversity = personVaroHistory.map(h => {
      const assignments = h.assignments as { title: string; date: Date }[];
      const recentAssignments = assignments.filter(a => a.date >= sixMonthsAgo);
      return {
        _id: h._id.toString(),
        name: nameById.get(h._id.toString()) ?? "Unknown",
        lifetime: computeWindowStats(assignments, distinctTitleCount),
        recent: computeWindowStats(recentAssignments, distinctTitleCount),
      };
    });

    return Response.json({ signupsByInterest, pairsByDate, varoFill, varoFrequency, shoeCountByMonth, inactiveMembers, varoDiversity });
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
