export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import { del } from "@vercel/blob";

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
