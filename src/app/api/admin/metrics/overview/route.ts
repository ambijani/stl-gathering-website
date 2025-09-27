export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";

export async function GET() {
  try {
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

    console.log('Analytics API - Cutoff date found:', cutoffDate);

    // If no shoe count data exists, return empty arrays
    if (!cutoffDate) {
      console.log('Analytics API - No cutoff date found, returning empty arrays');
      return Response.json({ 
        signupsByInterest: [], 
        pairsByDate: [], 
        varoFill: [] 
      });
    }

    // Ensure cutoffDate is properly formatted as a Date object
    const cutoffDateObj = new Date(cutoffDate);
    console.log('Analytics API - Using cutoff date:', cutoffDateObj.toISOString());

    // Filter all data to only include dates up to the most recent shoe count date
    const dateFilter = { $lte: cutoffDateObj };

    const signupsByInterest = await Person.aggregate([
      { $unwind: { path: "$interests", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$interests", count: { $sum: 1 } } },
      { $project: { interest: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    console.log('Analytics API - Signups by interest count:', signupsByInterest.length);

    const pairsByDate = await Gathering.aggregate([
      { $match: { date: dateFilter } },
      { $unwind: { path: "$shoeCount", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$date", pairs: { $sum: "$shoeCount.qty" } } },
      { $match: { pairs: { $gt: 0 } } }, // Only include dates with pairs > 0
      { $project: { date: "$_id", pairs: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    console.log('Analytics API - Pairs by date count:', pairsByDate.length);

    // Filter pairsByDate to only include dates up to cutoff date (client-side fallback)
    const filteredPairsByDate = pairsByDate.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate <= cutoffDateObj;
    });

    console.log('Analytics API - Filtered pairs by date count:', filteredPairsByDate.length);

    const varoFill = await Gathering.aggregate([
      { $match: { date: dateFilter } },
      { $unwind: { path: "$varos", preserveNullAndEmptyArrays: true } },
      { $project: { date: "$date", cap: { $ifNull: ["$varos.capacity", 0] }, assigned: { $size: { $ifNull: ["$varos.assignedPeople", []] } } } },
      { $group: { _id: "$date", capacity: { $sum: "$cap" }, assigned: { $sum: "$assigned" } } },
      { $project: { date: "$_id", capacity: 1, assigned: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    // Filter varoFill to only include dates up to cutoff date (client-side fallback)
    const filteredVaroFill = varoFill.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate <= cutoffDateObj;
    });

    console.log('Analytics API - Varo fill count:', varoFill.length);
    console.log('Analytics API - Filtered varo fill count:', filteredVaroFill.length);

    return Response.json({ 
      signupsByInterest, 
      pairsByDate: filteredPairsByDate, 
      varoFill: filteredVaroFill 
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return Response.json(
      { error: 'Failed to fetch analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}