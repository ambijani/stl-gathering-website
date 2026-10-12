import connect from "@/lib/mongo";
import RateLimit from "@/models/RateLimit";

/**
 * The visitor's IP. On Vercel the platform sets x-forwarded-for, so its first entry is the client.
 * https://vercel.com/docs/headers/request-headers
 */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Counts this request against `max` hits per `windowMs` for (name, ip) and returns true when over the limit.
 * The count lives in MongoDB, so every server instance sees the same total.
 * Throws if the database is unreachable; each caller decides whether to fail open or closed.
 */
export async function isRateLimited(name: string, ip: string, max: number, windowMs: number): Promise<boolean> {
  await connect();
  const bucket = Math.floor(Date.now() / windowMs);
  const expiresAt = new Date((bucket + 1) * windowMs);
  const doc = await RateLimit.findOneAndUpdate(
    { _id: `${name}:${ip}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true }
  ).lean<{ count: number } | null>();
  return (doc?.count ?? 0) > max;
}
