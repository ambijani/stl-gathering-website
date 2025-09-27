// Small helper for server routes to enforce admin
import { cookies } from "next/headers";

export async function requireAdmin() {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin");
    const v = adminCookie?.value;
    
    console.log('requireAdmin - Cookie store:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 10) + '...' })));
    console.log('requireAdmin - Admin cookie:', adminCookie);
    console.log('requireAdmin - Admin cookie value:', v);
    console.log('requireAdmin - Value starts with 1.:', v?.startsWith("1."));
    
    if (!v || !v.startsWith("1.")) {
      console.log('requireAdmin - Authentication failed - no valid cookie');
      return new Response("Unauthorized", { status: 401 });
    }
    
    console.log('requireAdmin - Authentication successful');
    return null;
  }  
