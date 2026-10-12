import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import connect from "@/lib/mongo";
import Gathering from "@/models/Gathering";

// Renames a Varo title on every gathering, e.g. the spelling change from "1st Dua Tasbih Farsi"
// to "1st Dua Tasbih (Farsi)". Varo history matches titles exactly, so old rows need the rename too.
// Dry run by default; pass --apply to write.
const OLD_TITLE = "1st Dua Tasbih Farsi";
const NEW_TITLE = "1st Dua Tasbih (Farsi)";

async function run() {
  await connect();
  const apply = process.argv.includes("--apply");

  const matches = await Gathering.countDocuments({ "varos.title": OLD_TITLE });
  console.log(`${matches} gathering(s) have a Varo titled "${OLD_TITLE}".`);

  if (!matches) { console.log("Nothing to do."); process.exit(0); }
  if (!apply) { console.log(`Dry run — re-run with --apply to rename them to "${NEW_TITLE}".`); process.exit(0); }

  const result = await Gathering.updateMany(
    { "varos.title": OLD_TITLE },
    { $set: { "varos.$[v].title": NEW_TITLE } },
    { arrayFilters: [{ "v.title": OLD_TITLE }] }
  );
  console.log(`Renamed Varos in ${result.modifiedCount} gathering(s).`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
