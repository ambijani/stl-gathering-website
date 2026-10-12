export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin, isValidObjectId } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import Gathering from "@/models/Gathering";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_UPLOAD_BYTES } from "@/lib/photoUpload";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const photos = await Photo.find({ gatheringId: id }).select("filename contentType createdAt").lean();
  return Response.json(photos);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return new Response("Invalid ID", { status: 400 });
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return Response.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
      return Response.json({ error: "File must be under 4 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await connect();
    if (!(await Gathering.exists({ _id: id }))) return Response.json({ error: "Gathering not found" }, { status: 404 });
    const photo = await Photo.create({
      gatheringId: id,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      data: buffer,
    });

    return Response.json({ _id: photo._id, filename: photo.filename, contentType: photo.contentType }, { status: 201 });
  } catch (err) {
    console.error("Photo upload error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
