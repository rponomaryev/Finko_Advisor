import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { businessSamples } from "../../src/lib/data/businessSamples/businessSamples.ts";
import { buildExcelReportBuffer } from "../../src/lib/export/excelReportExporter.ts";
import { buildCalculatedProject, genericProfile } from "./systemicFixtures.ts";

function volumeForCategory(category: string) {
  if (category === "retail" || category === "ecommerce") return { volumeKey: "traffic", priceKey: "averageTicket" };
  if (category === "rental") return { volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" };
  if (category === "manufacturing") return { volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" };
  if (category === "food_service") return { volumeKey: "dailyOrders", priceKey: "averageTicket" };
  if (category === "b2b" || category === "construction") return { volumeKey: "contractsPerMonth", priceKey: "contractValue" };
  return { volumeKey: "monthlyOrders", priceKey: "averageTicket" };
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    const record = value as { text?: unknown; richText?: Array<{ text?: unknown }>; result?: unknown; formula?: unknown; hyperlink?: unknown };
    if (record.text) return String(record.text);
    if (Array.isArray(record.richText)) return record.richText.map((part) => String(part.text ?? "")).join("");
    if (record.result !== undefined) return String(record.result);
    if (record.formula !== undefined) return String(record.formula);
    if (record.hyperlink !== undefined) return String(record.hyperlink);
    return "";
  }
  return String(value);
}

async function workbookText(buffer: Buffer): Promise<{ sheetNames: string[]; text: string }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const parts: string[] = [];
  workbook.eachSheet((sheet) => {
    parts.push(sheet.name);
    sheet.eachRow((row) => row.eachCell((cell) => parts.push(cellText(cell.value))));
  });
  return { sheetNames: workbook.worksheets.map((sheet) => sheet.name), text: parts.join("\n") };
}

const forbidden = /требуется проверка|Требуется ручная проверка|Профильный показатель|Контрольный числовой показатель|тестовой сборки|undefined|null|NaN|Infinity|sample default|profile default|raw JSON|\|\s*Выручка от|критичных рисков не выявлено|generic duplicated conclusion|9\s+Низкий/i;
export async function checkActualExcelSampleRange(start: number, end: number): Promise<void> {
  assert.ok(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= businessSamples.length && start < end, "valid sample range required");

  for (let idx = start; idx < end; idx += 1) {
    const sample = businessSamples[idx];
    console.log(`checking ${idx + 1}/${businessSamples.length}: ${sample.id}`);
    const keys = volumeForCategory(sample.category);
    const profile = genericProfile({
      businessType: sample.label.ru,
      category: sample.category,
      ...keys,
      overrides: {
        businessProfile: {
          category: sample.category,
          subcategory: sample.subcategory,
          businessModel: sample.profile?.businessModel ?? (String(sample.category) === "rental" ? "rental" : "retail_sale"),
          volumeField: keys.volumeKey,
          averageTicketField: keys.priceKey,
          capacityUnit: keys.volumeKey.toLowerCase().includes("day") || keys.volumeKey === "traffic" ? "customers_per_day" : "orders_per_month"
        }
      }
    });
    const project = buildCalculatedProject(profile);
    const { sheetNames, text } = await workbookText(await buildExcelReportBuffer(project, "ru"));
    assert.ok(sheetNames.includes("ИИ Анализ и рекомендации"), `${sample.id}: AI sheet missing`);
    assert.match(text, /Месячная выручка|Финансовая модель/, `${sample.id}: financial content missing`);
    assert.match(text, /Список источников|Источники|Доступно по адресу|https?:\/\//, `${sample.id}: references missing`);
    assert.doesNotMatch(text, forbidden, `${sample.id}: forbidden placeholder/internal leakage in Excel`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const start = Number(process.argv[2] ?? 0);
  const end = Number(process.argv[3] ?? businessSamples.length);
  await checkActualExcelSampleRange(start, end);
  console.log(`actual Excel sample range ok: ${start}-${end}`);
}
