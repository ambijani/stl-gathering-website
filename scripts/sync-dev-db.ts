import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// Replaces the local dev database with a fresh copy of production.
// Target is MONGODB_URI from .env.local (must be a "-dev" database); the source is the same
// cluster with "-dev" dropped from the database name. Production is only read, never written.
const PROD_DB = "stl-gathering";
const BATCH_SIZE = 50;

async function run() {
  const targetUri = process.env.MONGODB_URI;
  if (!targetUri) throw new Error("MONGODB_URI missing from .env.local");

  const target = await mongoose.createConnection(targetUri).asPromise();
  const targetDbName = target.db!.databaseName;
  if (!targetDbName.endsWith("-dev")) {
    throw new Error(`Refusing to overwrite "${targetDbName}": .env.local must point at a "-dev" database`);
  }
  const source = target.useDb(PROD_DB, { useCache: false });

  const collections = await source.db!.listCollections({}, { nameOnly: true }).toArray();
  console.log(`Copying ${PROD_DB} → ${targetDbName}`);

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    await target.db!.collection(name).drop().catch(() => {}); // fine if it doesn't exist yet

    let count = 0;
    let batch: mongoose.mongo.Document[] = [];
    for await (const doc of source.db!.collection(name).find()) {
      batch.push(doc);
      if (batch.length === BATCH_SIZE) {
        await target.db!.collection(name).insertMany(batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await target.db!.collection(name).insertMany(batch);
      count += batch.length;
    }
    console.log(`  ${name}: ${count} document(s)`);
  }

  await target.close();
  console.log("Done.");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
