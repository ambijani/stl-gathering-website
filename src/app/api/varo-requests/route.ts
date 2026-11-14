export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import Gathering from "@/models/Gathering";
import Person from "@/models/Person";
import { normalizePhone, buildExactNameRegex } from "@/lib/personMatching";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { getUpcomingWindow } from "@/lib/upcomingWindow";
import { isValidObjectId } from "@/app/api/_auth";
import { z } from "zod";

const REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_MAX = 20;

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32),
  recaptchaToken: z.string().optional(),
  selections: z.array(z.object({
    gatheringId: z.string(),
    varoId: z.string(),
  })).min(1).max(50),
});

export async function GET() {
  try {
    await connect();
    const { start, end } = getUpcomingWindow(new Date());

    const gatherings = await Gathering.find({ date: { $gte: start, $lte: end } })
      .sort({ date: 1 })
      .lean<{ _id: object; title?: string; date: Date; varos: { _id: object; title: string; requests?: unknown[] }[] }[]>();

    const result = gatherings
      .filter(g => g.varos.length > 0)
      .map(g => ({
        _id: g._id.toString(),
        title: g.title,
        date: g.date.toISOString(),
        varos: g.varos.map(v => ({
          _id: v._id.toString(),
          title: v.title,
          requestCount: v.requests?.length ?? 0,
        })),
      }));

    return Response.json({ gatherings: result });
  } catch (error) {
    console.error("varo-requests GET error:", error);
    return Response.json({ error: "Failed to load upcoming Varo slots." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let limited = false;
    try {
      limited = await isRateLimited("varo-requests", clientIp(req), REQUEST_MAX, REQUEST_WINDOW_MS);
    } catch (err) {
      console.error("varo-requests rate limiter unavailable; allowing request:", err);
    }
    if (limited) {
      return new Response("Too Many Requests", { status: 429, headers: { "Retry-After": "900" } });
    }

    await connect();

    const json = await req.json().catch(() => null);
    if (!json) return Response.json({ error: "Bad JSON" }, { status: 400 });

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const { name, phone, recaptchaToken, selections } = parsed.data;

    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return Response.json({ error: "reCAPTCHA token is required" }, { status: 400 });
      }
      const valid = await verifyRecaptcha(recaptchaToken, "request_varo");
      if (!valid) return Response.json({ error: "Bot protection check failed. Please try again." }, { status: 403 });
    }

    for (const s of selections) {
      if (!isValidObjectId(s.gatheringId) || !isValidObjectId(s.varoId)) {
        return Response.json({ error: "Invalid selection." }, { status: 400 });
      }
    }

    const { start, end } = getUpcomingWindow(new Date());
    const gatheringIds = [...new Set(selections.map(s => s.gatheringId))];
    const gatherings = await Gathering.find({ _id: { $in: gatheringIds } });
    const gatheringById = new Map(gatherings.map(g => [g._id.toString(), g]));

    for (const s of selections) {
      const gathering = gatheringById.get(s.gatheringId);
      if (!gathering) return Response.json({ error: "Selection no longer exists." }, { status: 400 });
      if (gathering.date < start || gathering.date > end) {
        return Response.json({ error: "Selection is no longer available." }, { status: 400 });
      }
      const varo = gathering.varos.id(s.varoId);
      if (!varo) return Response.json({ error: "Selection no longer exists." }, { status: 400 });
    }

    const phoneNormalized = normalizePhone(phone);
    const nameRegex = buildExactNameRegex(name);
    const sameName = await Person.find({ name: { $regex: nameRegex } }).select("phone");
    let person = sameName.find(p => normalizePhone(p.phone ?? "") === phoneNormalized);
    if (!person) {
      person = await Person.create({ name, phone });
    }

    const now = new Date();
    for (const s of selections) {
      const gathering = gatheringById.get(s.gatheringId)!;
      const varo = gathering.varos.id(s.varoId)!;
      varo.requests ??= [];
      const alreadyRequested = varo.requests.some((r: { personId: { toString(): string } }) => r.personId?.toString() === person!._id.toString());
      if (!alreadyRequested) {
        varo.requests.push({ personId: person._id, requestedAt: now });
      }
    }

    await Promise.all([...gatheringById.values()].map(g => g.save()));

    return Response.json({ ok: true });
  } catch (error) {
    console.error("varo-requests POST error:", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
