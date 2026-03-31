export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32).optional().or(z.literal("")),
  interests: z.array(z.string()).max(50).optional(),
  availability: z.string().max(1000).optional().or(z.literal("")),
  recaptchaToken: z.string().optional(),
});

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip verification if not configured

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secret}&response=${token}`,
  });
  const data = await res.json() as { success: boolean; score: number; action: string };
  return data.success && data.score >= 0.5;
}

export async function POST(req: Request) {
  try {
    await connect();

    const json = await req.json().catch(() => null);
    if (!json) return new Response("Bad JSON", { status: 400 });

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }

    const { recaptchaToken, ...data } = parsed.data;

    if (recaptchaToken) {
      const valid = await verifyRecaptcha(recaptchaToken);
      if (!valid) return Response.json({ error: "Bot protection check failed. Please try again." }, { status: 403 });
    }

    const doc = await Person.create(data);
    return Response.json({ ok: true, id: doc._id, whatsappUrl: process.env.WHATSAPP_URL ?? null });
  } catch (error) {
    console.error("Submit API error:", error);
    return Response.json(
      { error: "Failed to create person", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
