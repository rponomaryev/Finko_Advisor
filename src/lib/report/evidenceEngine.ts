import type { AppLocale } from "../i18n/index.ts";
import type { WebResearchResult, ResearchSource, ResearchedStatistic } from "../market/webResearchService.ts";
import { selectRelevantSourcesForReport, type DataSource } from "../data/sourceRegistry.ts";
import { cleanSourceMetadataText, formatSourceCitation, normalizeSourceMetadata } from "./sourceCitationFormatter.ts";
import type { FinancialResult, StructuredProjectData } from "../types/project.ts";

export type EvidenceRelevance = "direct" | "proxy" | "context";
export type EvidenceConfidence = "high" | "medium" | "low";
export type EvidenceBusinessUse = "demand" | "pricing" | "cost" | "financing" | "regulation" | "population" | "competition" | "macro";

export type BusinessContext = {
  businessType: string;
  description: string;
  category?: string;
  subcategory?: string;
  businessModel?: string;
  region?: string;
  district?: string;
  language: AppLocale;
  financials: {
    monthlyRevenue?: number;
    monthlyVolume?: number;
    averagePrice?: number;
    grossMargin?: number;
    ebitda?: number;
    dscr?: number;
    paybackMonths?: number;
    ownFundsShare?: number;
    fundingGap?: number;
  };
};

export type EvidenceFact = {
  metricName: string;
  value: string | number;
  unit?: string;
  period?: string;
  geography?: string;
  sourceTitle: string;
  sourcePublisher: string;
  sourceUrl: string;
  relevance: EvidenceRelevance;
  confidence: EvidenceConfidence;
  businessUse: EvidenceBusinessUse;
  interpretation: string;
  citation: string;
};

const BAD_USER_FACING_RE = /Нужно\s+проверить|Данные\s+нужно\s+подтвердить|Требует\s+уточнения\s+Нужно\s+проверить|проверить\s*=|20\d{2}\s*-\s*Нужно\s+проверить|20\d{2}[a-z]\b|\b(?:undefined|null|NaN|Infinity)\b|manual_check|needs\s+verification|unknown/i;
const NUMERIC_RE = /\d/;

function normalizeText(value: unknown): string {
  return cleanSourceMetadataText(value)?.replace(/\s{2,}/g, " ").trim() ?? "";
}

export function hasAiAnalysisPlaceholderLeak(value: unknown): boolean {
  return BAD_USER_FACING_RE.test(String(value ?? ""));
}

export function cleanAiAnalysisText(value: unknown, locale: AppLocale): string {
  const neutral = locale === "en" ? "needs clarification" : locale === "uz" ? "aniqlashtirish kerak" : "требует уточнения";
  const cleanNeutral = locale === "en" ? "needs confirmation" : locale === "uz" ? "tasdiqlash kerak" : "требует подтверждения";
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/([^\n])\s*(#{1,6}\s*\d+[.)]?\s+)/g, "$1\n\n$2")
    .replace(/Требует\s+уточнения\s+Нужно\s+проверить/gi, cleanNeutral)
    .replace(/Нужно\s+проверить/gi, cleanNeutral)
    .replace(/Данные\s+нужно\s+подтвердить/gi, cleanNeutral)
    .replace(/проверить\s*=\s*\d+/gi, "")
    .replace(/20\d{2}\s*-\s*Нужно\s+проверить/gi, "")
    .replace(/\b20\d{2}[a-z]\b/gi, (match) => match.slice(0, 4))
    .replace(/\b(?:undefined|null|NaN|Infinity|manual_check|unknown)\b/gi, "")
    .replace(new RegExp(`${neutral}\\s+${neutral}`, "gi"), cleanNeutral)
    .replace(new RegExp(`(?:^|[.;:])\\s*${neutral}\\s*(?=[.;:]|$)`, "gi"), (match) => match.charAt(0).match(/[.;:]/) ? `${match.charAt(0)} ${cleanNeutral}` : cleanNeutral)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function profileText(context: BusinessContext): string {
  return [context.businessType, context.description, context.category, context.subcategory, context.businessModel, context.region, context.district]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function detectBusinessEvidenceFamily(context: BusinessContext): "service" | "retail" | "manufacturing" | "agriculture" | "rental" | "b2b" | "logistics" | "generic" {
  const text = profileText(context);
  if (/агро|ферм|farm|agriculture|crop|livestock|теплиц|скот|птиц/.test(text)) return "agriculture";
  if (/прокат|аренд|rental|lease|leasing|велосипед|самокат/.test(text)) return "rental";
  if (/b2b|контракт|оптов|поставк|тендер|corporate|contract/.test(text)) return "b2b";
  if (/логист|transport|delivery|доставк|груз|fleet/.test(text)) return "logistics";
  if (/производ|manufactur|цех|workshop|bakery|пекар|мебел|bottling|розлив|water/.test(text)) return "manufacturing";
  if (/retail|розниц|магазин|store|маркет|e-?commerce|товар|ассортимент|остатк|склад|размерный\s+ряд/.test(text) && !/ателье|подгонк|подшив|ремонт\s+одежд|alteration|tailor/.test(text)) return "retail";
  if (/service|услуг|сервис|ремонт|мойк|cleaning|ателье|tailor|alteration|education|обуч|beauty|clinic|консалт/.test(text)) return "service";
  return "generic";
}

export function buildBusinessContext(project: StructuredProjectData, financial?: FinancialResult | null, locale: AppLocale = "ru"): BusinessContext {
  const profile = (project.businessProfile ?? {}) as Record<string, unknown>;
  const fin = financial ?? (project as StructuredProjectData & { financialResult?: FinancialResult }).financialResult;
  return {
    businessType: String(project.businessType ?? project.title ?? "business"),
    description: String(project.businessIdea ?? project.productOrService ?? ""),
    category: String(profile.category ?? ""),
    subcategory: String(profile.subcategory ?? ""),
    businessModel: String(profile.businessModel ?? ""),
    region: String(project.region ?? ""),
    district: String(project.district ?? ""),
    language: locale,
    financials: {
      monthlyRevenue: fin?.revenue?.monthlyRevenue,
      monthlyVolume: fin?.revenue?.monthlyCapacity,
      averagePrice: fin?.revenue?.averagePrice,
      grossMargin: fin?.profitability?.grossMarginPct,
      ebitda: fin?.profitability?.monthlyEBITDA,
      dscr: Number(fin?.financing?.dscr),
      paybackMonths: fin?.profitability?.paybackMonths ?? undefined,
      ownFundsShare: fin?.financing?.ownContributionPct,
      fundingGap: fin?.financing?.financingGap
    }
  };
}

function factPublisherFromSource(source?: ResearchSource | null, locale: AppLocale = "ru") {
  const normalized = normalizeSourceMetadata({ author: source?.organization, publisher: source?.organization, title: source?.title, url: source?.url }, locale);
  return normalized.displayName;
}

function cleanYear(value: unknown): string | undefined {
  const raw = normalizeText(value);
  if (!raw || BAD_USER_FACING_RE.test(raw)) return undefined;
  const match = raw.match(/\b(19\d{2}|20\d{2})\b/);
  return match?.[1];
}

function inferBusinessUse(text: string): EvidenceBusinessUse {
  const lower = text.toLowerCase();
  if (/population|населен|demograph|aholi|жител|аудитор/.test(lower)) return "population";
  if (/price|цен|narx|inflation|cpi|индекс/.test(lower)) return "pricing";
  if (/wage|salary|labor|зарплат|труд|ish haqi/.test(lower)) return "cost";
  if (/rate|credit|bank|cbu|курс|ставк|инфляц|monetary/.test(lower)) return "financing";
  if (/license|permit|tax|soliq|legal|регистрац|касс|налог/.test(lower)) return "regulation";
  if (/compet|конкур|2gis|marketplace/.test(lower)) return "competition";
  if (/gdp|macro|макро|exchange|валют/.test(lower)) return "macro";
  return "demand";
}

function relevanceFromMatchQuality(matchQuality: unknown): EvidenceRelevance {
  const value = String(matchQuality ?? "").toLowerCase();
  if (value === "direct") return "direct";
  if (value.includes("proxy")) return "proxy";
  return "context";
}

function confidenceFromValue(value: unknown): EvidenceConfidence {
  const v = String(value ?? "").toLowerCase();
  if (["high", "medium", "low"].includes(v)) return v as EvidenceConfidence;
  return "medium";
}

function interpretationForFact(metric: string, businessUse: EvidenceBusinessUse, family: ReturnType<typeof detectBusinessEvidenceFamily>, locale: AppLocale): string {
  if (locale === "en") {
    if (businessUse === "pricing") return "Use this to benchmark the average price and test whether the planned ticket can be indexed without losing demand.";
    if (businessUse === "population") return "Use this as demand background, but confirm real footfall, leads and repeat customers locally.";
    if (businessUse === "financing") return "Use this to stress-test debt service, working capital and any currency-sensitive costs.";
    if (family === "retail") return "Use this to check traffic, stock turnover, margin and supplier terms before buying inventory.";
    if (family === "manufacturing") return "Use this to check capacity, raw material costs, equipment utilization and distribution assumptions.";
    return "Use this as a market proxy and validate it with test sales, competitor prices and customer evidence.";
  }
  if (locale === "uz") {
    if (businessUse === "pricing") return "Bu ko'rsatkich o'rtacha narxni solishtirish va chekni talabni yo'qotmasdan oshirish mumkinligini tekshirish uchun kerak.";
    if (businessUse === "population") return "Bu talab fonini baholashga yordam beradi, lekin real oqim, arizalar va takroriy mijozlar joyida tasdiqlanishi kerak.";
    if (businessUse === "financing") return "Bu qarz to'lovi, aylanma kapital va valyutaga bog'liq xarajatlarni stress-test qilish uchun kerak.";
    if (family === "retail") return "Bu trafik, zaxira aylanishi, marja va yetkazib beruvchi shartlarini tekshirish uchun ishlatiladi.";
    if (family === "manufacturing") return "Bu quvvat, material tannarxi, uskunadan foydalanish va sotuv kanallarini tekshirish uchun kerak.";
    return "Bu bozor proxy ko'rsatkichi; uni test savdo, raqobatchilar narxi va mijoz dalillari bilan tasdiqlash kerak.";
  }
  if (businessUse === "pricing") return "Для проекта это важно как ориентир по прайсу: средний чек нужно сверить с конкурентами и тестовыми заказами.";
  if (businessUse === "population") return "Для проекта это спросовой фон: он не доказывает продажи точки, но помогает оценить размер локальной аудитории и трафик.";
  if (businessUse === "financing") return "Для проекта это важно для стресс-теста кредитной нагрузки, оборотного капитала и валютно-чувствительных расходов.";
  if (businessUse === "regulation") return "Для проекта это влияет на сроки запуска, кассу, договоры, разрешения и пакет документов до заявки.";
  if (family === "retail") return "Для проекта это нужно связать с трафиком, товарной маржей, оборачиваемостью запасов и условиями поставщиков.";
  if (family === "manufacturing") return "Для проекта это нужно связать с загрузкой оборудования, материалами, качеством, сертификацией и каналами сбыта.";
  if (metric.toLowerCase().includes("ремонт")) return "Для сервисной модели это proxy спроса на ремонтные услуги; финальный спрос нужно подтвердить заявками, отзывами и тестовыми заказами.";
  return "Для проекта это proxy рыночного фона; его нужно подтвердить тестовыми продажами, конкурентным прайсом и коммерческими данными.";
}

function factFromStatistic(stat: ResearchedStatistic, source: ResearchSource | undefined, context: BusinessContext): EvidenceFact | null {
  const joined = [stat.indicator, stat.value, stat.unit, stat.year, stat.geography, stat.source, stat.sourceId, stat.citation, stat.businessInterpretation].join(" ");
  if (BAD_USER_FACING_RE.test(joined)) return null;
  if (!NUMERIC_RE.test(String(stat.value ?? ""))) return null;
  const sourceUrl = normalizeSourceMetadata({ url: stat.sourceUrl ?? source?.url }, context.language).url;
  if (!sourceUrl) return null;
  const metricName = normalizeText(stat.indicator);
  if (!metricName || BAD_USER_FACING_RE.test(metricName)) return null;
  const sourceTitle = normalizeText(source?.title ?? stat.indicator) || metricName;
  const publisher = factPublisherFromSource(source, context.language) || normalizeText(stat.source) || "stat.uz";
  const businessUse = inferBusinessUse(`${metricName} ${stat.businessInterpretation} ${stat.relevance}`);
  return {
    metricName,
    value: normalizeText(stat.value) || stat.value,
    unit: normalizeText(stat.unit),
    period: cleanYear(stat.year) ?? cleanYear(source?.year),
    geography: normalizeText(stat.geography || source?.geography || context.region),
    sourceTitle,
    sourcePublisher: publisher,
    sourceUrl,
    relevance: relevanceFromMatchQuality(stat.matchQuality),
    confidence: confidenceFromValue(stat.confidence),
    businessUse,
    interpretation: normalizeText(stat.businessInterpretation) || interpretationForFact(metricName, businessUse, detectBusinessEvidenceFamily(context), context.language),
    citation: formatSourceCitation({ author: publisher, url: sourceUrl, year: cleanYear(stat.year) ?? cleanYear(source?.year) }, context.language)
  };
}

function extractNumericValueFromTitle(title: string): string | null {
  const pct = title.match(/[-+]?\d+(?:[,.]\d+)?\s*%/);
  if (pct) return pct[0].replace(/\s+/g, "");
  const number = title.match(/\b\d{2,}(?:[,.]\d+)?\b/);
  return number?.[0] ?? null;
}

function factFromSourceTitle(source: ResearchSource, context: BusinessContext): EvidenceFact | null {
  const title = normalizeText(source.title);
  const organization = normalizeText(source.organization);
  if (!title || !organization || BAD_USER_FACING_RE.test(`${title} ${organization} ${source.year}`)) return null;
  const value = extractNumericValueFromTitle(title);
  if (!value) return null;
  const normalized = normalizeSourceMetadata({ author: organization, title, url: source.url, year: source.year }, context.language);
  if (!normalized.url) return null;
  const businessUse = inferBusinessUse(title);
  return {
    metricName: title,
    value,
    period: cleanYear(source.year) ?? cleanYear(title),
    geography: normalizeText(source.geography || context.region),
    sourceTitle: title,
    sourcePublisher: normalized.displayName,
    sourceUrl: normalized.url,
    relevance: "proxy",
    confidence: source.reliability === "high" ? "high" : "medium",
    businessUse,
    interpretation: interpretationForFact(title, businessUse, detectBusinessEvidenceFamily(context), context.language),
    citation: formatSourceCitation({ author: normalized.displayName, url: normalized.url, year: cleanYear(source.year) ?? cleanYear(title) }, context.language)
  };
}

function sourceText(source: DataSource | ResearchSource): string {
  return [
    (source as DataSource).id,
    (source as DataSource).name,
    (source as DataSource).title,
    (source as DataSource).organization,
    (source as DataSource).sourceType,
    ...((source as DataSource).applicableCategories ?? []),
    ...((source as DataSource).indicators ?? []),
    ...((source as DataSource).useCases ?? []),
    ...((source as DataSource).sectors ?? []),
    ...((source as DataSource).topics ?? []),
    (source as ResearchSource).title,
    (source as ResearchSource).organization
  ].filter(Boolean).join(" ").toLowerCase();
}

export function isSourceRelevantToBusiness(source: DataSource | ResearchSource, context: BusinessContext): boolean {
  const text = sourceText(source);
  const family = detectBusinessEvidenceFamily(context);
  if (BAD_USER_FACING_RE.test(text)) return false;
  if (/construction|строител|qurilish/.test(text) && !/construction|строител|qurilish|ремонт\s+помещ|renovation/.test(profileText(context))) return false;
  if (/agriculture|сельск|crop|livestock|agro|qishloq/.test(text) && family !== "agriculture") return false;
  if (/medical|healthcare|clinic|фарма|медиц|санитар/.test(text) && !/health|clinic|beauty|food|sanitary|медиц|клиник|космет|еда|пищ|санитар/.test(profileText(context))) return false;
  if (/retail|trade|розниц|clothing|одежд|assortment|товар|store/.test(text) && family === "service" && !/ателье|tailor|швей|ремонт\s+одежд|services|услуг|population|prices|cpi|labor/.test(text)) return false;
  if (/manufactur|industry|производ|сырье|raw material/.test(text) && !["manufacturing", "food_service", "generic"].includes(family)) return false;
  return true;
}

export function filterWebResearchSourcesForReport(webResearch: WebResearchResult | null | undefined, context: BusinessContext, limit = 12): ResearchSource[] {
  const sources = webResearch?.sources ?? [];
  const statSourceIds = new Set((webResearch?.statistics ?? [])
    .filter((stat) => !BAD_USER_FACING_RE.test([stat.indicator, stat.value, stat.sourceId, stat.businessInterpretation].join(" ")))
    .map((stat) => stat.sourceId));
  const scored = sources
    .filter((source) => isSourceRelevantToBusiness(source, context))
    .map((source) => {
      let score = 0;
      const text = sourceText(source);
      if (statSourceIds.has(source.id)) score += 60;
      if (source.reliability === "high") score += 30;
      if (/stat\.uz|cbu\.uz|soliq\.uz|my\.gov\.uz|lex\.uz|license\.gov\.uz|customs\.uz/.test(source.url)) score += 25;
      if (/population|населен|price|цен|services|услуг|retail|trade|industry|manufactur|cbu|bank|tax|license|legal/.test(text)) score += 15;
      return { source, score };
    })
    .sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));
  return scored.map((item) => item.source).slice(0, limit);
}

function dedupeFacts(facts: EvidenceFact[]): EvidenceFact[] {
  const seen = new Set<string>();
  const result: EvidenceFact[] = [];
  for (const fact of facts) {
    const key = [fact.metricName.toLowerCase().replace(/\W+/g, " ").trim(), fact.value, fact.sourceUrl].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(fact);
  }
  return result;
}

export function selectEvidenceFacts(input: { project: StructuredProjectData; financial?: FinancialResult | null; webResearch?: WebResearchResult | null; locale?: AppLocale; limit?: number }): EvidenceFact[] {
  const locale = input.locale ?? (input.project.userLanguage as AppLocale) ?? "ru";
  const context = buildBusinessContext(input.project, input.financial ?? null, locale);
  const byId = new Map((input.webResearch?.sources ?? []).map((source) => [source.id, source]));
  const fromStats = (input.webResearch?.statistics ?? [])
    .map((stat) => factFromStatistic(stat, byId.get(stat.sourceId), context))
    .filter((fact): fact is EvidenceFact => Boolean(fact));
  const fromTitles = filterWebResearchSourcesForReport(input.webResearch, context, 12)
    .map((source) => factFromSourceTitle(source, context))
    .filter((fact): fact is EvidenceFact => Boolean(fact));
  const all = dedupeFacts([...fromStats, ...fromTitles])
    .filter((fact) => isSourceRelevantToBusiness({ id: fact.sourceUrl, name: fact.sourceTitle, url: fact.sourceUrl, sourceType: "official_statistics", countryScope: "UZ", reliability: "high", applicableCategories: [], indicators: [], useCases: [] }, context))
    .sort((a, b) => {
      const rel = { direct: 3, proxy: 2, context: 1 } as const;
      const conf = { high: 3, medium: 2, low: 1 } as const;
      return (rel[b.relevance] - rel[a.relevance]) || (conf[b.confidence] - conf[a.confidence]) || a.metricName.localeCompare(b.metricName);
    });
  return all.slice(0, input.limit ?? 7);
}

export function selectedRegistrySourcesForEvidence(project: StructuredProjectData, locale: AppLocale, limit = 8): DataSource[] {
  const context = buildBusinessContext(project, null, locale);
  return selectRelevantSourcesForReport(project, "ai_analysis", limit * 2, locale)
    .filter((source) => isSourceRelevantToBusiness(source, context))
    .slice(0, limit);
}

export function formatEvidenceFactLine(fact: EvidenceFact, locale: AppLocale): string {
  const value = [fact.value, fact.unit].filter(Boolean).join(" ").trim();
  const period = fact.period ? (locale === "en" ? ` for ${fact.period}` : locale === "uz" ? ` (${fact.period})` : ` за ${fact.period}`) : "";
  const geography = fact.geography ? (locale === "en" ? ` in ${fact.geography}` : locale === "uz" ? `, geografiya: ${fact.geography}` : `, география: ${fact.geography}`) : "";
  if (locale === "en") return `According to ${fact.sourcePublisher}, "${fact.metricName}"${period}${geography} is ${value}. Business implication: ${fact.interpretation}`;
  if (locale === "uz") return `${fact.sourcePublisher} ma'lumotlariga ko'ra, "${fact.metricName}"${period}${geography}: ${value}. Biznes uchun mazmuni: ${fact.interpretation}`;
  return `По данным ${fact.sourcePublisher}, показатель «${fact.metricName}»${period}${geography} составляет ${value}. Для проекта это важно: ${fact.interpretation}`;
}

function fmt(value: unknown, locale: AppLocale): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return locale === "en" ? "not specified" : locale === "uz" ? "ko'rsatilmagan" : "не указано";
  return Math.round(n).toLocaleString(locale === "en" ? "en-US" : "ru-RU");
}

function financialSentence(financial: FinancialResult, locale: AppLocale): string {
  const revenue = fmt(financial.revenue?.monthlyRevenue, locale);
  const volume = fmt(financial.revenue?.monthlyCapacity, locale);
  const price = fmt(financial.revenue?.averagePrice, locale);
  const ebitda = fmt(financial.profitability?.monthlyEBITDA, locale);
  const dscr = financial.financing?.dscrLabel ?? "n/a";
  const gap = fmt(financial.financing?.financingGap, locale);
  if (locale === "en") return `The financial model uses the structured project inputs: monthly revenue ${revenue} UZS, volume ${volume}, average price ${price} UZS, EBITDA ${ebitda} UZS, DSCR ${dscr}, and funding gap ${gap} UZS.`;
  if (locale === "uz") return `Moliyaviy model shakldagi tuzilgan kiritmalardan foydalanadi: oylik tushum ${revenue} UZS, hajm ${volume}, o'rtacha narx ${price} UZS, EBITDA ${ebitda} UZS, DSCR ${dscr}, moliyalashtirish bo'shlig'i ${gap} UZS.`;
  return `Финансовая интерпретация строится на структурных данных проекта: месячная выручка ${revenue} UZS, объем ${volume}, средняя цена ${price} UZS, EBITDA ${ebitda} UZS, DSCR ${dscr}, разрыв финансирования ${gap} UZS.`;
}

function familyText(family: ReturnType<typeof detectBusinessEvidenceFamily>, locale: AppLocale): string {
  if (locale === "en") {
    return {
      service: "a service business where demand depends on local audience, repeat orders, staff productivity, quality and response speed",
      retail: "a retail model where traffic, assortment, gross margin, inventory turnover and supplier terms drive the result",
      manufacturing: "a production model where capacity utilization, material costs, equipment reliability, certification and distribution are decisive",
      agriculture: "an agriculture model where seasonality, yield, inputs, storage and sales channels determine cash flow",
      rental: "a rental/service model where asset utilization, maintenance, damage risk, location and seasonality drive economics",
      b2b: "a B2B/contract model where client concentration, receivables, SLA capacity and payment discipline are critical",
      logistics: "a logistics model where route density, fleet utilization, fuel and labor costs define margin",
      generic: "a business model where the main assumptions must be tied to demand evidence, unit economics and operational capacity"
    }[family];
  }
  if (locale === "uz") {
    return {
      service: "xizmat biznesi: talab lokal auditoriya, takroriy buyurtmalar, xodim unumdorligi, sifat va tezlikka bog'liq",
      retail: "chakana model: trafik, assortiment, yalpi marja, zaxira aylanishi va yetkazib beruvchi shartlari muhim",
      manufacturing: "ishlab chiqarish modeli: quvvatdan foydalanish, material tannarxi, uskuna ishonchliligi, sertifikat va sotuv kanallari muhim",
      agriculture: "qishloq xo'jaligi modeli: mavsumiylik, hosildorlik, inputlar, saqlash va sotuv kanallari pul oqimini belgilaydi",
      rental: "ijara/xizmat modeli: aktivlardan foydalanish, servis, shikastlanish riski, lokatsiya va mavsumiylik iqtisodiyotga ta'sir qiladi",
      b2b: "B2B/kontrakt modeli: mijoz konsentratsiyasi, debitorlik, SLA quvvati va to'lov intizomi muhim",
      logistics: "logistika modeli: yo'nalish zichligi, parkdan foydalanish, yoqilg'i va mehnat xarajatlari marjani belgilaydi",
      generic: "asosiy farazlar talab dalillari, birlik iqtisodiyoti va operatsion quvvat bilan bog'lanishi kerak"
    }[family];
  }
  return {
    service: "сервисный бизнес, где спрос зависит от локальной аудитории, повторных заказов, производительности персонала, качества и скорости исполнения",
    retail: "розничная модель, где результат определяют трафик, ассортимент, валовая маржа, оборачиваемость запасов и условия поставщиков",
    manufacturing: "производственная модель, где критичны загрузка мощности, материалы, надежность оборудования, качество, сертификация и каналы сбыта",
    agriculture: "аграрная модель, где денежный поток зависит от сезонности, урожайности, ресурсов, хранения и каналов продаж",
    rental: "модель проката/сервиса, где экономика зависит от загрузки активов, обслуживания, повреждений, локации и сезонности",
    b2b: "B2B/контрактная модель, где важны концентрация клиентов, дебиторка, SLA, мощность и платежная дисциплина",
    logistics: "логистическая модель, где маржу определяют плотность маршрутов, загрузка парка, топливо и ФОТ",
    generic: "бизнес-модель, где ключевые допущения нужно связать с подтверждением спроса, юнит-экономикой и операционной мощностью"
  }[family];
}

export function buildUniversalAiAnalysis(input: { project: StructuredProjectData; financial: FinancialResult; webResearch?: WebResearchResult | null; locale?: AppLocale }): string {
  const locale = input.locale ?? (input.project.userLanguage as AppLocale) ?? "ru";
  const context = buildBusinessContext(input.project, input.financial, locale);
  const family = detectBusinessEvidenceFamily(context);
  const facts = selectEvidenceFacts({ project: input.project, financial: input.financial, webResearch: input.webResearch, locale, limit: 5 });
  const registrySources = selectedRegistrySourcesForEvidence(input.project, locale, 5);
  const evidenceLines = facts.map((fact) => formatEvidenceFactLine(fact, locale));
  const sourceNames = registrySources.map((source) => normalizeSourceMetadata({ author: source.organization ?? source.name, url: source.url }, locale).displayName).filter(Boolean).slice(0, 4).join(", ");
  const businessName = context.businessType;
  if (locale === "en") {
    const evidence = evidenceLines.length
      ? evidenceLines.join(" ")
      : `No direct official numeric indicator for the narrow segment was available in the structured evidence layer. The analysis therefore uses proxy sources such as ${sourceNames || "official statistics, central bank and public-service portals"}; these help assess the market background but do not replace test sales, traffic measurement and supplier quotations.`;
    return `The project "${businessName}" is ${familyText(family, locale)} in ${[context.region, context.district].filter(Boolean).join(", ") || "the selected location"}. ${evidence} ${financialSentence(input.financial, locale)} The next step is to validate the assumptions with business-specific evidence: competitor prices, test orders or pilot sales, supplier/equipment offers, location terms, staff schedule, documents and working-capital needs.`;
  }
  if (locale === "uz") {
    const evidence = evidenceLines.length
      ? evidenceLines.join(" ")
      : `Tor segment bo'yicha to'g'ridan-to'g'ri rasmiy raqamli ko'rsatkich mavjud emas. Shuning uchun tahlil ${sourceNames || "rasmiy statistika, Markaziy bank va davlat portallari"} kabi proxy manbalarga tayanadi; ular bozor fonini baholaydi, lekin test savdo, trafik o'lchovi va yetkazib beruvchi takliflarini almashtirmaydi.`;
    return `"${businessName}" loyihasi ${[context.region, context.district].filter(Boolean).join(", ") || "tanlangan lokatsiya"} hududida ${familyText(family, locale)}. ${evidence} ${financialSentence(input.financial, locale)} Keyingi qadam - farazlarni biznesga xos dalillar bilan tasdiqlash: raqobatchilar narxi, test buyurtmalar yoki pilot savdo, yetkazib beruvchi/uskuna takliflari, lokatsiya shartlari, xodimlar grafigi, hujjatlar va aylanma kapital.`;
  }
  const evidence = evidenceLines.length
    ? evidenceLines.join(" ")
    : `Прямой официальный показатель по узкому сегменту в структурированном evidence-слое не найден. Для оценки использованы proxy-источники: ${sourceNames || "официальная статистика, Центральный банк и государственные порталы"}. Эти источники помогают оценить рыночный фон, но не заменяют тестовые продажи, замер трафика и коммерческие предложения.`;
  return `Проект «${businessName}» в локации ${[context.region, context.district].filter(Boolean).join(", ") || "выбранный регион"} — это ${familyText(family, locale)}. ${evidence} ${financialSentence(input.financial, locale)} Следующий шаг — подтвердить расчетные допущения бизнес-специфичными доказательствами: ценами конкурентов, тестовыми заказами или пилотными продажами, КП поставщиков и оборудования, условиями помещения, графиком персонала, документами и потребностью в оборотном капитале.`;
}
