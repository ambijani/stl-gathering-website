import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const PROD_DB = "stl-gathering";

function dbNameFromUri(uri) {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (!match) throw new Error(`Could not parse database name from MONGODB_URI: ${uri}`);
  return match[1];
}

// Loads MONGODB_URI for "prod" (.env) or "dev" (.env.local), and refuses to return it if the
// actual database name in the connection string doesn't match what's expected — .env.local can
// silently end up pointing at production after `vercel env pull` (see HANDOFF.md).
export function loadMongoUri(target) {
  if (target !== "prod" && target !== "dev") throw new Error('target must be "prod" or "dev"');

  const file = target === "prod" ? ".env" : ".env.local";
  const filePath = path.join(ROOT, file);
  const parsed = dotenv.parse(fs.readFileSync(filePath, "utf8"));
  const uri = parsed.MONGODB_URI;
  if (!uri) throw new Error(`MONGODB_URI missing from ${file}`);

  const dbName = dbNameFromUri(uri);
  const isDev = dbName.endsWith("-dev");
  if (target === "prod" && (isDev || dbName !== PROD_DB)) {
    throw new Error(`Refusing to use ${file} as prod: it points at "${dbName}", not "${PROD_DB}".`);
  }
  if (target === "dev" && !isDev) {
    throw new Error(`Refusing to use ${file} as dev: it points at "${dbName}", not a "-dev" database.`);
  }

  console.log(`[db-env] ${file} -> ${dbName}`);
  return uri;
}
