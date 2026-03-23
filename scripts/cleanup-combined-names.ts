import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";
import mongoose from "mongoose";

async function run() {
  await connect();

  // Find all combined-name records (contain comma, plus, or slash)
  const bad = await Person.find({ name: /,|\+|\// }).lean().select("name _id");
  console.log(`Found ${bad.length} combined-name records to remove:`);
  bad.forEach((p: any) => console.log(`  - "${p.name}"`));

  if (!bad.length) { console.log("Nothing to do."); process.exit(0); }

  const badIds = bad.map((p: any) => new mongoose.Types.ObjectId(p._id));

  // Verify none are still referenced in any gathering
  const stillReferenced = await Gathering.countDocuments({ "varos.assignedPeople": { $in: badIds } });
  if (stillReferenced > 0) {
    console.error(`WARNING: ${stillReferenced} gathering(s) still reference these records. Re-run the import first.`);
    process.exit(1);
  }

  const { deletedCount } = await Person.deleteMany({ _id: { $in: badIds } });
  console.log(`Deleted ${deletedCount} orphaned records.`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
