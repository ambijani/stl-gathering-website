// scripts/debug-excel.ts
import * as path from "node:path";
import xlsx from "xlsx";

type Cell = string | number | Date | boolean | null;
type Row = Cell[];

function sheetToRowsArray(sheet: xlsx.WorkSheet): Row[] {
  return xlsx.utils.sheet_to_json<Row>(sheet, {
    header: 1,
    raw: true,
    defval: "",
  }) as Row[];
}

function show(name: string, rows: Row[]) {
  console.log(`\n=== ${name} (first 10 rows) ===`);
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`[${i}]`, rows[i]);
  }
}

(async () => {
  const excelPath = path.resolve(process.cwd(), "data.xlsx");
  const wb = xlsx.readFile(excelPath, { cellDates: true });
  console.log("Sheets:", wb.SheetNames);
  for (const sheetName of wb.SheetNames) {
    const rows = sheetToRowsArray(wb.Sheets[sheetName]);
    show(sheetName, rows);
  }
})();