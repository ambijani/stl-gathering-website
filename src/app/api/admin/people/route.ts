export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";

import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function GET() {
  await requireAdmin();
  await connect();
  const rows = await Person.find().sort({ createdAt: -1 }).lean();
  return Response.json(rows);
}