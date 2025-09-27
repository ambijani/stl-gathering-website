export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ status: "authenticated", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check - Authentication failed:', error);
    return new Response("Unauthorized", { status: 401 });
  }
}
