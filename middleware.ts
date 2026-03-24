import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allowlist: next internals & public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // public admin endpoints that MUST be reachable when not authed
  const publicAdminApis = ["/api/admin/login"];
  const isPublicAdminApi = publicAdminApis.some((p) => pathname.startsWith(p));

  // login page must be public
  const isLoginPage = pathname === "/admin/login";

  // always redirect /admin to /admin/login
  if (pathname === "/admin") {
    const token = req.cookies.get("admin")?.value;
    if (!(await verifySessionToken(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // protect all other /admin pages (but not /admin/login)
  const isProtectedAdminPage = pathname.startsWith("/admin") && !isLoginPage;

  // protect /api/admin/* except the allowlisted ones
  const isProtectedAdminApi = pathname.startsWith("/api/admin") && !isPublicAdminApi;

  if (isProtectedAdminPage || isProtectedAdminApi) {
    const token = req.cookies.get("admin")?.value;
    if (!(await verifySessionToken(token))) {
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
