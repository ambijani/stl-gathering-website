import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };

export default async function connect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  cached.conn = await cached.promise;
  global.__mongooseCache = cached;
  return cached.conn;
}
