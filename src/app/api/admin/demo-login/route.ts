export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createDemoSessionToken } from "@/lib/session";

export async function POST() {
  const token = await createDemoSessionToken();
  const res = new NextResponse("OK");
  const cookieOpts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  };
  res.cookies.set("admin", token, { ...cookieOpts, httpOnly: true });
  // Non-httpOnly so the admin layout can detect demo mode client-side
  res.cookies.set("demo-mode", "1", { ...cookieOpts, httpOnly: false });
  return res;
}
