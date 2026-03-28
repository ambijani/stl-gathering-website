export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/next";

export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await req.json() as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async () => ({
      maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
    }),
    onUploadCompleted: async () => {
      // Nothing needed here — client saves URL to MongoDB after upload
    },
  });

  return Response.json(jsonResponse);
}
