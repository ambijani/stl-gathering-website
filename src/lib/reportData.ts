import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";
import Photo from "@/models/Photo";

type ReportPhoto = {
  cid: string;
  contentType: string;
  data: Buffer;
  filename: string;
};

export type ReportGathering = {
  title: string;
  date: Date;
  totalShoes: number;
  hasHappened: boolean;
  shoeBreakdown: { size: string; qty: number }[];
  photos: ReportPhoto[];
};

export type ReportData = {
  monthLabel: string;
  gatherings: ReportGathering[];
};

/** The month before `now`. Built from a Date so January rolls back to December of the prior year. */
export function lastMonth(now: Date = new Date()): { month: number; year: number } {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: d.getMonth(), year: d.getFullYear() };
}

/** month is 0-based (0 = January), as in Date. Rejects NaN and out-of-range values. */
export function isValidMonthYear(month: number, year: number): boolean {
  return Number.isInteger(month) && month >= 0 && month <= 11 && Number.isInteger(year) && year >= 2000 && year <= 9999;
}

export async function fetchReportData(month: number, year: number): Promise<ReportData> {
  await connect();

  const firstOfMonth = new Date(year, month, 1);
  const firstOfNext  = new Date(year, month + 1, 1);
  const monthLabel   = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const raw = await Gathering.find({
    date: { $gte: firstOfMonth, $lt: firstOfNext },
  }).sort({ date: 1 }).lean();

  const gatheringIds = raw.map(g => g._id);
  const rawPhotos = await Photo.find({ gatheringId: { $in: gatheringIds } }).lean();

  const photosByGathering: Record<string, ReportPhoto[]> = {};
  for (const p of rawPhotos) {
    const key = p.gatheringId.toString();
    if (!photosByGathering[key]) photosByGathering[key] = [];
    photosByGathering[key].push({
      cid: `photo_${(p._id as { toString(): string }).toString()}`,
      contentType: p.contentType,
      data: Buffer.isBuffer(p.data) ? p.data : Buffer.from((p.data as { buffer: ArrayBuffer }).buffer),
      filename: p.filename,
    });
  }

  const now = new Date();
  const gatherings: ReportGathering[] = raw.map(g => {
    const shoeBreakdown = (g.shoeCount ?? []).filter((s: { size: string; qty: number }) => s.qty > 0);
    const totalShoes    = shoeBreakdown.reduce((sum: number, s: { size: string; qty: number }) => sum + s.qty, 0);
    const photos        = photosByGathering[(g._id as { toString(): string }).toString()] ?? [];
    const tags = Array.isArray(g.tags) ? (g.tags as string[]) : (g.title ? [g.title as string] : []);
    return { title: tags.join(", ") || "Gathering", date: g.date, totalShoes, hasHappened: g.date <= now, shoeBreakdown, photos };
  });

  return { monthLabel, gatherings };
}
