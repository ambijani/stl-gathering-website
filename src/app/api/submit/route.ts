export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import Person from "@/models/Person";
import { normalizePhone, buildExactNameRegex } from "@/lib/personMatching";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32).optional().or(z.literal("")),
  interests: z.array(z.string()).max(50).optional(),
  availability: z.string().max(1000).optional().or(z.literal("")),
  recaptchaToken: z.string().optional(),
});

const SUBMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SUBMIT_MAX = 20;

export async function POST(req: Request) {
  try {
    // Fails open: if the limiter can't reach the database, the signup goes through rather than being blocked.
    let limited = false;
    try {
      limited = await isRateLimited("submit", clientIp(req), SUBMIT_MAX, SUBMIT_WINDOW_MS);
    } catch (err) {
      console.error("Submit rate limiter unavailable; allowing request:", err);
    }
    if (limited) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "900" },
      });
    }

    await connect();

    const json = await req.json().catch(() => null);
    if (!json) return new Response("Bad JSON", { status: 400 });

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }

    const { recaptchaToken, ...data } = parsed.data;

    // When reCAPTCHA is configured, require the token
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return Response.json({ error: "reCAPTCHA token is required" }, { status: 400 });
      }
      const valid = await verifyRecaptcha(recaptchaToken, "submit");
      if (!valid) return Response.json({ error: "Bot protection check failed. Please try again." }, { status: 403 });
    }

    // Duplicate detection: same name (case-insensitive) + same phone number. Signups without a phone
    // aren't blocked, since a name alone can't tell namesakes apart; admins can merge real duplicates.
    const phone = normalizePhone(data.phone ?? "");
    if (phone) {
      const nameRegex = buildExactNameRegex(data.name);
      const sameName = await Person.find({ name: { $regex: nameRegex } }).select("phone").lean<{ phone?: string }[]>();
      if (sameName.some(p => normalizePhone(p.phone ?? "") === phone)) {
        return Response.json(
          { error: "It looks like you've already signed up. If you need to make changes, please contact an admin." },
          { status: 409 }
        );
      }
    }

    await Person.create(data);
    return Response.json({ ok: true, whatsappUrl: process.env.WHATSAPP_URL ?? null });
  } catch (error) {
    console.error("Submit API error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
