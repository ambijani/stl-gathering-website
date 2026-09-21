export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { sendReport } from "@/lib/monthlyReport";

export async function GET(req: Request) {
  const authHeader    = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const secret        = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now   = new Date();
    // Default: last month. Accept optional ?month=&year= overrides.
    const month = searchParams.has("month") ? Number(searchParams.get("month")) : now.getMonth() - 1;
    const year  = searchParams.has("year")  ? Number(searchParams.get("year"))  : now.getFullYear();

    const { monthLabel, count } = await sendReport(month, year);
    return Response.json({ ok: true, month: monthLabel, gatherings: count });
  } catch (error) {
    console.error("Monthly report error:", error);
    return Response.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
