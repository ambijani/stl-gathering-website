export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import { del } from "@vercel/blob";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { photoId } = await params;
  await connect();

  const photo = await Photo.findById(photoId).lean() as { url: string; contentType: string; filename: string } | null;
  if (!photo) return new Response("Not found", { status: 404 });

  const blobRes = await fetch(photo.url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });

  if (!blobRes.ok) return new Response("Failed to fetch file", { status: 502 });

  return new Response(blobRes.body, {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Disposition": `inline; filename="${photo.filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { photoId } = await params;
  await connect();

  const photo = await Photo.findById(photoId).lean() as { url: string } | null;
  if (!photo) return new Response("Not found", { status: 404 });

  await del(photo.url);
  await Photo.findByIdAndDelete(photoId);

  return new Response(null, { status: 204 });
}
