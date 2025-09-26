export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import Person from "@/models/Person";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  interests: z.array(z.string()).max(50).optional(),
  availability: z.string().max(1000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  await connect();
  const json = await req.json().catch(() => null);
  if (!json) return new Response("Bad JSON", { status: 400 });

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const doc = await Person.create(parsed.data);
  return Response.json({ ok: true, id: doc._id });
}
