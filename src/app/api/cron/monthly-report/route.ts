export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";
import nodemailer from "nodemailer";

function buildEmailHtml(month: string, gatherings: { title: string; date: Date; totalShoes: number; shoeBreakdown: { size: string; qty: number }[] }[]) {
  const rows = gatherings.map(g => {
    const dateStr = new Date(g.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const breakdown = g.shoeBreakdown.length
      ? g.shoeBreakdown.map(s => `${s.size}: ${s.qty}`).join(", ")
      : "No data";
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${g.title || "Gathering"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${dateStr}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.totalShoes}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${breakdown}</td>
      </tr>`;
  }).join("");

  const totalShoes = gatherings.reduce((sum, g) => sum + g.totalShoes, 0);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:32px;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#064e3b;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">STL Ismaili Gathering</h1>
      <p style="color:#a7f3d0;margin:6px 0 0;font-size:15px;">Monthly Report — ${month}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;margin:0 0 20px;">Here is a summary of the <strong>${gatherings.length} gathering${gatherings.length !== 1 ? "s" : ""}</strong> held in ${month}.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Gathering</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Date</th>
            <th style="padding:10px 12px;text-align:center;color:#374151;font-weight:600;">Shoe Pairs</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Breakdown</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;">
            <td colspan="2" style="padding:10px 12px;font-weight:600;color:#374151;">Total</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;">${totalShoes}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      ${gatherings.length === 0 ? '<p style="color:#6b7280;font-style:italic;">No gatherings recorded for this month.</p>' : ""}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically on the 1st of each month · STL Ismaili Gathering</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  // Allow manual triggers with ?secret= for testing; Vercel cron sends Authorization header
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const cronAuth = authHeader === `Bearer ${secret}`;
    const manualAuth = searchParams.get("secret") === secret;
    if (!cronAuth && !manualAuth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await connect();

    // Get last month's date range
    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLabel = firstOfLastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const rawGatherings = await Gathering.find({
      date: { $gte: firstOfLastMonth, $lt: firstOfThisMonth },
    }).sort({ date: 1 }).lean();

    const gatherings = rawGatherings.map(g => {
      const shoeBreakdown = (g.shoeCount ?? []).filter((s: { size: string; qty: number }) => s.qty > 0);
      const totalShoes = shoeBreakdown.reduce((sum: number, s: { size: string; qty: number }) => sum + s.qty, 0);
      return {
        title: g.title ?? "",
        date: g.date,
        totalShoes,
        shoeBreakdown,
      };
    });

    const html = buildEmailHtml(monthLabel, gatherings);

    const recipients = (process.env.REPORT_RECIPIENTS ?? "").split(",").map(e => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return Response.json({ error: "No REPORT_RECIPIENTS configured" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"STL Gathering" <${process.env.GMAIL_USER}>`,
      to: recipients.join(", "),
      subject: `STL Gathering Monthly Report — ${monthLabel}`,
      html,
    });

    return Response.json({ ok: true, month: monthLabel, gatherings: gatherings.length });
  } catch (error) {
    console.error("Monthly report error:", error);
    return Response.json(
      { error: "Failed to send report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
