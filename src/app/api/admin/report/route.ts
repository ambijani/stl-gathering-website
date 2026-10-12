export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { fetchReportData, isValidMonthYear, lastMonth } from "@/lib/reportData";
import { sendReport } from "@/lib/monthlyReport";

function invalidMonthYear() {
  return Response.json({ error: "month must be 0-11 and year a four-digit number" }, { status: 400 });
}

// GET /api/admin/report?month=2&year=2026  → preview data (no email sent)
export async function GET(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const fallback = lastMonth();
  const month = searchParams.has("month") ? Number(searchParams.get("month")) : fallback.month;
  const year  = searchParams.has("year")  ? Number(searchParams.get("year"))  : fallback.year;
  if (!isValidMonthYear(month, year)) return invalidMonthYear();

  try {
    const data = await fetchReportData(month, year);
    // Preview doesn't render photos; sending their raw bytes blows past Vercel's response size limit.
    const gatherings = data.gatherings.map(g => ({
      ...g,
      photos: g.photos.map(p => ({ cid: p.cid, filename: p.filename, contentType: p.contentType })),
    }));
    return Response.json({ ...data, gatherings });
  } catch (error) {
    console.error("Report preview error:", error);
    return Response.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

// POST /api/admin/report  body: { month: number, year: number, extraRecipients?: string[] } → send email
export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { month, year, extraRecipients } = await req.json();
    if (!isValidMonthYear(Number(month), Number(year))) return invalidMonthYear();
    const result = await sendReport(Number(month), Number(year), extraRecipients ?? []);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Report send error:", error);
    return Response.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
