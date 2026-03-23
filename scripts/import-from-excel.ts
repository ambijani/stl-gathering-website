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
  if (typeof input === "number") {
    const ms = Math.round((input - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function sheetToRowsArray(sheet: xlsx.WorkSheet): Row[] {
  return xlsx.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: "" }) as Row[];
}

/** Normalize date to noon UTC so it survives timezone shifts */
function normalizeDate(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(12, 0, 0, 0);
  return out;
}

function dayRange(d: Date): { $gte: Date; $lte: Date } {
  const start = new Date(d); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d);   end.setUTCHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

// ─── Person cache ────────────────────────────────────────────────────────────
// normalizedName → _id string
const personCache = new Map<string, string>();

async function loadPersonCache() {
  personCache.clear();
  const all = await Person.find({}).lean();
  for (const p of all) personCache.set(normalizeName(p.name), String(p._id));
  console.log(`Person cache loaded: ${personCache.size} existing people`);
}

/**
 * Find person by name (case-insensitive). If not found, create with given name.
 * Optionally update phone/interests when called from People import.
 */
async function upsertPerson(
  name: string,
  updates?: { phone?: string; interests?: string[] }
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const key = normalizeName(trimmed);

  if (personCache.has(key)) {
    const id = personCache.get(key)!;
    if (updates) {
      const set: Record<string, unknown> = {};
      if (updates.phone)              set.phone = updates.phone;
      if (updates.interests?.length)  set.interests = updates.interests;
      if (Object.keys(set).length)    await Person.updateOne({ _id: id }, { $set: set });
    }
    return id;
  }

  const p = await Person.create({ name: trimmed, ...updates });
  const id = String(p._id);
  personCache.set(key, id);
  return id;
}

// ─── 1. People ───────────────────────────────────────────────────────────────
async function importPeople(wb: xlsx.WorkBook) {
  const SHEET = "Varo Form Responses";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`Skipping: sheet "${SHEET}" not found`); return; }

  const rows = sheetToRowsArray(ws);
  // Row 0 = header: Timestamp | Name | Varos interested | Phone
  let created = 0, updated = 0, skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const name = String(row[1] ?? "").trim();
    if (!name) { skipped++; continue; }

    const interests = row[2]
      ? String(row[2]).split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const phone = row[3] ? String(row[3]).trim() : undefined;

    const key = normalizeName(name);
    const existed = personCache.has(key);
    await upsertPerson(name, { phone, interests });
    existed ? updated++ : created++;
  }

  console.log(`People: ${created} created, ${updated} updated, ${skipped} skipped (empty name)`);
}

// ─── 2. Schedule ─────────────────────────────────────────────────────────────
async function importSchedule(wb: xlsx.WorkBook) {
  const SHEET = "Schedule";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`Skipping: sheet "${SHEET}" not found`); return; }

  const rows = sheetToRowsArray(ws);

  // Find section header rows: cells where col A is "Friday Vaaros" or "Chandraat Vaaros"
  const SECTION_TITLES = ["Friday Vaaros", "Chandraat Vaaros"];
  const sections: { title: string; headerRow: number }[] = [];
  for (let r = 0; r < rows.length; r++) {
    const cell = String(rows[r]?.[0] ?? "").trim();
    if (SECTION_TITLES.includes(cell)) sections.push({ title: cell, headerRow: r });
  }

  if (!sections.length) {
    console.log(`Schedule: no sections found. Check that col A has "Friday Vaaros" / "Chandraat Vaaros".`);
    return;
  }

  let gatheringsCreated = 0, gatheringsUpdated = 0, assignmentsSet = 0;

  for (let s = 0; s < sections.length; s++) {
    const { title: sectionTitle, headerRow } = sections[s];
    const nextHeaderRow = s + 1 < sections.length ? sections[s + 1].headerRow : rows.length;

    const dateRow = rows[headerRow] ?? [];
    // Rows between this section header and the next (or end) that have a Varo name in col A
    const varoRows: Row[] = [];
    for (let r = headerRow + 1; r < nextHeaderRow; r++) {
      const varoTitle = String(rows[r]?.[0] ?? "").trim();
      if (varoTitle) varoRows.push(rows[r]);
    }

    // Each column from index 1 onwards is a gathering date
    for (let c = 1; c < dateRow.length; c++) {
      const rawDate = dateRow[c];
      if (!rawDate) continue;
      const gatheringDate = toJSDate(rawDate);
      if (!gatheringDate) continue;

      const normalizedDate = normalizeDate(gatheringDate);

      // Find or create gathering for this date
      let gathering = await Gathering.findOne({ date: dayRange(normalizedDate) });
      if (!gathering) {
        gathering = await Gathering.create({
          title: sectionTitle,
          date: normalizedDate,
          varos: [],
          shoeCount: [],
        });
        gatheringsCreated++;
      } else {
        gatheringsUpdated++;
      }

      // Process each Varo row for this date column
      for (const varoRow of varoRows) {
        const varoTitle = String(varoRow[0] ?? "").trim();
        const cellValue = String(varoRow[c] ?? "").trim();
        if (!cellValue) continue; // No one assigned

        // Multiple people separated by "+" (e.g. "Zahra Ladak + Madar Gul")
        const personNames = cellValue.split("+").map(s => s.trim()).filter(Boolean);
        const personIds: string[] = [];
        for (const pName of personNames) {
          const id = await upsertPerson(pName);
          if (id) personIds.push(id);
        }
        if (!personIds.length) continue;

        // Find existing varo in gathering by title, or add new one
        const existingVaro = (gathering.varos as Array<{ title: string; assignedPeople: string[] }>)
          .find(v => normalizeName(v.title) === normalizeName(varoTitle));

        if (existingVaro) {
          existingVaro.assignedPeople = personIds; // replace with current schedule
        } else {
          gathering.varos.push({ title: varoTitle, assignedPeople: personIds });
        }
        assignmentsSet++;
      }

      await gathering.save();
    }

    console.log(`  "${sectionTitle}": processed ${varoRows.length} varos across date columns`);
  }

  console.log(`Schedule: ${gatheringsCreated} gatherings created, ${gatheringsUpdated} updated, ${assignmentsSet} varo assignments set`);
}

// ─── 3. Shoe Counts ──────────────────────────────────────────────────────────
async function importShoeCounts(wb: xlsx.WorkBook) {
  const SHEET = "Shoe Count";
  const ws = wb.Sheets[SHEET];
  if (!ws) { console.log(`Skipping: sheet "${SHEET}" not found`); return; }

  const rows = sheetToRowsArray(ws);
  let updated = 0, skipped = 0, notFound = 0;

  for (const row of rows) {
    const d = toJSDate(row[0] ?? "");
    if (!d) { skipped++; continue; } // skips header row, empty rows, month averages

    const count = Number(row[1] ?? "");
    if (isNaN(count) || count <= 0) { skipped++; continue; }

    const normalizedDate = normalizeDate(d);
    const g = await Gathering.findOne({ date: dayRange(normalizedDate) });
    if (!g) { notFound++; continue; }

    g.shoeCount = [{ size: "TOTAL", qty: count }];
    await g.save();
    updated++;
  }

  console.log(`Shoe counts: ${updated} updated, ${skipped} rows skipped, ${notFound} dates without a matching gathering`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await connect();

  const excelPath = path.resolve(process.cwd(), "data.xlsx");
  console.log("Reading:", excelPath);
  const wb = xlsx.readFile(excelPath, { cellDates: true });
  console.log("Sheets found:", wb.SheetNames);

  await loadPersonCache();
  await importPeople(wb);
  await importSchedule(wb);
  await importShoeCounts(wb);

  console.log("\nImport complete.");
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
