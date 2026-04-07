import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

export type ReportGathering = {
  title: string;
  date: Date;
  totalShoes: number;
  shoeBreakdown: { size: string; qty: number }[];
};

export type ReportData = {
  monthLabel: string;
  gatherings: ReportGathering[];
};

export async function fetchReportData(month: number, year: number): Promise<ReportData> {
  await connect();

  const firstOfMonth = new Date(year, month, 1);
  const firstOfNext  = new Date(year, month + 1, 1);
  const monthLabel   = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const raw = await Gathering.find({
    date: { $gte: firstOfMonth, $lt: firstOfNext },
  }).sort({ date: 1 }).lean();

  const gatherings: ReportGathering[] = raw.map(g => {
    const shoeBreakdown = (g.shoeCount ?? []).filter((s: { size: string; qty: number }) => s.qty > 0);
    const totalShoes    = shoeBreakdown.reduce((sum: number, s: { size: string; qty: number }) => sum + s.qty, 0);
    return { title: g.title ?? "", date: g.date, totalShoes, shoeBreakdown };
  });

  return { monthLabel, gatherings };
}
