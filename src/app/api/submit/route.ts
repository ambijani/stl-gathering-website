export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import Person from "@/models/Person";
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

/** Digits only, without a leading US country code, so formatting differences don't matter. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip verification if not configured

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json() as { success: boolean; score: number; action: string };
  return data.success && data.action === "submit" && data.score >= 0.5;
}

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
      const valid = await verifyRecaptcha(recaptchaToken);
      if (!valid) return Response.json({ error: "Bot protection check failed. Please try again." }, { status: 403 });
    }

    // Duplicate detection: same name (case-insensitive) + same phone number. Signups without a phone
    // aren't blocked, since a name alone can't tell namesakes apart; admins can merge real duplicates.
    const phone = normalizePhone(data.phone ?? "");
    if (phone) {
      const nameRegex = new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
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
