import test from "node:test";
import assert from "node:assert/strict";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { extractPdfText } from "./helpers/pdfText.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const scenarios = [
  { name: "unknown retail", profile: genericProfile({ businessType: "Новый розничный магазин товаров", category: "retail", volumeKey: "traffic", priceKey: "averageTicket", overrides: { averagePurchaseCost: 80_000 } }) },
  { name: "unknown service", profile: genericProfile({ businessType: "Сервис по обслуживанию оборудования", category: "services", volumeKey: "ordersPerDay", priceKey: "servicePrice" }) },
  { name: "unknown B2B", profile: genericProfile({ businessType: "B2B поставки расходных материалов", category: "b2b", volumeKey: "contractsPerMonth", priceKey: "contractValue" }) },
  { name: "unknown rental", profile: genericProfile({ businessType: "Аренда оборудования для мероприятий", category: "rental", volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" }) },
  { name: "unknown manufacturing", profile: genericProfile({ businessType: "Производственный цех товаров", category: "manufacturing", volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit", overrides: { rawMaterialCostPerUnit: 60_000 } }) },
  { name: "unknown mixed/import", profile: genericProfile({ businessType: "Импорт и продажа оборудования", category: "import_export", volumeKey: "monthlyOrders", priceKey: "averageTicket", overrides: { foreignCurrencyPurchases: true, supplierCurrency: "USD", averagePurchaseCost: 90_000 } }) }
];

const forbidden = /требуется проверка|Требуется ручная проверка|Профильный показатель|Контрольный числовой показатель|тестовой сборки|undefined|null|NaN|Infinity|sample default|profile default|raw JSON|критичных рисков не выявлено|generic duplicated conclusion/i;

for (const scenario of scenarios) {
  test(`actual PDF is clean and business-aware for generic scenario: ${scenario.name}`, async () => {
    const project = buildCalculatedProject(scenario.profile);
    const text = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
    assert.match(text, /ИИ Анализ и рекомендации/);
    assert.match(text, /Список источников[\s\S]+\(202\d\)[\s\S]+https?:\/\//);
    assert.doesNotMatch(text, forbidden);
    assert.doesNotMatch(text, /(?:^|\s)9\s+Низкий(?:\s|$)|проверкаУровень|Риск\s+требуется проверка/i);
    assert.match(text, /Месячная выручка|Финансовая модель/);
  });
}
