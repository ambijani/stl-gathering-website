export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { photoId } = await params;
  await connect();

  try {
    const photo = await Photo.findById(photoId).select("data contentType filename");
    if (!photo) return new Response("Not found", { status: 404 });

    console.log("photo.data type:", typeof photo.data, photo.data?.constructor?.name);

    const buf = Buffer.isBuffer(photo.data)
      ? photo.data
      : Buffer.from(photo.data as unknown as ArrayBuffer);

    return new Response(buf, {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Disposition": `inline; filename="${photo.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Photo GET error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { photoId } = await params;
  await connect();

  await Photo.findByIdAndDelete(photoId);
  return new Response(null, { status: 204 });
}
