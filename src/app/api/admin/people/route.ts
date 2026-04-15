export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin, isDemoMode } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connect();
  const rows = await Person.find().sort({ name: 1 }).lean();

  if (await isDemoMode()) {
    return Response.json(rows.map(({ phone: _phone, ...rest }) => rest));
  }
  return Response.json(rows);
}

export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { name } = await req.json() as { name?: string };
  if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  await connect();
  const person = await Person.create({ name: name.trim() });
  return Response.json(person, { status: 201 });
}
