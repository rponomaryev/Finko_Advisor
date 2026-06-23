import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { localizeProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";
import { extractPdfText } from "./helpers/pdfText.ts";

const forbiddenProfileLeakage = /Профильный показатель|Профильное значение|Требуется ручная проверка|profile default|sample default|business profile fallback|\bundefined\b|\bnull\b|\bNaN\b/i;

function volumeForCategory(category: string) {
  if (category === "retail" || category === "ecommerce") return { volumeKey: "traffic", priceKey: "averageTicket" };
  if (category === "rental") return { volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" };
  if (category === "manufacturing") return { volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" };
  if (category === "food_service") return { volumeKey: "dailyOrders", priceKey: "averageTicket" };
  if (category === "b2b" || category === "construction") return { volumeKey: "contractsPerMonth", priceKey: "contractValue" };
  return { volumeKey: "monthlyOrders", priceKey: "averageTicket" };
}

function projectForSample(sample: (typeof businessSamples)[number]) {
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
  return buildCalculatedProject(profile);
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

async function workbookText(buffer: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const parts: string[] = [];
  workbook.eachSheet((sheet) => {
    parts.push(sheet.name);
    sheet.eachRow((row) => row.eachCell((cell) => parts.push(cellText(cell.value))));
  });
  return parts.join("\n");
}

test("business profile labels do not emit technical placeholders for any sample subcategory", () => {
  for (const sample of businessSamples) {
    const text = [
      localizeProfileValue(sample.id, "ru"),
      localizeProfileValue(sample.subcategory, "ru"),
      localizeProfileValue(`${sample.subcategory}_focus`, "ru")
    ].join("\n");
    assert.doesNotMatch(text, forbiddenProfileLeakage, `${sample.id}: business profile label placeholder leaked`);
  }
});

test("tire_service / Шиномонтаж has clean business profile in actual PDF and Excel", async () => {
  const sample = businessSamples.find((item) => item.id === "tire_service");
  assert.ok(sample, "tire_service sample must exist");
  const project = projectForSample(sample);
  const pdfText = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
  const excelText = await workbookText(await buildExcelReportBuffer(project, "ru"));
  assert.doesNotMatch(pdfText, forbiddenProfileLeakage, "tire_service: PDF business profile placeholder leaked");
  assert.doesNotMatch(excelText, forbiddenProfileLeakage, "tire_service: Excel business profile placeholder leaked");
  assert.match(pdfText + "\n" + excelText, /Шиномонтаж/, "tire_service should render as Шиномонтаж, not a generic profile placeholder");
});
