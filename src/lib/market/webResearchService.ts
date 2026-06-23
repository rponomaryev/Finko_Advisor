import type { BusinessProfile } from "../business/businessClassifier.ts";
import type { StructuredProjectData } from "../types/project.ts";
import { formatSourceListItem, formatSourceCitation, normalizeSourceMetadata, cleanSourceMetadataText } from "../report/sourceCitationFormatter.ts";
import { callOpenAIWithUsageLog, writeAIUsageLog } from "../ai/openaiClient.ts";

export type ResearchSource = {
  id: string;
  organization: string;
  title: string;
  year: string | null;
  publishedDate?: string | null;
  accessedDate: string;
  url: string;
  geography: string;
  sourceType:
    | "official_statistics"
    | "central_bank"
    | "government_portal"
    | "international_organization"
    | "industry_report"
    | "news"
    | "marketplace"
    | "manual_check";
  reliability: "high" | "medium" | "low";
};

export type ResearchedStatistic = {
  id: string;
  indicator: string;
  value: string;
  unit: string;
  year: string | null;
  geography: string;
  sourceId: string;
  matchQuality: "direct" | "strong_proxy" | "broad_proxy" | "manual_check";
  confidence: "high" | "medium" | "low";
  relevance: string;
  businessInterpretation: string;
  howToUseInModel: string;
  limitations: string;
  source?: string;
  sourceUrl?: string;
  citation?: string;
};

export type WebResearchResult = {
  businessType: string;
  region: string;
  researchDate: string;
  summary: string;
  statistics: ResearchedStatistic[];
  sources: ResearchSource[];
  harvardReferences: string[];
  searchQueriesUsed: string[];
  warnings: string[];
  marketContext: string;
};

const BAD_RESEARCH_PLACEHOLDER_RE = /Нужно\s+проверить|Требует\s+уточнения\s+Нужно\s+проверить|проверить\s*=|20\d{2}\s*-\s*Нужно\s+проверить|20\d{2}[a-z]\b|\b(?:undefined|null|NaN|manual_check|unknown)\b|needs\s+verification/i;

const nowIso = () => new Date().toISOString();
const accessedDate = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const marketResearchJsonSchema = {
  type: "object",
  properties: {
    businessType: { type: "string" },
    region: { type: "string" },
    researchDate: { type: "string" },
    summary: { type: "string" },
    statistics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          indicator: { type: "string" },
          value: { type: "string" },
          unit: { type: "string" },
          year: { type: ["string", "null"] },
          geography: { type: "string" },
          sourceId: { type: "string" },
          matchQuality: { type: "string", enum: ["direct", "strong_proxy", "broad_proxy", "manual_check"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          relevance: { type: "string" },
          businessInterpretation: { type: "string" },
          howToUseInModel: { type: "string" },
          limitations: { type: "string" }
        },
        required: ["id", "indicator", "value", "unit", "year", "geography", "sourceId", "matchQuality", "confidence", "relevance", "businessInterpretation", "howToUseInModel", "limitations"],
        additionalProperties: false
      }
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          organization: { type: "string" },
          title: { type: "string" },
          year: { type: ["string", "null"] },
          publishedDate: { type: ["string", "null"] },
          accessedDate: { type: "string" },
          url: { type: "string" },
          geography: { type: "string" },
          sourceType: { type: "string", enum: ["official_statistics", "central_bank", "government_portal", "international_organization", "industry_report", "news", "marketplace", "manual_check"] },
          reliability: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["id", "organization", "title", "year", "publishedDate", "accessedDate", "url", "geography", "sourceType", "reliability"],
        additionalProperties: false
      }
    },
    harvardReferences: { type: "array", items: { type: "string" } },
    searchQueriesUsed: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } }
  },
  required: ["businessType", "region", "researchDate", "summary", "statistics", "sources", "harvardReferences", "searchQueriesUsed", "warnings"],
  additionalProperties: false
} as const;

function localeName(locale: "ru" | "uz" | "en") {
  if (locale === "uz") return "узбекском латинском";
  if (locale === "en") return "английском";
  return "русском";
}

function isChildrenClothing(profile: BusinessProfile, businessType: string) {
  return profile.subcategory === "children_clothing_store" || /детск.*одежд|одежд.*детск|children.*clothing|kids.*clothing/i.test(businessType);
}

function isIceCreamProfile(profile: BusinessProfile, businessType: string) {
  return profile.subcategory?.startsWith("ice_cream") || /морожен|ice\s*cream|рожк|фризер/i.test(businessType);
}

function isDeviceRepair(profile: BusinessProfile, businessType: string) {
  return profile.subcategory === "device_repair" || /ремонт\s*(смартфон|телефон|iphone|samsung|xiaomi)|сервисн\w*\s+центр\w*\s+по\s+ремонту|phone\s*repair|smartphone\s*repair/i.test(businessType);
}

function researchModel() {
  return process.env.OPENAI_RESEARCH_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function safeCategoryList(profile: BusinessProfile) {
  return (profile.recommendedSourceCategories ?? profile.sourceCategories ?? [])
    .filter((item) => typeof item === "string" && item.trim())
    .slice(0, 5);
}

function buildResearchQueries(profile: BusinessProfile, businessType: string, region: string) {
  if (isChildrenClothing(profile, businessType)) {
    return [
      "детская одежда рынок Узбекистан 2024 статистика",
      "розничная торговля одеждой Узбекистан 2024 stat.uz",
      "производство одежды Узбекистан 2024 stat.uz",
      "импорт одежды Узбекистан 2024",
      "индекс потребительских цен одежда обувь Узбекистан 2024",
      `население детей 0-10 лет ${region} статистика`,
      `доходы населения ${region} 2024 статистика`,
      `аренда торговых помещений ${region}`,
      "Instagram commerce детская одежда Узбекистан"
    ];
  }
  if (isDeviceRepair(profile, businessType)) {
    return [
      "сектор услуг населению Узбекистан 2024 2025 stat.uz рост",
      "ремонт смартфонов Ташкент Юнусабад цены 2GIS",
      "ремонт телефонов Узбекистан рынок услуги статистика",
      "импорт мобильных телефонов Узбекистан 2024 статистика",
      "розничная торговля электроникой Узбекистан 2024 stat.uz",
      "индекс потребительских цен услуги связи техника Узбекистан 2024 2025 stat.uz",
      `доходы населения ${region} 2024 статистика`,
      "средняя зарплата мастер по ремонту телефонов Ташкент",
      "курс USD UZS Центральный банк Узбекистан CBU",
      "аксессуары для телефонов Узбекистан цены маркетплейс"
    ];
  }
  if (isIceCreamProfile(profile, businessType)) {
    return [
      "рынок мороженого Узбекистан Ташкент статистика",
      "общественное питание Ташкент Узбекистан статистика 2024",
      "цены мороженое Узбекистан Ташкент",
      "индекс потребительских цен продукты питания Узбекистан 2024 2025 stat.uz",
      `население ${region} статистика`,
      "малый бизнес общественное питание Узбекистан stat.uz",
      "санитарные требования продажа мороженого уличная торговля Узбекистан",
      "USD UZS курс Центральный банк Узбекистан CBU"
    ];
  }
  return [
    `объем рынка ${businessType} в Узбекистане`,
    `количество ${businessType} в ${region}`,
    `средний чек ${businessType} Узбекистан`,
    `рост рынка ${businessType} Узбекистан 2024 2025`,
    ...safeCategoryList(profile).map((category) => `${category} статистика Узбекистан`)
  ];
}

function buildResearchPrompt(profile: BusinessProfile, businessType: string, region: string, locale: "ru" | "uz" | "en") {
  const queries = Array.from(new Set(buildResearchQueries(profile, businessType, region))).slice(0, 10);
  const retailRules = isChildrenClothing(profile, businessType)
    ? `\nДля магазина детской одежды обязательно попытайся найти минимум 5 полезных источников: stat.uz по рознице/одежде/демографии, cbu.uz по курсу, World Bank/ADB по макро или населению, отраслевой/news источник по одежде/текстилю, marketplace/competitor proxy по ассортименту или ценам. Если прямых данных по детской одежде в районе нет, верни proxy и честно объясни limitations.`
    : "";
  const deviceRepairRules = isDeviceRepair(profile, businessType)
    ? `\nДля сервисного центра смартфонов обязательно попытайся найти минимум 5 полезных источников/показателей: рост сектора услуг населению в Узбекистане, курс USD/UZS для импортных запчастей, CPI/инфляция по товарам/услугам, доходы/население Ташкента, proxy по конкурентным ценам ремонта смартфонов и аксессуаров. Разделяй ремонт и продажу аксессуаров. Не используй общие фразы без чисел как statistics.`
    : "";
  return {
    queries,
    prompt: `Найди проверяемые рыночные данные для бизнеса: "${businessType}". Регион проекта: "${region}", Узбекистан.\n\nОбязательные запросы:\n${queries.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n${retailRules}${deviceRepairRules}\n\nВерни только валидный JSON по схеме. Не используй markdown и пояснения вне JSON. Каждая statistics item должна ссылаться на sourceId из sources. url должен быть полным URL. Не создавай statistics из JSON-ключей. В statistics включай только показатели с явным числовым значением, годом/периодом и sourceId. Если надежного числового значения нет, запиши проблему в warnings, но не создавай statistics item со значением "Требуется ручная проверка". Не используй broad services value added как основной показатель для retail/food/children clothing/device repair; если используешь proxy, объясни, как именно он влияет на цену, спрос, запасы, зарплаты или валютный риск. Пиши на ${localeName(locale)} языке.`
  };
}

function responseText(response: unknown): string {
  const direct = (response as { output_text?: string }).output_text;
  if (typeof direct === "string") return direct;
  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  if (Array.isArray(output)) return output.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  return "";
}

function stripMarkdownJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return trimmed;
}

function safeJsonParse(text: string): Partial<WebResearchResult> | null {
  try {
    return JSON.parse(stripMarkdownJson(text)) as Partial<WebResearchResult>;
  } catch {
    return null;
  }
}

function normalizeUrl(url: unknown) {
  const value = String(url ?? "").trim();
  return /^https?:\/\//i.test(value) ? value : "https://manual-check.local/";
}

function harvardReference(source: ResearchSource) {
  return formatSourceListItem({
    author: source.organization,
    title: source.title,
    url: source.url,
    year: source.year,
    accessedDate: source.accessedDate
  }, "en");
}

function fallbackSources(region: string): ResearchSource[] {
  const access = accessedDate();
  return [
    { id: "src_stat_retail", organization: "Agency of Statistics under the President of the Republic of Uzbekistan", title: "Services, retail trade and business statistics", year: null, publishedDate: null, accessedDate: access, url: "https://stat.uz/", geography: "Uzbekistan", sourceType: "official_statistics", reliability: "high" },
    { id: "src_stat_demography", organization: "Agency of Statistics under the President of the Republic of Uzbekistan", title: "Population and demographic statistics", year: null, publishedDate: null, accessedDate: access, url: "https://stat.uz/", geography: region, sourceType: "official_statistics", reliability: "high" },
    { id: "src_cbu", organization: "Central Bank of Uzbekistan", title: "Official exchange rates", year: null, publishedDate: null, accessedDate: access, url: "https://cbu.uz/uz/arkhiv-kursov-valyut/json/", geography: "Uzbekistan", sourceType: "central_bank", reliability: "high" },
    { id: "src_world_bank", organization: "World Bank", title: "Uzbekistan macroeconomic and population indicators", year: null, publishedDate: null, accessedDate: access, url: "https://data.worldbank.org/country/uzbekistan", geography: "Uzbekistan", sourceType: "international_organization", reliability: "high" },
    { id: "src_tax_committee", organization: "Tax Committee of Uzbekistan", title: "Tax regimes, cash register and taxpayer services", year: null, publishedDate: null, accessedDate: access, url: "https://soliq.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_lex_uz", organization: "National legal database LEX.UZ", title: "Laws and regulations for registration, contracts, permits and taxes", year: null, publishedDate: null, accessedDate: access, url: "https://lex.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_my_gov", organization: "Single interactive public services portal", title: "How to apply for public services and business documents", year: null, publishedDate: null, accessedDate: access, url: "https://my.gov.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_license_gov", organization: "License information system", title: "Licenses, permits and notification requirements", year: null, publishedDate: null, accessedDate: access, url: "https://license.gov.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_customs", organization: "Customs Committee of Uzbekistan", title: "Import/export declarations, duties and customs requirements", year: null, publishedDate: null, accessedDate: access, url: "https://customs.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_sanepid", organization: "Sanitary and epidemiological authority", title: "Sanitary and hygiene requirements", year: null, publishedDate: null, accessedDate: access, url: "https://sanepid.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_ecology", organization: "Ministry of Ecology, Environmental Protection and Climate Change", title: "Waste handling and environmental requirements", year: null, publishedDate: null, accessedDate: access, url: "https://eco.gov.uz/", geography: "Uzbekistan", sourceType: "government_portal", reliability: "high" },
    { id: "src_marketplace_check", organization: "2GIS and marketplace competitor proxy", title: "Competitor prices and assortment proxy", year: null, publishedDate: null, accessedDate: access, url: "https://2gis.uz/", geography: region, sourceType: "marketplace", reliability: "low" }
  ];
}

function fallbackResult(businessType: string, region: string, queries: string[], warning: string): WebResearchResult {
  const sources = fallbackSources(region);
  const summary = `Прямые рыночные данные не были надежно получены автоматически. Для ${businessType} используются источники ручной проверки и proxy-точки проверки: официальная статистика, демография, курс валюты, макроиндикаторы и конкурентные цены.`;
  return {
    businessType,
    region,
    researchDate: nowIso(),
    summary,
    marketContext: summary,
    statistics: [],
    sources,
    harvardReferences: sources.map(harvardReference),
    searchQueriesUsed: queries,
    warnings: [warning]
  };
}

function normalizeResearch(raw: Partial<WebResearchResult>, businessType: string, region: string, queries: string[]): WebResearchResult {
  const sourceRows = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = sourceRows.map((item, index) => ({
    id: String((item as ResearchSource).id || `src_${index + 1}`),
    organization: cleanSourceMetadataText((item as ResearchSource).organization) || "Source",
    title: cleanSourceMetadataText((item as ResearchSource).title) || "Market data item",
    year: (item as ResearchSource).year ? String((item as ResearchSource).year) : null,
    publishedDate: (item as ResearchSource).publishedDate ? String((item as ResearchSource).publishedDate) : null,
    accessedDate: String((item as ResearchSource).accessedDate || accessedDate()),
    url: normalizeUrl((item as ResearchSource).url),
    geography: String((item as ResearchSource).geography || region),
    sourceType: ["official_statistics", "central_bank", "government_portal", "international_organization", "industry_report", "news", "marketplace", "manual_check"].includes(String((item as ResearchSource).sourceType)) ? (item as ResearchSource).sourceType : "manual_check",
    reliability: ["high", "medium", "low"].includes(String((item as ResearchSource).reliability)) ? (item as ResearchSource).reliability : "medium"
  })) as ResearchSource[];

  const byId = new Map(sources.map((source) => [source.id, source]));
  const statistics = (Array.isArray(raw.statistics) ? raw.statistics : []).filter((item) => {
    const value = String((item as ResearchedStatistic).value ?? "");
    const text = `${(item as ResearchedStatistic).indicator ?? ""} ${value} ${(item as ResearchedStatistic).businessInterpretation ?? ""} ${(item as ResearchedStatistic).sourceId ?? ""} ${(item as ResearchedStatistic).citation ?? ""}`;
    const hasDigit = /\d/.test(value);
    return hasDigit && !BAD_RESEARCH_PLACEHOLDER_RE.test(text) && !/требуется\s+ручная\s+проверка|надежное\s+числовое\s+значение\s+не\s+найдено|manual\s+check/i.test(text);
  }).map((item, index) => {
    const sourceId = String((item as ResearchedStatistic).sourceId || sources[0]?.id || "src_manual");
    const source = byId.get(sourceId);
    const stat: ResearchedStatistic = {
      id: String((item as ResearchedStatistic).id || `stat_${index + 1}`),
      indicator: cleanSourceMetadataText((item as ResearchedStatistic).indicator) || "Market indicator",
      value: cleanSourceMetadataText((item as ResearchedStatistic).value) || String((item as ResearchedStatistic).value || ""),
      unit: cleanSourceMetadataText((item as ResearchedStatistic).unit) || "",
      year: (item as ResearchedStatistic).year ? String((item as ResearchedStatistic).year) : null,
      geography: String((item as ResearchedStatistic).geography || region),
      sourceId,
      matchQuality: ["direct", "strong_proxy", "broad_proxy", "manual_check"].includes(String((item as ResearchedStatistic).matchQuality)) ? (item as ResearchedStatistic).matchQuality : "manual_check",
      confidence: ["high", "medium", "low"].includes(String((item as ResearchedStatistic).confidence)) ? (item as ResearchedStatistic).confidence : "medium",
      relevance: cleanSourceMetadataText((item as ResearchedStatistic).relevance) || `Показатель помогает проверить бизнес-модель ${businessType}.`,
      businessInterpretation: cleanSourceMetadataText((item as ResearchedStatistic).businessInterpretation) || "Использовать как proxy, а не как доказательство спроса конкретной точки.",
      howToUseInModel: cleanSourceMetadataText((item as ResearchedStatistic).howToUseInModel) || "Сравнить с ценой, маржей, запасом, арендой или трафиком.",
      limitations: cleanSourceMetadataText((item as ResearchedStatistic).limitations) || "Не заменяет локальную проверку спроса и коммерческие предложения."
    };
    const normalizedSource = source ? normalizeSourceMetadata({ author: source.organization, url: source.url, year: source.year }, "en") : null;
    stat.source = normalizedSource?.displayName ?? "Manual check";
    stat.sourceUrl = normalizedSource?.url ?? source?.url;
    stat.citation = source ? formatSourceCitation({ author: source.organization, url: source.url, year: source.year }, "en") : "(Manual check)";
    return stat;
  });

  const warnings = Array.isArray(raw.warnings) ? raw.warnings.map(String) : [];
  const fallback = fallbackSources(region);
  for (const source of fallback) {
    if (sources.length >= 5) break;
    if (!sources.some((item) => item.id === source.id || item.url === source.url)) sources.push(source);
  }

  const summary = String(raw.summary || "Рыночные данные требуют интерпретации как прямые данные или proxy, но не как гарантию спроса.");
  return {
    businessType: String(raw.businessType || businessType),
    region: String(raw.region || region),
    researchDate: String(raw.researchDate || nowIso()),
    summary,
    marketContext: summary,
    statistics,
    sources,
    harvardReferences: Array.isArray(raw.harvardReferences) && raw.harvardReferences.length ? raw.harvardReferences.map(String) : sources.map(harvardReference),
    searchQueriesUsed: Array.isArray(raw.searchQueriesUsed) && raw.searchQueriesUsed.length ? raw.searchQueriesUsed.map(String) : queries,
    warnings
  };
}

export async function conductMarketResearch(
  profile: BusinessProfile,
  project: Partial<StructuredProjectData> & { id?: string },
  locale: "ru" | "uz" | "en" = "ru"
): Promise<WebResearchResult> {
  const region = [project.region, project.district].filter(Boolean).join(", ") || "Узбекистан";
  const businessType = project.businessType ?? profile.subcategory ?? profile.category;
  const { prompt, queries } = buildResearchPrompt(profile, businessType, region, locale);

  if (process.env.ENABLE_WEB_RESEARCH !== "true" || process.env.AI_PROVIDER !== "openai" || !process.env.OPENAI_API_KEY) {
    await writeAIUsageLog({
      projectId: project.id ?? project.title,
      operation: "market_research",
      provider: process.env.AI_PROVIDER || "fallback",
      model: researchModel(),
      status: "fallback",
      fallbackUsed: true,
      errorMessage: "Web research disabled or OpenAI not configured",
      webSearchUsed: false,
      webSearchCalls: 0
    });
    return fallbackResult(businessType, region, queries, "Web research disabled or OpenAI not configured");
  }

  try {
    const response = await callOpenAIWithUsageLog({
      projectId: (project as { id?: string }).id,
      operation: "market_research",
      model: researchModel(),
      webSearchUsed: true,
      webSearchCalls: 1,
      request: (client) => client.responses.create({
        model: researchModel(),
        max_output_tokens: Number(process.env.OPENAI_RESEARCH_MAX_TOKENS ?? 5000),
        tools: [{
          type: "web_search",
          search_context_size: process.env.OPENAI_WEB_SEARCH_CONTEXT_SIZE || "medium",
          return_token_budget: "unlimited"
        }],
        input: [
          {
            role: "system",
            content: `Ты - исследовательский аналитик FINKO. Приоритет источников: stat.uz, cbu.uz, soliq.uz, my.gov.uz, lex.uz/license.gov.uz, customs.uz, sanepid.uz, eco.gov.uz, World Bank/ADB, затем отраслевые/news и marketplace proxy. Если внутреннего registry источников недостаточно для налогов или документов, явно ищи актуальную информацию в интернете и возвращай конкретный путь получения документа: орган/портал, действие, документы, срок, стоимость/госпошлина если источник ее подтверждает. Нельзя придумывать числа. Statistics допускаются только с числовым value, периодом и источником; если числа нет, добавь warning, а не фиктивный показатель. Ответ только JSON по schema. Язык: ${localeName(locale)}.`
          },
          { role: "user", content: prompt }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "finko_market_research",
            strict: true,
            schema: marketResearchJsonSchema
          }
        }
      } as never)
    });

    const parsed = safeJsonParse(responseText(response));
    if (!parsed) throw new Error("Market research JSON parsing failed");
    return normalizeResearch(parsed, businessType, region, queries);
  } catch (error) {
    await writeAIUsageLog({
      projectId: (project as { id?: string }).id,
      operation: "market_research",
      provider: "openai",
      model: researchModel(),
      status: "fallback",
      fallbackUsed: true,
      webSearchUsed: true,
      webSearchCalls: 1,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return fallbackResult(businessType, region, queries, error instanceof Error ? error.message : String(error));
  }
}
