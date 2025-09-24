import * as path from "node:path";
import xlsx from "xlsx";
import connect from "@/lib/mongo";
import Person from "@/models/Person";
import Gathering from "@/models/Gathering";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

type Cell = string | number | Date | boolean | null;
type Row = Cell[];

function toJSDate(input: Cell): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input === "number") { const ms = Math.round((input - 25569) * 86400 * 1000); const d = new Date(ms); return isNaN(d.getTime()) ? null : d; }
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}
function sheetToRowsArray(sheet: xlsx.WorkSheet): Row[] {
  return xlsx.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: "" }) as Row[];
}

async function importPeople(wb: xlsx.WorkBook) {
  const SHEET = "Varo Form Responses";
  const ws = wb.Sheets[SHEET]; if (!ws) { console.log(`People: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);
  const HEADER_ROW = 0, idxName = 1, idxInterests = 2, idxPhone = 3;

  let created = 0, skipped = 0;
  for (let r = HEADER_ROW + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const name = String(row[idxName] ?? "").trim();
    if (!name) { skipped++; continue; }
    const interestsRaw = row[idxInterests];
    const phoneRaw = row[idxPhone];

    const interests = interestsRaw ? String(interestsRaw).split(",").map((s) => s.trim()).filter(Boolean) : [];
    const phone = phoneRaw !== "" && phoneRaw !== null && phoneRaw !== undefined ? String(phoneRaw).trim() : undefined;

    await Person.create({ name, phone, interests });
    created++;
  }
  console.log(`People imported: ${created}; skipped (missing name): ${skipped}`);
}

async function importSchedule(wb: xlsx.WorkBook) {
  const SHEET = "Schedule";
  const ws = wb.Sheets[SHEET]; if (!ws) { console.log(`Schedule: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);

  const DATES_ROW = 2, START_COL = 1;
  const hdr = rows[DATES_ROW] ?? [];
  let upserts = 0;
  for (let c = START_COL; c < hdr.length; c++) {
    const d = toJSDate(hdr[c] ?? ""); if (!d) continue;
    await Gathering.updateOne({ date: d }, { $setOnInsert: { title: "Friday Vaaros", date: d, notes: "", varos: [], shoeCount: [] } }, { upsert: true });
    upserts++;
  }
  console.log(`Dates upserted (or existed): ${upserts}`);
}

async function importShoeCounts(wb: xlsx.WorkBook) {
  const SHEET = "Shoe Count";
  const ws = wb.Sheets[SHEET]; if (!ws) { console.log(`Shoes: sheet "${SHEET}" not found.`); return; }
  const rows = sheetToRowsArray(ws);

  const HEADER_ROW = 0, idxDate = 0, idxCount = 1;
  let updated = 0, skipped = 0, missingGathering = 0;

  for (let r = HEADER_ROW + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const d = toJSDate(row[idxDate] ?? ""); if (!d) { skipped++; continue; }
    const qtyNum = Number(row[idxCount] ?? 0);

    const g = await Gathering.findOne({ date: d });
    if (!g) { missingGathering++; continue; }
    g.shoeCount = [{ size: "TOTAL", qty: Number.isNaN(qtyNum) ? 0 : qtyNum }];
    await g.save(); updated++;
  }
  console.log(`ShoeCount updated: ${updated}; skipped rows: ${skipped}; dates without Gathering: ${missingGathering}`);
}

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
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

run().catch((err) => { console.error(err); process.exit(1); });