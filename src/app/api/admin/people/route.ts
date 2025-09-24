import connect from "@/lib/mongo";
import Person from "@/models/Person";

export async function GET() {
  await connect();
  const rows = await Person.find().sort({ createdAt: -1 }).lean();
  return Response.json(rows);
}
