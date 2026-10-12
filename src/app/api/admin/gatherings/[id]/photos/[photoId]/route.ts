export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin, isValidObjectId } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";

// Every query also matches gatheringId, so a photo can only be reached through its own gathering.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id, photoId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(photoId)) return new Response("Invalid ID", { status: 400 });
  await connect();

  try {
    const photo = await Photo.findOne({ _id: photoId, gatheringId: id }).select("data contentType filename");
    if (!photo) return new Response("Not found", { status: 404 });

    const buf = Buffer.isBuffer(photo.data)
      ? photo.data
      : Buffer.from(photo.data as unknown as ArrayBuffer);

    return new Response(buf, {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(photo.filename)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Photo GET error:", err);
    return Response.json({ error: "Failed to retrieve photo" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id, photoId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(photoId)) return new Response("Invalid ID", { status: 400 });
  const { filename } = await req.json() as { filename?: string };
  if (!filename?.trim()) return Response.json({ error: "Filename required" }, { status: 400 });

  await connect();
  const photo = await Photo.findOneAndUpdate(
    { _id: photoId, gatheringId: id },
    { filename: filename.trim() },
    { new: true }
  ).select("filename");
  if (!photo) return new Response("Not found", { status: 404 });

  return Response.json({ filename: photo.filename });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id, photoId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(photoId)) return new Response("Invalid ID", { status: 400 });
  await connect();

  const deleted = await Photo.findOneAndDelete({ _id: photoId, gatheringId: id });
  if (!deleted) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
