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
  console.log('MongoDB - Starting connection process...');
  
  if (cached.conn) {
    console.log('MongoDB - Using cached connection');
    return cached.conn;
  }
  
  if (!cached.promise) {
    console.log('MongoDB - Creating new connection promise...');
    console.log('MongoDB - URI present:', !!MONGODB_URI);
    console.log('MongoDB - URI length:', MONGODB_URI?.length || 0);
    
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => {
      console.log('MongoDB - Connection established successfully');
      console.log('MongoDB - Connection state:', m.connection.readyState);
      console.log('MongoDB - Database name:', m.connection.name);
      return m;
    }).catch((error) => {
      console.error('MongoDB - Connection failed:', error);
      throw error;
    });
  }
  
  console.log('MongoDB - Waiting for connection...');
  cached.conn = await cached.promise;
  global.__mongooseCache = cached;
  
  console.log('MongoDB - Connection completed and cached');
  return cached.conn;
}
