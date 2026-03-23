import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin")?.value;
  if (!(await verifySessionToken(token))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
