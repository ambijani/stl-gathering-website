export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connect();
  const rows = await Person.find().sort({ name: 1 }).lean();
  return Response.json(rows);
}
