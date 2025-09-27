export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/app/api/_auth";

export async function GET() {
  try {
    console.log('Health check - Starting authentication check...');
    await requireAdmin();
    console.log('Health check - Authentication successful');
    return Response.json({ status: "authenticated", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check - Authentication failed:', error);
    return new Response("Unauthorized", { status: 401 });
  }
}
