export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import Gathering from "@/models/Gathering";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await connect();

  const photos = await Photo.find({ gatheringId: id }).select("filename contentType createdAt").lean();
  return Response.json(photos);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  await connect();
  const photo = await Photo.create({
    gatheringId: id,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    data: buffer,
  });

  // Store reference on the gathering
  await Gathering.findByIdAndUpdate(id, { $push: { photos: { _id: photo._id } } });

  return Response.json({ _id: photo._id, filename: photo.filename, contentType: photo.contentType }, { status: 201 });
}
