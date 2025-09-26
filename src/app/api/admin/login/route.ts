export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { timingSafeEqual, randomBytes } from "crypto";

// (optional) simple anti-replay nonce
function getSessionValue() {
  return "1." + randomBytes(8).toString("hex");
}

export async function POST(req: Request) {
  const input = await req.text();
  const envPwd = process.env.ADMIN_PASSWORD ?? "";
  // constant-time compare
  const a = Buffer.from(input);
  const b = Buffer.from(envPwd);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) return new Response("Forbidden", { status: 403 });

  const res = new NextResponse("OK");
  const val = getSessionValue(); // "1.<nonce>"
  res.cookies.set("admin", val, {
    httpOnly: true,
    secure: true,             // important on Vercel (HTTPS)
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,      // 8 hours
  });
  return res;
}
