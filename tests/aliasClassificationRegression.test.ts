import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness, type BusinessClassificationResult } from "../src/lib/business/businessClassifier.ts";
import { buildReportSourcePack, buildReportUserPrompt, generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { buildUniversalAiAnalysis } from "../src/lib/report/evidenceEngine.ts";
import type { WebResearchResult } from "../src/lib/market/webResearchService.ts";
import { createExportProject } from "./reportFixtures.ts";

type Locale = "ru" | "uz" | "en";

type AliasCase = {
  phrase: string;
  expectedSampleId: string;
};

function getMatchedSampleId(profile: BusinessClassificationResult): string | undefined {
  const sampleId = (profile.aiClassification as { sampleId?: unknown } | undefined)?.sampleId;
  return typeof sampleId === "string" ? sampleId : profile.subcategory;
}

function assertClassifiesTo({ phrase, expectedSampleId }: AliasCase, language: Locale) {
  const profile = classifyBusiness({
    businessType: phrase,
    businessIdea: phrase,
    productOrService: phrase,
    language
  });

  assert.equal(
    getMatchedSampleId(profile),
    expectedSampleId,
    `Expected "${phrase}" (${language}) to classify as ${expectedSampleId}, got ${getMatchedSampleId(profile)}`
  );
  assert.ok(
    profile.confidence >= 0.65,
    `Expected "${phrase}" (${language}) confidence >= 0.65, got ${profile.confidence}`
  );
}

const uzAliasCases: AliasCase[] = [
  { phrase: "velosiped ijarasi", expectedSampleId: "bike_scooter_rental" },
  { phrase: "samokat ijarasi", expectedSampleId: "bike_scooter_rental" },
  { phrase: "velosiped prokati", expectedSampleId: "bike_scooter_rental" },
  { phrase: "sartaroshxona", expectedSampleId: "hairdresser" },
  { phrase: "soch kesish", expectedSampleId: "hairdresser" },
  { phrase: "go'zallik saloni", expectedSampleId: "beauty_salon_sample" },
  { phrase: "gozallik saloni", expectedSampleId: "beauty_salon_sample" },
  { phrase: "tirnoq saloni", expectedSampleId: "nail_studio" },
  { phrase: "manikur", expectedSampleId: "nail_studio" },
  { phrase: "kichik kofexona", expectedSampleId: "small_coffee_shop" },
  { phrase: "kofe", expectedSampleId: "small_coffee_shop" },
  { phrase: "kofexona", expectedSampleId: "small_coffee_shop" },
  { phrase: "nonvoyxona", expectedSampleId: "neighborhood_bakery" },
  { phrase: "non", expectedSampleId: "neighborhood_bakery" },
  { phrase: "tezkor ovqat", expectedSampleId: "fast_food_cafe" },
  { phrase: "fastfud", expectedSampleId: "fast_food_cafe" },
  { phrase: "telefon ta'miri", expectedSampleId: "phone_repair_workshop" },
  { phrase: "kompyuter ta'miri", expectedSampleId: "laptop_repair_workshop" },
  { phrase: "avto yuvish", expectedSampleId: "car_wash_sample" },
  { phrase: "mashina yuvish", expectedSampleId: "car_wash_sample" },
  { phrase: "moyka", expectedSampleId: "car_wash_sample" },
  { phrase: "avtoservis", expectedSampleId: "auto_repair_shop" },
  { phrase: "mashina ta'miri", expectedSampleId: "auto_repair_shop" },
  { phrase: "ingliz tili kurslari", expectedSampleId: "english_language_center" },
  { phrase: "ingliz tili", expectedSampleId: "english_language_center" },
  { phrase: "IELTS tayyorlov", expectedSampleId: "ielts_preparation_center" },
  { phrase: "IELTS kursi", expectedSampleId: "ielts_preparation_center" },
  { phrase: "bolalar markazi", expectedSampleId: "children_development_center" },
  { phrase: "rivojlantirish markazi", expectedSampleId: "children_development_center" },
  { phrase: "xususiy bog'cha", expectedSampleId: "private_kindergarten" },
  { phrase: "bolalar bog'chasi", expectedSampleId: "private_kindergarten" },
  { phrase: "fitnes studiya", expectedSampleId: "fitness_studio" },
  { phrase: "sport zali", expectedSampleId: "fitness_studio" },
  { phrase: "yoga studiyasi", expectedSampleId: "yoga_studio" },
  { phrase: "yoga", expectedSampleId: "yoga_studio" },
  { phrase: "massaj xonasi", expectedSampleId: "massage_cabinet" },
  { phrase: "massaj", expectedSampleId: "massage_cabinet" },
  { phrase: "muzqaymoq", expectedSampleId: "ice_cream_point" },
  { phrase: "muzqaymoq nuqtasi", expectedSampleId: "ice_cream_point" },
  { phrase: "bolalar kiyimi do'koni", expectedSampleId: "children_clothing_store_sample" },
  { phrase: "bolalar kiyimi", expectedSampleId: "children_clothing_store_sample" },
  { phrase: "ayollar kiyimi do'koni", expectedSampleId: "women_clothing_store" },
  { phrase: "ayollar kiyimi", expectedSampleId: "women_clothing_store" },
  { phrase: "poyabzal do'koni", expectedSampleId: "shoe_store" },
  { phrase: "oyoq kiyim", expectedSampleId: "shoe_store" },
  { phrase: "onlayn kiyim do'koni", expectedSampleId: "online_clothing_store" },
  { phrase: "onlayn kiyim", expectedSampleId: "online_clothing_store" },
  { phrase: "kiyim ta'mirlash atelyesi", expectedSampleId: "clothing_alteration_atelier" },
  { phrase: "ofis oshxonasi", expectedSampleId: "office_canteen" },
  { phrase: "tashkilot uchun ovqatlanish", expectedSampleId: "office_canteen" },
  { phrase: "pitsa yetkazib berish", expectedSampleId: "pizza_delivery" },
  { phrase: "pitsa", expectedSampleId: "pizza_delivery" },
  { phrase: "burger do'koni", expectedSampleId: "burger_shop" },
  { phrase: "burgerxona", expectedSampleId: "burger_shop" },
  { phrase: "shinomontaj", expectedSampleId: "tire_service" },
  { phrase: "barbershop", expectedSampleId: "barbershop" },
  { phrase: "erkaklar soch kesish", expectedSampleId: "barbershop" }
];

const enAliasCases: AliasCase[] = [
  { phrase: "bicycle rental", expectedSampleId: "bike_scooter_rental" },
  { phrase: "bike rental", expectedSampleId: "bike_scooter_rental" },
  { phrase: "scooter rental", expectedSampleId: "bike_scooter_rental" },
  { phrase: "bike hire", expectedSampleId: "bike_scooter_rental" },
  { phrase: "hair salon", expectedSampleId: "hairdresser" },
  { phrase: "hairdresser", expectedSampleId: "hairdresser" },
  { phrase: "beauty salon", expectedSampleId: "beauty_salon_sample" },
  { phrase: "spa salon", expectedSampleId: "beauty_salon_sample" },
  { phrase: "nail salon", expectedSampleId: "nail_studio" },
  { phrase: "manicure", expectedSampleId: "nail_studio" },
  { phrase: "coffee shop", expectedSampleId: "small_coffee_shop" },
  { phrase: "cafe", expectedSampleId: "small_coffee_shop" },
  { phrase: "bakery", expectedSampleId: "neighborhood_bakery" },
  { phrase: "bread shop", expectedSampleId: "neighborhood_bakery" },
  { phrase: "fast food", expectedSampleId: "fast_food_cafe" },
  { phrase: "snack bar", expectedSampleId: "fast_food_cafe" },
  { phrase: "phone repair", expectedSampleId: "phone_repair_workshop" },
  { phrase: "device repair", expectedSampleId: "phone_repair_workshop" },
  { phrase: "computer repair", expectedSampleId: "laptop_repair_workshop" },
  { phrase: "car wash", expectedSampleId: "car_wash_sample" },
  { phrase: "auto wash", expectedSampleId: "car_wash_sample" },
  { phrase: "auto service", expectedSampleId: "auto_repair_shop" },
  { phrase: "car repair", expectedSampleId: "auto_repair_shop" },
  { phrase: "english courses", expectedSampleId: "english_language_center" },
  { phrase: "language school", expectedSampleId: "english_language_center" },
  { phrase: "IELTS prep", expectedSampleId: "ielts_preparation_center" },
  { phrase: "exam preparation", expectedSampleId: "ielts_preparation_center" },
  { phrase: "kids development", expectedSampleId: "children_development_center" },
  { phrase: "children center", expectedSampleId: "children_development_center" },
  { phrase: "private kindergarten", expectedSampleId: "private_kindergarten" },
  { phrase: "daycare", expectedSampleId: "private_kindergarten" },
  { phrase: "fitness studio", expectedSampleId: "fitness_studio" },
  { phrase: "gym", expectedSampleId: "fitness_studio" },
  { phrase: "yoga studio", expectedSampleId: "yoga_studio" },
  { phrase: "yoga classes", expectedSampleId: "yoga_studio" },
  { phrase: "massage", expectedSampleId: "massage_cabinet" },
  { phrase: "massage salon", expectedSampleId: "massage_cabinet" },
  { phrase: "ice cream", expectedSampleId: "ice_cream_point" },
  { phrase: "ice cream stand", expectedSampleId: "ice_cream_point" },
  { phrase: "children clothing store", expectedSampleId: "children_clothing_store_sample" },
  { phrase: "women clothing store", expectedSampleId: "women_clothing_store" },
  { phrase: "shoe store", expectedSampleId: "shoe_store" },
  { phrase: "footwear shop", expectedSampleId: "shoe_store" },
  { phrase: "online clothing store", expectedSampleId: "online_clothing_store" },
  { phrase: "alteration atelier", expectedSampleId: "clothing_alteration_atelier" },
  { phrase: "office canteen", expectedSampleId: "office_canteen" },
  { phrase: "corporate catering", expectedSampleId: "office_canteen" },
  { phrase: "pizza delivery", expectedSampleId: "pizza_delivery" },
  { phrase: "burger shop", expectedSampleId: "burger_shop" },
  { phrase: "hamburger", expectedSampleId: "burger_shop" },
  { phrase: "tire service", expectedSampleId: "tire_service" },
  { phrase: "barbershop", expectedSampleId: "barbershop" },
  { phrase: "men hair salon", expectedSampleId: "barbershop" }
];

const tzAliasRowsWithoutCurrentSamples: AliasCase[] = [
  { phrase: "bolalar elektr mashinasi", expectedSampleId: "children_electric_car" },
  { phrase: "elektromobil ijarasi", expectedSampleId: "children_electric_car" },
  { phrase: "kids electric car ride", expectedSampleId: "children_electric_car" },
  { phrase: "children electric car", expectedSampleId: "children_electric_car" },
  { phrase: "asbob ijarasi", expectedSampleId: "tool_rental" },
  { phrase: "instrument ijarasi", expectedSampleId: "tool_rental" },
  { phrase: "tool rental", expectedSampleId: "tool_rental" },
  { phrase: "equipment hire", expectedSampleId: "tool_rental" }
];

function createReportInput(locale: Locale, overrides: Record<string, unknown> = {}) {
  const fixture = createExportProject(locale);
  const baseProject = fixture.structuredData;
  const project = {
    ...baseProject,
    ...overrides,
    userLanguage: locale,
    businessProfile: classifyBusiness({
      businessType: String(overrides.businessType ?? baseProject.businessType ?? ""),
      businessIdea: String(overrides.businessIdea ?? baseProject.businessIdea ?? ""),
      productOrService: String(overrides.productOrService ?? baseProject.productOrService ?? ""),
      language: locale
    })
  };

  return {
    project,
    financial: fixture.financialResult,
    risks: fixture.riskResult,
    feasibilityScore: fixture.feasibilityScore,
    bankReadinessScore: fixture.bankReadinessScore,
    webResearch: null,
    locale
  };
}

function createWebResearchWithAllowedSource(): WebResearchResult {
  return {
    businessType: "coffee shop",
    region: "Tashkent",
    researchDate: "2026-06-23",
    summary: "Official statistics fixture for citation whitelist regression.",
    marketContext: "Fixture market context.",
    searchQueriesUsed: ["coffee shop Uzbekistan official statistics"],
    warnings: [],
    harvardReferences: [],
    sources: [
      {
        id: "stat_uz_fixture",
        organization: "National Statistics Committee",
        title: "Service-sector statistics for Uzbekistan",
        year: "2026",
        publishedDate: "2026-01-01",
        accessedDate: "23 June 2026",
        url: "https://stat.uz",
        geography: "Uzbekistan",
        sourceType: "official_statistics",
        reliability: "high"
      }
    ],
    statistics: [
      {
        id: "service_sector_growth_fixture",
        indicator: "Service-sector turnover growth",
        value: "7.7",
        unit: "%",
        year: "2026",
        geography: "Uzbekistan",
        sourceId: "stat_uz_fixture",
        matchQuality: "strong_proxy",
        confidence: "high",
        relevance: "Macro demand proxy for a service business",
        businessInterpretation: "Shows the macro background for service demand but does not prove demand for one coffee shop.",
        howToUseInModel: "Use only as proxy context.",
        limitations: "Not specific to one location or narrow format.",
        source: "National Statistics Committee",
        sourceUrl: "https://stat.uz",
        citation: "(National Statistics Committee, 2026)"
      }
    ]
  };
}

function citationWhitelistViolations(
  citations: Array<{ source: string }>,
  allowedSourceIds: Set<string>
): string[] {
  return citations
    .map((citation) => citation.source)
    .filter((source) => !allowedSourceIds.has(source));
}

test("UZ aliases from TZ Part 2 classify to the expected samples without AI fallback", () => {
  for (const aliasCase of uzAliasCases) {
    assertClassifiesTo(aliasCase, "uz");
  }
});

test("EN aliases from TZ Part 2 classify to the expected samples without AI fallback", () => {
  for (const aliasCase of enAliasCases) {
    assertClassifiesTo(aliasCase, "en");
  }
});

test("TZ Part 2 alias rows for samples missing from current 120-sample registry are tracked", { todo: "Enable when children_electric_car and tool_rental samples exist in businessSamples.ts." }, () => {
  for (const aliasCase of tzAliasRowsWithoutCurrentSamples) {
    assertClassifiesTo(aliasCase, aliasCase.phrase.includes(" ") ? "uz" : "en");
  }
});

test("empty evidence behavior explicitly states that direct narrow-segment data is absent", () => {
  const input = createReportInput("en", {
    businessType: "Bike rental",
    businessIdea: "Hourly bike and scooter rental near a city park",
    productOrService: "Bike and scooter rental"
  });

  const text = buildUniversalAiAnalysis({
    project: input.project,
    financial: input.financial,
    webResearch: null,
    locale: "en"
  });

  assert.match(text, /No direct official numeric indicator for the narrow segment/i);
  assert.match(text, /proxy sources/i);
  assert.match(text, /do not replace test sales, traffic measurement and supplier quotations/i);
  assert.doesNotMatch(text, /\b(undefined|null|NaN|manual_check|sourceUrl|citation)\b/i);
});

test("citation whitelist validation rejects invented source IDs and accepts allowed report sources", () => {
  const input = createReportInput("en", {
    businessType: "Coffee shop",
    businessIdea: "Small coffee shop near a university",
    productOrService: "Coffee and desserts"
  });
  const sourcePack = buildReportSourcePack(input.project, "en");
  const allowedSourceIds = new Set(Object.values(sourcePack).flat().map((source) => source.id));

  assert.ok(allowedSourceIds.size > 0, "Expected source pack to expose at least one allowed source id.");

  const validCitation = { source: Array.from(allowedSourceIds)[0], title: "Allowed source", year: "2026" };
  const inventedCitation = { source: "invented_source_id", title: "Invented source", year: "2026" };

  assert.deepEqual(citationWhitelistViolations([validCitation], allowedSourceIds), []);
  assert.deepEqual(citationWhitelistViolations([inventedCitation], allowedSourceIds), ["invented_source_id"]);

  const prompt = buildReportUserPrompt(input);
  assert.match(prompt, /source должен быть одним из разрешённых id\/source names/i);
  assert.doesNotMatch(prompt, /invented_source_id/i);
});

test("fallback report citations are derived from provided evidence and do not invent source IDs", () => {
  const input = createReportInput("en", {
    businessType: "Coffee shop",
    businessIdea: "Small coffee shop near a university",
    productOrService: "Coffee and desserts"
  });
  const webResearch = createWebResearchWithAllowedSource();
  const report = generateFallbackReport({
    ...input,
    webResearch
  });

  const allowedSources = new Set([
    ...webResearch.sources.map((source) => source.organization),
    ...webResearch.sources.map((source) => source.id)
  ]);

  assert.ok(report.citations.length > 0, "Expected fallback report to include citations from evidence facts.");
  assert.equal(report.citations.some((citation) => citation.source === "invented_source_id"), false);
  assert.deepEqual(citationWhitelistViolations(report.citations, allowedSources), []);
  assert.deepEqual(
    report.citations.map((citation) => Object.keys(citation).sort()),
    report.citations.map(() => ["source", "text", "title", "url", "year"].sort())
  );
});

test("language enforcement prompt tail requires Uzbek output even when input data is Russian", () => {
  const prompt = buildReportUserPrompt(createReportInput("uz", {
    businessType: "Кофейня",
    businessIdea: "Хочу открыть небольшую кофейню возле университета",
    productOrService: "Кофе, чай и десерты"
  }));

  assert.match(prompt, /Butun JSON javobi faqat o'zbek tilida/i);
  assert.match(prompt, /lotin alifbosida/i);
  assert.match(prompt, /Kiruvchi ma'lumot rus yoki ingliz tilida bo'lishi mumkin/i);
});

test("language enforcement prompt tail requires English output even when input data is Russian", () => {
  const prompt = buildReportUserPrompt(createReportInput("en", {
    businessType: "Кофейня",
    businessIdea: "Хочу открыть небольшую кофейню возле университета",
    productOrService: "Кофе, чай и десерты"
  }));

  assert.match(prompt, /The entire JSON response must be in English only/i);
  assert.match(prompt, /User input can be Russian or Uzbek/i);
  assert.match(prompt, /translate all analysis values into English/i);
});

test("Uzbek input produces Uzbek fallback report text", () => {
  const input = createReportInput("uz", {
    businessType: "Kichik qahvaxona",
    businessIdea: "Universitet yaqinida kichik qahvaxona ochmoqchiman",
    productOrService: "Qahva, choy va desertlar"
  });
  const report = generateFallbackReport(input);
  const text = [
    report.executiveSummary,
    report.marketAnalysis,
    report.businessModelAssessment,
    report.financialAnalysis,
    report.riskAssessment,
    report.actionPlan,
    report.investmentReadiness,
    report.fullNarrative
  ].join("\n");

  assert.match(text, /loyihasi|Moliyaviy model|Keyingi qadam|tahlil/i);
  assert.doesNotMatch(text, /Проект|Финансовая модель|Следующий шаг|The project|The financial model/i);
});

test("English input produces English fallback report text", () => {
  const input = createReportInput("en", {
    businessType: "Coffee shop",
    businessIdea: "I want to open a small coffee shop near a university",
    productOrService: "Coffee, tea and desserts"
  });
  const report = generateFallbackReport(input);
  const text = [
    report.executiveSummary,
    report.marketAnalysis,
    report.businessModelAssessment,
    report.financialAnalysis,
    report.riskAssessment,
    report.actionPlan,
    report.investmentReadiness,
    report.fullNarrative
  ].join("\n");

  assert.match(text, /Project|The financial model|The next step|Financing readiness/i);
  assert.doesNotMatch(text, /Проект|Финансовая модель|Следующий шаг|loyihasi|Moliyaviy model|Keyingi qadam/i);
});
