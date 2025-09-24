export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function POST(req: Request) {
  await connect();
  const body = await req.json();
  if (!body.name) return new Response("Missing name", { status: 400 });
  const doc = await Person.create(body);
  return Response.json({ ok: true, id: doc._id });
}