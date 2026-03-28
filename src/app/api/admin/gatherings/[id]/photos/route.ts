export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await connect();

  const photos = await Photo.find({ gatheringId: id }).select("filename contentType url createdAt").lean();
  return Response.json(photos);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { url, filename, contentType } = await req.json() as { url: string; filename: string; contentType: string };

  if (!url || !filename) return Response.json({ error: "Missing fields" }, { status: 400 });

  await connect();
  const photo = await Photo.create({ gatheringId: id, filename, contentType: contentType || "application/octet-stream", url });

  return Response.json(photo, { status: 201 });
}
