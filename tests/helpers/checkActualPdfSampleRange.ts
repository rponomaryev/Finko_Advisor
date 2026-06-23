import assert from "node:assert/strict";
import { businessSamples } from "../../src/lib/data/businessSamples/businessSamples.ts";
import { buildPdfReportBuffer } from "../../src/lib/export/pdfReportExporter.ts";
import { extractPdfText } from "./pdfText.ts";
import { buildCalculatedProject, genericProfile } from "./systemicFixtures.ts";

function volumeForCategory(category: string) {
  if (category === "retail" || category === "ecommerce") return { volumeKey: "traffic", priceKey: "averageTicket" };
  if (category === "rental") return { volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" };
  if (category === "manufacturing") return { volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" };
  if (category === "food_service") return { volumeKey: "dailyOrders", priceKey: "averageTicket" };
  if (category === "b2b" || category === "construction") return { volumeKey: "contractsPerMonth", priceKey: "contractValue" };
  return { volumeKey: "monthlyOrders", priceKey: "averageTicket" };
}

const forbiddenUserFacingLeakage = /требуется проверка|Требуется ручная проверка|Профильный показатель|Контрольный числовой показатель|тестовой сборки|undefined|null|NaN|Infinity|sample default|profile default|raw JSON|\|\s*Выручка от|критичных рисков не выявлено|generic duplicated conclusion|score\s*9\s*[→\-]\s*Низкий/i;

function assertCleanActualPdf(text: string, sampleId: string) {
  assert.match(text, /ИИ Анализ и рекомендации/, `${sampleId}: AI analysis section missing`);
  assert.match(text, /Список источников[\s\S]+\(202\d\)[\s\S]+https?:\/\//, `${sampleId}: Harvard-like references missing`);
  assert.doesNotMatch(text, forbiddenUserFacingLeakage, `${sampleId}: forbidden placeholder/internal leakage in PDF`);
  assert.doesNotMatch(text, /(?:^|\s)9\s+Низкий(?:\s|$)/, `${sampleId}: score 9 rendered as low`);
  assert.doesNotMatch(text, /Риск\s+требуется проверка|проверкаУровень|728\s+посетителей\/мес\./i, `${sampleId}: known final rendering regression`);
}

export async function checkActualPdfSampleRange(start: number, end: number): Promise<void> {
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
    const text = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
    assertCleanActualPdf(text, sample.id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const start = Number(process.argv[2] ?? 0);
  const end = Number(process.argv[3] ?? businessSamples.length);
  await checkActualPdfSampleRange(start, end);
  console.log(`actual PDF sample range ok: ${start}-${end}`);
}
