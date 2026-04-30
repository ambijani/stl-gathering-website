import { cookies, headers } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import mongoose from "mongoose";

/** Returns true only if the string is a valid 24-hex-char MongoDB ObjectId. */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin")?.value;
  if (!(await verifySessionToken(token))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export async function isDemoMode(): Promise<boolean> {
  const headerStore = await headers();
  return headerStore.get("x-demo-mode") === "1";
}
