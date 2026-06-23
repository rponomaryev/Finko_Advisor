import test from "node:test";
import assert from "node:assert/strict";
import { buildBusinessContext, filterWebResearchSourcesForReport, isSourceRelevantToBusiness, selectEvidenceFacts } from "../src/lib/report/evidenceEngine.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

function atelierProfile() {
  return genericProfile({ businessType: "Ателье по ремонту одежды", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { businessIdea: "ремонт одежды, подгонка, подшив, замена молний", businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service" } } });
}

test("evidence selection keeps service/population/pricing sources and rejects unrelated construction source", () => {
  const profile = atelierProfile();
  const project = buildCalculatedProject(profile);
  const context = buildBusinessContext(profile, project.financialResult as never, "ru");
  const constructionSource = { id: "construction_bad", name: "Количество строительных предприятий на 1 июля 2024 года", url: "https://stat.uz/img/qurilish-", sourceType: "official_statistics" as const, countryScope: "UZ" as const, reliability: "high" as const, applicableCategories: ["construction"], indicators: ["construction"], useCases: ["construction"] };
  const serviceSource = { id: "services_good", name: "Статистика услуг и цен", url: "https://stat.uz", sourceType: "official_statistics" as const, countryScope: "UZ" as const, reliability: "very_high" as const, applicableCategories: ["services"], indicators: ["services", "prices"], useCases: ["service demand context"] };
  assert.equal(isSourceRelevantToBusiness(constructionSource, context), false);
  assert.equal(isSourceRelevantToBusiness(serviceSource, context), true);

  const webResearch = {
    businessType: String(profile.businessType),
    region: "Ташкент город, Чиланзар",
    researchDate: "2026-06-22",
    summary: "",
    marketContext: "",
    searchQueriesUsed: [],
    warnings: [],
    harvardReferences: [],
    statistics: [],
    sources: [
      { id: "construction_bad", organization: "stat.uz", title: "Количество строительных предприятий на 1 июля 2024 года", year: "2024", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/img/qurilish-", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const },
      { id: "price_good", organization: "Национальный комитет по статистике", title: "Цены на швейные услуги выросли на 7,1 % в 2025 году", year: "2025", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/ru/press-tsentr/novosti-goskomstata/66772", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const }
    ]
  };
  const sources = filterWebResearchSourcesForReport(webResearch, context, 10);
  assert.deepEqual(sources.map((source) => source.id), ["price_good"]);
  const facts = selectEvidenceFacts({ project: profile, financial: project.financialResult as never, webResearch, locale: "ru" });
  assert.equal(facts.length, 1);
  assert.match(facts[0].sourceTitle, /швейные услуги/i);
});
