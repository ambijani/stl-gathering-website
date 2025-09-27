export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { timingSafeEqual, randomBytes } from "crypto";

// (optional) simple anti-replay nonce
function getSessionValue() {
  return "1." + randomBytes(8).toString("hex");
}

export async function POST(req: Request) {
  try {
    const input = await req.text();
    const envPwd = process.env.ADMIN_PASSWORD ?? "";
    
    console.log('Login attempt - Input length:', input.length);
    console.log('Login attempt - Env password length:', envPwd.length);
    console.log('Login attempt - Environment:', process.env.NODE_ENV);
    
    // constant-time compare
    const a = Buffer.from(input);
    const b = Buffer.from(envPwd);
    const ok = a.length === b.length && timingSafeEqual(a, b);

    console.log('Login attempt - Password match:', ok);

    if (!ok) {
      console.log('Login attempt - Authentication failed');
      return new Response("Forbidden", { status: 403 });
    }

    const res = new NextResponse("OK");
    const val = getSessionValue(); // "1.<nonce>"
    
    console.log('Login attempt - Generated session value:', val);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "strict" as const,
      path: "/",
      maxAge: 60 * 60 * 8,      // 8 hours
    };
    
    res.cookies.set("admin", val, cookieOptions);
    
    console.log('Login attempt - Authentication successful, cookie set');
    console.log('Login attempt - Cookie options:', cookieOptions);
    console.log('Login attempt - Cookie value set:', val);
    
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
