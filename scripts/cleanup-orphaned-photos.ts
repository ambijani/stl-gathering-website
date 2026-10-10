import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import connect from "@/lib/mongo";
import Photo from "@/models/Photo";
import Gathering from "@/models/Gathering";

// Removes photos whose gathering has been deleted.
// Dry run by default; pass --delete to actually remove them.
async function run() {
  await connect();
  const shouldDelete = process.argv.includes("--delete");

  const gatheringIds = await Gathering.distinct("_id");
  const orphans = await Photo.find({ gatheringId: { $nin: gatheringIds } })
    .select("filename gatheringId createdAt")
    .lean<{ _id: unknown; filename: string; gatheringId: unknown; createdAt?: Date }[]>();

  console.log(`Found ${orphans.length} orphaned photo(s):`);
  orphans.forEach(p => console.log(`  - "${p.filename}" (gathering ${String(p.gatheringId)}, uploaded ${p.createdAt?.toISOString() ?? "unknown"})`));

  if (!orphans.length) { console.log("Nothing to do."); process.exit(0); }
  if (!shouldDelete) { console.log("Dry run — re-run with --delete to remove them."); process.exit(0); }

  const { deletedCount } = await Photo.deleteMany({ _id: { $in: orphans.map(p => p._id) } });
  console.log(`Deleted ${deletedCount} orphaned photo(s).`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
