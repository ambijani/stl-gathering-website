export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import nodemailer from "nodemailer";
import { fetchReportData, ReportGathering } from "@/lib/reportData";

export function buildEmailHtml(monthLabel: string, gatherings: ReportGathering[]) {
  const rows = gatherings.map(g => {
    const dateStr = new Date(g.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${g.title || "Gathering"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${dateStr}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.totalShoes}</td>
      </tr>`;
  }).join("");

  const avg = gatherings.length
    ? (gatherings.reduce((sum, g) => sum + g.totalShoes, 0) / gatherings.length).toFixed(1)
    : "0";

  const gatheringsWithPhotos = gatherings.filter(g => g.photos.length > 0);
  const photosSection = gatheringsWithPhotos.length > 0
    ? `
    <div style="padding:0 32px 28px;">
      <h2 style="font-size:16px;font-weight:600;color:#374151;margin:0 0 16px;padding-top:4px;">Jamati Photos</h2>
      ${gatheringsWithPhotos.map(g => {
        const dateStr = new Date(g.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        const imgTags = g.photos.map(p =>
          `<img src="cid:${p.cid}" alt="${g.title || "Gathering"}" style="width:200px;height:150px;object-fit:cover;border-radius:6px;display:block;" />`
        ).join("");
        return `
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;">${g.title || "Gathering"} · ${dateStr}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">${imgTags}</div>
        </div>`;
      }).join("")}
    </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:32px;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#064e3b;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">STL Ismaili Gathering</h1>
      <p style="color:#a7f3d0;margin:6px 0 0;font-size:15px;">Monthly Report — ${monthLabel}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;margin:0 0 20px;">Here is a summary of the <strong>${gatherings.length} gathering${gatherings.length !== 1 ? "s" : ""}</strong> held in ${monthLabel}.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Gathering</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Date</th>
            <th style="padding:10px 12px;text-align:center;color:#374151;font-weight:600;">Shoe Pairs</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;">
            <td colspan="2" style="padding:10px 12px;font-weight:600;color:#374151;">Avg per gathering</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;">${avg}</td>
          </tr>
        </tfoot>
      </table>
      ${gatherings.length === 0 ? '<p style="color:#6b7280;font-style:italic;">No gatherings recorded for this month.</p>' : ""}
    </div>
    ${photosSection}
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically on the 1st of each month · STL Ismaili Gathering</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReport(month: number, year: number, extraRecipients: string[] = []) {
  const { monthLabel, gatherings } = await fetchReportData(month, year);
  const html = buildEmailHtml(monthLabel, gatherings);

  const defaultRecipients = (process.env.REPORT_RECIPIENTS ?? "").split(",").map(e => e.trim()).filter(Boolean);
  const recipients = extraRecipients.length > 0 ? extraRecipients : defaultRecipients;
  if (recipients.length === 0) throw new Error("No REPORT_RECIPIENTS configured");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const attachments = gatherings.flatMap(g =>
    g.photos.map(p => ({
      filename: p.filename,
      content: p.data,
      contentType: p.contentType,
      cid: p.cid,
    }))
  );

  await transporter.sendMail({
    from: `"STL Gathering" <${process.env.GMAIL_USER}>`,
    to: recipients.join(", "),
    subject: `STL Gathering Monthly Report — ${monthLabel}`,
    html,
    attachments,
  });

  return { monthLabel, count: gatherings.length };
}

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
