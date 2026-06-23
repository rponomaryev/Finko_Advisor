import test from "node:test";
import assert from "node:assert/strict";
import { selectRelevantSourcesForReport } from "../src/lib/data/sourceRegistry.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

const domains = (sources: Array<{ url?: string }>) => new Set(sources.map((source) => new URL(source.url ?? "https://example.com").hostname.replace(/^www\./, "")));

test("source selection returns different relevant packs by report section", () => {
  const project = childrenClothingProfile();
  const documents = selectRelevantSourcesForReport(project, "documents", 8, "ru");
  const market = selectRelevantSourcesForReport(project, "market_data", 10, "ru");
  const risks = selectRelevantSourcesForReport(project, "risk_matrix", 8, "ru");

  const documentUrls = documents.map((source) => source.url).join(" ");
  assert.match(documentUrls, /my\.gov\.uz/);
  assert.match(documentUrls, /soliq\.uz/);
  assert.match(documentUrls, /license\.gov\.uz|lex\.uz/);
  assert.match(documentUrls, /mehnat\.uz|mchs\.uz|favqulodda\.uz|customs\.uz/);

  const marketUrls = market.map((source) => source.url).join(" ");
  assert.match(marketUrls, /stat\.uz|siat\.stat\.uz|cbu\.uz|worldbank\.org|adb\.org|ebrd\.com|ifc\.org/i);

  const riskUrls = risks.map((source) => source.url).join(" ");
  assert.match(riskUrls, /cbu\.uz|soliq\.uz|customs\.uz|stat\.uz|lex\.uz/i);
  assert.ok(domains([...documents, ...market, ...risks]).size >= 5, "selected packs should not use one domain only");
});
