import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";
import Photo from "@/models/Photo";

export type ReportPhoto = {
  cid: string;
  contentType: string;
  data: Buffer;
  filename: string;
};

export type ReportGathering = {
  title: string;
  date: Date;
  totalShoes: number;
  shoeBreakdown: { size: string; qty: number }[];
  photos: ReportPhoto[];
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

  const gatherings: ReportGathering[] = raw.map(g => {
    const shoeBreakdown = (g.shoeCount ?? []).filter((s: { size: string; qty: number }) => s.qty > 0);
    const totalShoes    = shoeBreakdown.reduce((sum: number, s: { size: string; qty: number }) => sum + s.qty, 0);
    const photos        = photosByGathering[(g._id as { toString(): string }).toString()] ?? [];
    return { title: g.title ?? "", date: g.date, totalShoes, shoeBreakdown, photos };
  });

  return { monthLabel, gatherings };
}
