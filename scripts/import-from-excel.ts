import * as path from "node:path";
import xlsx from "xlsx";
import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function toJSDate(input: any): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input === "number") {
    const ms = Math.round((input - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

function sheetToRowsArray(sheet: xlsx.WorkSheet): any[][] {
  return xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as any[][];
}

async function importPeople(wb: xlsx.WorkBook) {
  const SHEET = "Varo Form Responses";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`People: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);

  // Expected header (row 0):
  // [Timestamp, Name, Interests, Phone]
  const HEADER_ROW = 0;
  const idxName = 1;
  const idxInterests = 2;
  const idxPhone = 3;

  let created = 0, skipped = 0;
  for (let r = HEADER_ROW + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const name = String(row[idxName] || "").trim();
    if (!name) { skipped++; continue; }
    const interestsRaw = row[idxInterests];
    const phoneRaw = row[idxPhone];

    const interests = interestsRaw
      ? String(interestsRaw).split(",").map((s)=>s.trim()).filter(Boolean)
      : [];

    const phone = phoneRaw !== "" && phoneRaw !== null && phoneRaw !== undefined
      ? String(phoneRaw).trim()
      : undefined;

    await Person.create({ name, phone, interests });
    created++;
  }
  console.log(`People imported: ${created}; skipped (missing name): ${skipped}`);
}

async function importSchedule(wb: xlsx.WorkBook) {
  const SHEET = "Schedule";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`Schedule: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);

  // Your dates live in row 2 (0-based), starting at column 1
  // Row 2 looks like: ["Friday Vaaros", <date1>, <date2>, ...]
  const DATES_ROW = 2;
  const START_COL = 1;

  const hdr = rows[DATES_ROW] || [];
  let upserts = 0, skipped = 0;
  for (let c = START_COL; c < hdr.length; c++) {
    const d = toJSDate(hdr[c]);
    if (!d) { continue; }
    // Create a gathering for each date if not exists
    const res = await Gathering.updateOne(
      { date: d },
      { $setOnInsert: { title: "Friday Vaaros", date: d, notes: "", varos: [], shoeCount: [] } },
      { upsert: true }
    );
    // res.upsertedCount not available in mongoose older versions; just count all
    upserts++;
  }
  console.log(`Dates upserted (or already existed): ${upserts}; skipped: ${skipped}`);
}

async function importShoeCounts(wb: xlsx.WorkBook) {
  const SHEET = "Shoe Count";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`Shoes: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);

  // Header row 0: ["Date", "Shoe Count", "Month", ...]
  const HEADER_ROW = 0;
  const idxDate = 0;
  const idxCount = 1;

  let updated = 0, skipped = 0, missingGathering = 0;
  for (let r = HEADER_ROW + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const d = toJSDate(row[idxDate]);
    if (!d) { skipped++; continue; }
    const qty = Number(row[idxCount] || 0);
    const g = await Gathering.findOne({ date: d });
    if (!g) { missingGathering++; continue; }

    // Store a single "TOTAL" item
    g.shoeCount = [{ size: "TOTAL", qty: Number.isNaN(qty) ? 0 : qty }];
    await g.save();
    updated++;
  }
  console.log(`ShoeCount updated: ${updated}; skipped rows: ${skipped}; dates without Gathering: ${missingGathering}`);
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing (set it in .env.local)");
  console.log("Connecting to DB…");
  await connect();

  const excelPath = path.resolve(process.cwd(), "data.xlsx");
  console.log("Reading:", excelPath);
  const wb = xlsx.readFile(excelPath, { cellDates: true });
  console.log("Sheets:", wb.SheetNames);

  await importPeople(wb);
  await importSchedule(wb);
  await importShoeCounts(wb);

  console.log("Import complete.");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });