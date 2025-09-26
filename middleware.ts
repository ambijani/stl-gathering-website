import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminCookie = req.cookies.get("admin")?.value;

  const needsAdmin =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (needsAdmin) {
    const ok = adminCookie && adminCookie.startsWith("1.");
    if (!ok) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
