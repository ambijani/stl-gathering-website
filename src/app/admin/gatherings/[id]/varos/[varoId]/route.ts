import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

// PATCH to update one Varo's basic fields (optional; used if you add edit UI)
export async function PATCH(req: Request, { params }: { params: { id: string, varoId: string } }) {
  await connect();
  const g = await Gathering.findById(params.id);
  if (!g) return new Response("Not found", { status: 404 });

  const v = g.varos.id(params.varoId);
  if (!v) return new Response("Varo not found", { status: 404 });

  const data = await req.json();
  if (data.title !== undefined) v.title = data.title;
  if (data.description !== undefined) v.description = data.description;
  if (data.location !== undefined) v.location = data.location;
  if (data.capacity !== undefined) v.capacity = data.capacity;
  if (data.startTime !== undefined) v.startTime = data.startTime ? new Date(data.startTime) : undefined;
  if (data.endTime !== undefined) v.endTime = data.endTime ? new Date(data.endTime) : undefined;
  if (Array.isArray(data.tags)) v.tags = data.tags;

  await g.save();
  return Response.json({ ok: true });
}

// DELETE a varo
export async function DELETE(_req: Request, { params }: { params: { id: string, varoId: string } }) {
  await connect();
  const g = await Gathering.findById(params.id);
  if (!g) return new Response("Not found", { status: 404 });
  const v = g.varos.id(params.varoId);
  if (!v) return new Response("Varo not found", { status: 404 });
  v.deleteOne();
  await g.save();
  return Response.json({ ok: true });
}
