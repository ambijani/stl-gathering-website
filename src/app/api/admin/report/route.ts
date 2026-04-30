export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { fetchReportData } from "@/lib/reportData";
import { sendReport } from "@/app/api/cron/monthly-report/route";

// GET /api/admin/report?month=2&year=2026  → preview data (no email sent)
export async function GET(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const now   = new Date();
  const month = searchParams.has("month") ? Number(searchParams.get("month")) : now.getMonth() - 1;
  const year  = searchParams.has("year")  ? Number(searchParams.get("year"))  : now.getFullYear();

  try {
    const data = await fetchReportData(month, year);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

// POST /api/admin/report  body: { month: number, year: number, extraRecipients?: string[] } → send email
export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { month, year, extraRecipients } = await req.json();
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
