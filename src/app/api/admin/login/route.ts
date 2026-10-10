export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

/** ip → { count, windowStart } */
const attempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "900" },
      });
    }

    const envPwd = process.env.ADMIN_PASSWORD ?? "";
    if (!envPwd) {
      console.error("ADMIN_PASSWORD is not set; refusing all logins");
      return new Response("Server configuration error", { status: 500 });
    }

    const input = await req.text();

    const a = Buffer.from(input);
    const b = Buffer.from(envPwd);
    const ok = a.length === b.length && timingSafeEqual(a, b);

    if (!ok) return new Response("Forbidden", { status: 403 });

    const res = new NextResponse("OK");
    res.cookies.set("admin", await createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
