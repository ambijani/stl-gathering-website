export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import { put } from "@vercel/blob";

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
  const filename = new URL(req.url).searchParams.get("filename") ?? "upload";
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";

  if (!req.body) return Response.json({ error: "No file body" }, { status: 400 });

  const blob = await put(`gatherings/${id}/${Date.now()}-${filename}`, req.body, {
    access: "public",
    contentType,
  });

  await connect();
  const photo = await Photo.create({ gatheringId: id, filename, contentType, url: blob.url });

  return Response.json(photo, { status: 201 });
}
