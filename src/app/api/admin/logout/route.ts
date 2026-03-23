export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  const res = new NextResponse("OK");
  res.cookies.set("admin", "", { maxAge: 0, path: "/" });
  return res;
}
