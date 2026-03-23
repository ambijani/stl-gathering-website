import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import connect from "@/lib/mongo";
import Person from "@/models/Person";

async function run() {
  await connect();
  const bad = await Person.find({ name: /,|\+/ }).lean().select("name _id");
  console.log(`Combined-name records found: ${bad.length}`);
  bad.forEach((p: any) => console.log(` - "${p.name}" (${p._id})`));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
