// Small helper for server routes to enforce admin
import { cookies } from "next/headers";

export async function requireAdmin() {
    const v = (await cookies()).get("admin")?.value;
    if (!v || !v.startsWith("1.")) {
      return new Response("Unauthorized", { status: 401 });
    }
    return null;
  }  
