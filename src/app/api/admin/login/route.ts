import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const pwd = await req.text();

  if (pwd === process.env.ADMIN_PASSWORD) {
    const res = new NextResponse("OK");
    res.cookies.set("admin", "1", { httpOnly: true, path: "/" });
    return res;
  }

  return new Response("Forbidden", { status: 403 });
}
