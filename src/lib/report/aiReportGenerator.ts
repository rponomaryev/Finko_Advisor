import type { FinancialResult, RiskItem, StructuredProjectData } from "../types/project.ts";
import type { WebResearchResult } from "../market/webResearchService.ts";
import { callOpenAIWithUsageLog, writeAIUsageLog } from "../ai/openaiClient.ts";
import { CRITICAL_LANGUAGE_RULE } from "../ai/prompts.ts";
import { localizeBusinessProfileValue } from "../i18n/businessProfileLabels.ts";
import { labelValue } from "../utils/labels.ts";
import { getBusinessSampleById } from "../data/businessSamples/businessSamples.ts";
import { selectRelevantSourcesForReport, type DataSource } from "../data/sourceRegistry.ts";
import { cleanInlineSourcePlaceholders, normalizeSourceMetadata } from "./sourceCitationFormatter.ts";
import { buildUniversalAiAnalysis, cleanAiAnalysisText, hasAiAnalysisPlaceholderLeak, selectEvidenceFacts, selectedRegistrySourcesForEvidence, formatEvidenceFactLine, detectBusinessEvidenceFamily } from "./evidenceEngine.ts";

export type AIGeneratedReport = {
  executiveSummary: string;
  marketAnalysis: string;
  businessModelAssessment: string;
  financialAnalysis: string;
  riskAssessment: string;
  actionPlan: string;
  investmentReadiness: string;
  fullNarrative: string;
  citations: Array<{
    source: string;
    title: string;
    year: string;
    text: string;
    url?: string | null;
  }>;
};

const aiReportJsonSchema = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    marketAnalysis: { type: "string" },
    businessModelAssessment: { type: "string" },
    financialAnalysis: { type: "string" },
    riskAssessment: { type: "string" },
    actionPlan: { type: "string" },
    investmentReadiness: { type: "string" },
    fullNarrative: { type: "string" },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string" },
          title: { type: "string" },
          year: { type: "string" }
        },
        required: ["source", "title", "year"],
        additionalProperties: false
      }
    }
  },
  required: ["executiveSummary", "marketAnalysis", "businessModelAssessment", "financialAnalysis", "riskAssessment", "actionPlan", "investmentReadiness", "fullNarrative", "citations"],
  additionalProperties: false
} as const;

function localeName(locale: "ru" | "uz" | "en") {
  if (locale === "uz") return "узбекском латинском";
  if (locale === "en") return "английском";
  return "русском";
}

function formatUZS(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `${Math.round(n).toLocaleString("ru-RU")} UZS` : "не указано";
}

function localeFallbackText(locale: "ru" | "uz" | "en", ru: string, uz: string, en: string) {
  if (locale === "en") return en;
  if (locale === "uz") return uz;
  return ru;
}

function buildLangEnforcement(locale: "ru" | "uz" | "en"): { langEnforcement: string; langStrict: string } {
  if (locale === "en") {
    return {
      langEnforcement: "RESPOND IN ENGLISH ONLY. Every single word of your JSON response must be in English. This is a hard requirement that overrides everything else.",
      langStrict: "ENGLISH ONLY. If user-provided data is in Russian or Uzbek, that is raw input. Your analysis output must be entirely in English. Do not include Russian or Uzbek words in response values."
    };
  }
  if (locale === "uz") {
    return {
      langEnforcement: "JAVOBNI FAQAT O'ZBEK TILIDA YOZING. JSON qiymatlaridagi har bir so'z o'zbek tilida bo'lishi shart. Bu eng yuqori ustuvorlik.",
      langStrict: "FAQAT O'ZBEK TILI. Kiruvchi ma'lumotlar rus yoki ingliz tilida bo'lishi mumkin; bu foydalanuvchi kiritgan xom ma'lumot. Tahlil natijasi to'liq o'zbek tilida, lotin alifbosida bo'lishi kerak."
    };
  }
  return {
    langEnforcement: "ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ. Каждое слово в JSON-ответе должно быть на русском. Это требование с наивысшим приоритетом.",
    langStrict: "ТОЛЬКО РУССКИЙ ЯЗЫК. Весь анализ — на русском. Не используй узбекские или английские слова кроме разрешённых исключений."
  };
}

function criticalLanguageTail(locale: "ru" | "uz" | "en") {
  if (locale === "en") return "⚠️ CRITICAL: The entire JSON response must be in English only. User input can be Russian or Uzbek; treat it as raw input and translate all analysis values into English.";
  if (locale === "uz") return "⚠️ MUHIM: Butun JSON javobi faqat o'zbek tilida, lotin alifbosida bo'lishi shart. Kiruvchi ma'lumot rus yoki ingliz tilida bo'lishi mumkin; tahlil natijasi to'liq o'zbek tilida bo'lsin.";
  return "⚠️ CRITICAL: Весь JSON-ответ должен быть только на русском языке. Входные данные могут быть на узбекском или английском; это сырой ввод, а аналитический вывод должен быть на русском.";
}

function matchedSampleId(project: StructuredProjectData) {
  const businessProfile = project.businessProfile as
    | (NonNullable<StructuredProjectData["businessProfile"]> & {
        aiClassification?: { sampleId?: unknown };
      })
    | undefined;
  const sampleId = businessProfile?.aiClassification?.sampleId;
  return typeof sampleId === "string" ? sampleId : undefined;
}

function formatSampleContext(project: StructuredProjectData, locale: "ru" | "uz" | "en") {
  const sampleId = matchedSampleId(project);
  const confidence = Number(project.businessProfile?.confidence ?? 0);
  const sample = sampleId ? getBusinessSampleById(sampleId) : undefined;
  if (!sample || confidence < 0.65) {
    const category = localizeBusinessProfileValue(project.businessProfile?.category ?? "generic", locale, { failOnUnknown: false });
    return `
## BUSINESS MODE / СЦЕНАРИЙ
Generic scenario: конкретный sample не определён с достаточной уверенностью. Анализируй как ${category}-бизнес без привязки к узкому подтипу и не переноси риски из других секторов.`;
  }
  const risks = sample.sectorRisks?.[locale]?.map((risk) => `- ${risk}`).join("\n") || "- Нет sample-specific risks";
  const documents = (sample.keyDocuments ?? []).join(", ") || "standard_business_documents";
  const hint = sample.aiHints?.[locale] ?? sample.label[locale];
  return `
## SAMPLE-SPECIFIC BUSINESS CONTEXT
Sample: ${sample.id}
Localized label: ${sample.label[locale]}
AI hint: ${hint}

Sector risks:
${risks}

Key documents for this sample:
${documents}`;
}

function reportModel() {
  return process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function riskLines(risks: RiskItem[] | undefined, level?: RiskItem["level"]) {
  return (risks ?? [])
    .filter((risk) => !level || risk.level === level)
    .slice(0, 5)
    .map((risk) => `- ${risk.title} (${risk.level}): ${risk.description || risk.reason || risk.mitigation}`)
    .join("\n") || "- Нет данных";
}

function buildReportSystemPrompt(locale: "ru" | "uz" | "en"): string {
  const { langEnforcement, langStrict } = buildLangEnforcement(locale);
  return `${langEnforcement}

Ты — старший бизнес-аналитик и финансовый советник с 15-летним опытом работы с МСБ в Центральной Азии. Ты пишешь раздел «Анализ и рекомендации» для бизнес-отчёта FINKO.

━━━ LANGUAGE RULE (HIGHEST PRIORITY) ━━━

${langStrict}

Исключения, которые можно не переводить: EBITDA, DSCR, UZS, USD, EUR, URL, IELTS, Instagram, Telegram, WhatsApp, Click, Payme, Uzum, 2GIS.

━━━ СТРУКТУРА ОТВЕТА (строго соблюдать) ━━━

Возвращай JSON строго по схеме без дополнительных полей:
{
  "executiveSummary": "...",
  "marketAnalysis": "...",
  "businessModelAssessment": "...",
  "financialAnalysis": "...",
  "riskAssessment": "...",
  "actionPlan": "...",
  "investmentReadiness": "...",
  "fullNarrative": "...",
  "citations": [{"source": "source_id", "title": "...", "year": "..."}]
}

fullNarrative — это единый аналитический текст из 6 разделов:
### 1. Макроэкономический контекст
### 2. Демография и локальный спрос
### 3. Отраслевой рынок
### 4. Финансовая диагностика
### 5. Сильные стороны и риски
### 6. Рекомендованные следующие шаги

━━━ ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА СТИЛЯ ━━━

1. Каждый тезис строится как ДАННЫЕ → ВЫВОД → ДЕЙСТВИЕ. Если есть цифра — укажи источник в тексте в формате (Организация, Год).
2. Не пересказывай анкету. Интерпретируй данные.
3. Финансовую диагностику давай с конкретными числами: EBITDA, DSCR, breakeven, ежемесячный платёж, CapEx, оборотный капитал.
4. Для каждого риска: риск → почему важно именно для этого формата → конкретная митигация.
5. Рыночные данные: есть цифра — назови её, укажи источник, дай вывод; нет цифры — прямо напиши, что прямых данных по узкому сегменту нет, ближайший proxy — доступный источник/показатель.
6. Никогда не выдумывай статистику, source_id, URL, законы, тарифы или даты. Если данных нет — честно напиши об отсутствии evidence.
7. Рекомендации должны быть конкретными и приоритизированными. Для B2C розницы используй тестовые продажи, Instagram/Telegram заявки, конкурентный замер и опрос покупателей; не предлагай письма о намерениях как основной способ проверки спроса.
8. Тональность: аналитическая, прямая. Называй проблемы прямо и давай путь решения.
9. fullNarrative: 600–900 слов. Не короче: без цифр нет обоснования.
10. fullNarrative может включать краткий раздел следующих шагов в разделе 6, но детальный numbered execution plan должен быть только в поле actionPlan.
11. Не выводи JSON-ключи, технические поля, snake_case, enum-значения, строки вида "value", "sourceUrl", "citation", "unit", "null", "undefined", "manual_check".
12. В citations возвращай только source_id из sourcePack или structured evidence. Не выдумывай source_id. Поля citations: source, title, year.
13. Не упоминай санитарные требования, если бизнес не связан с едой, медициной, детьми, beauty/wellness или санитарно значимой услугой. Не переноси риски из другого сектора.
14. Не обещай прибыль или одобрение кредита.

${CRITICAL_LANGUAGE_RULE}`;
}

function formatSourcePack(sources: DataSource[], section: string): string {
  return `\n${section}:\n` + sources.map((source) => {
    const normalized = normalizeSourceMetadata({
      title: source.title ?? source.name,
      organization: source.organization ?? source.name.split(":")[0],
      sourceName: source.name,
      url: source.url,
      sourceType: source.reportSourceType ?? source.sourceType
    }, "en");
    return `- id=${source.id}; organization=${normalized.displayName}; title=${normalized.title ?? "Source"}; type=${normalized.sourceType ?? source.reportSourceType ?? source.sourceType}; url=${normalized.url ?? ""}`;
  }).join("\n");
}


export function buildReportSourcePack(project: StructuredProjectData, locale: "ru" | "uz" | "en") {
  const projectWithProfile = { ...project, businessProfile: project.businessProfile };
  return {
    marketSources: selectRelevantSourcesForReport(projectWithProfile, "market_data", 10, locale),
    documentSources: selectRelevantSourcesForReport(projectWithProfile, "documents", 8, locale),
    riskSources: selectRelevantSourcesForReport(projectWithProfile, "risk_matrix", 8, locale),
    macroSources: selectRelevantSourcesForReport(projectWithProfile, "macro", 6, locale),
    legalSources: selectRelevantSourcesForReport(projectWithProfile, "legal", 8, locale),
    actionSources: selectRelevantSourcesForReport(projectWithProfile, "action_plan", 6, locale)
  };
}

export function buildReportUserPrompt(input: {
  project: StructuredProjectData;
  financial: FinancialResult;
  risks: RiskItem[];
  feasibilityScore: number;
  bankReadinessScore: number;
  webResearch?: WebResearchResult | null;
  locale: "ru" | "uz" | "en";
}) {
  const { project, financial, risks, feasibilityScore, bankReadinessScore, webResearch, locale } = input;
  const lp = (value: string | string[] | null | undefined) => localizeBusinessProfileValue(value, locale, { failOnUnknown: false });
  const localizedCustomers = Array.isArray(project.targetCustomers) ? project.targetCustomers.map((value) => labelValue(value, locale)).join(", ") : labelValue(project.targetCustomers ?? "не указано", locale);
  const localizedChannels = Array.isArray(project.customerAcquisitionChannels)
    ? project.customerAcquisitionChannels.map((value) => labelValue(value, locale)).join(", ")
    : Array.isArray(project.salesChannels)
      ? project.salesChannels.map((value) => labelValue(value, locale)).join(", ")
      : labelValue(project.salesPlatform ?? "не указано", locale);
  const evidenceFacts = selectEvidenceFacts({ project, financial, webResearch, locale, limit: 7 });
  const registryEvidenceSources = selectedRegistrySourcesForEvidence(project, locale, 6);
  const evidenceLines = evidenceFacts.map((fact, index) => `${index + 1}. ${formatEvidenceFactLine(fact, locale)} [${fact.relevance}/${fact.confidence}; use=${fact.businessUse}; citation=${fact.citation}; url=${fact.sourceUrl}]`);
  const registryLines = registryEvidenceSources.map((source) => `- id=${source.id}; publisher=${source.organization ?? source.name}; title=${source.title ?? source.name}; url=${source.url}; type=${source.reportSourceType ?? source.sourceType}`);
  const statsSection = evidenceLines.length
    ? `

STRUCTURED EVIDENCE FACTS / РЫНОЧНЫЕ ФАКТЫ:
${evidenceLines.join("\n")}

Дополнительные proxy-источники из registry:
${registryLines.join("\n")}`
    : `

STRUCTURED EVIDENCE FACTS / РЫНОЧНЫЕ ФАКТЫ:
Прямой числовой показатель по узкому сегменту не найден в структурированном evidence layer. Используй только clean proxy-пояснение на языке отчета и НЕ вставляй raw source fields/status. Доступные proxy-источники из registry:
${registryLines.join("\n")}`;
  const sourcePack = buildReportSourcePack(project, locale);
  const sourcePackText = [
    formatSourcePack(sourcePack.marketSources, "marketSources"),
    formatSourcePack(sourcePack.documentSources, "documentSources"),
    formatSourcePack(sourcePack.riskSources, "riskSources"),
    formatSourcePack(sourcePack.macroSources, "macroSources"),
    formatSourcePack(sourcePack.legalSources, "legalSources")
  ].join("\n");
  const sampleContext = formatSampleContext(project, locale);
  const allowedCitationIds = Array.from(new Set([
    ...Object.values(sourcePack).flat().map((source) => source.id),
    ...registryEvidenceSources.map((source) => source.id),
    ...evidenceFacts.map((fact) => fact.sourcePublisher)
  ])).join(", ");

  return `Напиши профессиональный бизнес-аналитический отчет на основе данных:

## ДАННЫЕ ПРОЕКТА
Тип бизнеса: ${project.businessType ?? "не указано"}
Описание: ${project.businessIdea ?? "не указано"}
Регион: ${project.region ?? "не указано"}, ${project.district ?? ""}
Продукт/услуга: ${project.productOrService ?? "не указано"}
Категория профиля: ${lp(project.businessProfile?.category ?? "не указано")}
Подкатегория: ${lp(project.businessProfile?.subcategory ?? "не указано")}
Операционная модель: ${lp(project.businessProfile?.operationalModel ?? "не указано")}
Статус помещения: ${labelValue(project.premisesStatus ?? "не указано", locale)}
Клиенты: ${localizedCustomers}
Каналы продаж/привлечения: ${localizedChannels}
${sampleContext}

## ФИНАНСЫ
Потребность в инвестициях: ${formatUZS(financial.capex?.totalCapEx + financial.workingCapital?.requiredWorkingCapital)}
CapEx: ${formatUZS(financial.capex?.totalCapEx)}
Оборотный капитал: ${formatUZS(financial.workingCapital?.requiredWorkingCapital)}
Собственные средства: ${formatUZS(financial.financing?.ownContributionUZS)}
Кредит: ${formatUZS(financial.financing?.loanRequired)}
Месячная выручка: ${formatUZS(financial.revenue?.monthlyRevenue)}
Плановый объем: ${financial.revenue?.monthlyCapacity ?? "н/д"} ${financial.revenue?.unitLabel ?? ""}
Эффективный объем с загрузкой: ${financial.revenue?.effectiveUnits ?? "н/д"}
Средняя цена: ${formatUZS(financial.revenue?.averagePrice)}
Себестоимость за единицу: ${formatUZS(financial.cogs?.wasteAdjustedUnitCOGS)}
Валовая маржа: ${financial.profitability?.grossMarginPct ?? "н/д"}%
Операционные расходы/мес.: ${formatUZS(financial.opex?.monthlyFixedOpex)}
Фонд оплаты труда: ${formatUZS(financial.payroll?.totalMonthlyPayrollUZS)}
Срок окупаемости: ${financial.profitability?.paybackMonths ?? "н/д"} месяцев
DSCR (коэффициент покрытия долга): ${financial.financing?.dscrLabel ?? "не применяется"}
EBITDA-маржа: ${financial.profitability?.ebitdaMarginPct ?? "н/д"}%
Предупреждения финансовой модели: ${(financial.warnings ?? []).map((w) => `${w.title ?? w.code}: ${w.message}`).join(" | ") || "нет"}
Оценка реализуемости: ${feasibilityScore}/100
Готовность к банку: ${bankReadinessScore}/100

## ВЫСОКИЕ РИСКИ
${riskLines(risks, "high")}

## ПРОЧИЕ РИСКИ
${riskLines(risks.filter((r) => r.level !== "high"))}
${statsSection}

## SOURCE PACK / РАЗРЕШЁННЫЕ ИСТОЧНИКИ
${sourcePackText}

Правила источников:
- Для рыночной части используй STRUCTURED EVIDENCE FACTS. Не используй raw source title/status/metadata как факт.
- Используй только sourcePack, registry proxy-источники и structured evidence facts для фактических, статистических и правовых утверждений.
- Не выдумывай названия источников, числа, URL, законы или даты.
- Если точного отраслевого числового факта нет, напиши clean proxy-объяснение: какие proxy-показатели использованы и что они НЕ доказывают.
- Каждое рыночное, юридическое или статистическое утверждение должно ссылаться на source id или clean citation из structured evidence.
- В поле citations возвращай только объекты { source, title, year }. source должен быть одним из разрешённых id/source names: ${allowedCitationIds}.
- Не выводи все источники: используй 3-7 наиболее релевантных evidence/proxy источников.
- Запрещено выводить в JSON visible values: "Нужно проверить", "Требует уточнения Нужно проверить", "проверить=", "2024-Нужно проверить", "2026c", "2026d", "undefined", "null", "NaN", raw source IDs и internal status fields.

Сформируй отчет строго по JSON-схеме. Каждый раздел — не менее 3-5 содержательных предложений. Обязательно прокомментируй, какие введенные пользователем данные стали расчетом, а какие являются допущениями и требуют уточнения.

${criticalLanguageTail(locale)}`;
}

function responseText(response: unknown): string {
  const direct = (response as { output_text?: string }).output_text;
  if (typeof direct === "string") return direct;
  return "{}";
}


function sanitizeReportText(value: string, locale: "ru" | "uz" | "en" = "ru") {
  return cleanAiAnalysisText(cleanInlineSourcePlaceholders(String(value ?? ""), locale), locale)
    .replace(/"?(value|sourceUrl|year|citation|unit|sourceId|matchQuality|sourceName|sourceType)"?\s*[—:-][^\n]*/gi, "")
    .replace(/\{[\s\S]{0,600}?\}/g, "")
    .replace(/https?:\/\/www\s*$/gim, "")
    .replace(/\b20\d{2}[a-z]\b/gi, (match) => match.slice(0, 4))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeReport(report: AIGeneratedReport, locale: "ru" | "uz" | "en" = "ru"): AIGeneratedReport {
  return {
    ...report,
    executiveSummary: sanitizeReportText(report.executiveSummary, locale),
    marketAnalysis: sanitizeReportText(report.marketAnalysis, locale),
    businessModelAssessment: sanitizeReportText(report.businessModelAssessment, locale),
    financialAnalysis: sanitizeReportText(report.financialAnalysis, locale),
    riskAssessment: sanitizeReportText(report.riskAssessment, locale),
    actionPlan: sanitizeReportText(report.actionPlan, locale),
    investmentReadiness: sanitizeReportText(report.investmentReadiness, locale),
    fullNarrative: sanitizeReportText(report.fullNarrative, locale),
    citations: (report.citations ?? [])
      .map((item) => {
        const raw = item as Partial<AIGeneratedReport["citations"][number]>;
        const source = sanitizeReportText(raw.source ?? "", locale);
        const title = sanitizeReportText(raw.title ?? raw.text ?? raw.source ?? "", locale);
        const year = String(raw.year ?? "").replace(/[^0-9]/g, "").slice(0, 4) || "n/a";
        return { source, title, year, text: title, url: raw.url ?? null };
      })
      .filter((item) => item.source && item.title && !/sourceUrl|value|citation|unit|проверить=|Нужно проверить|Требует уточнения Нужно проверить/i.test(`${item.title} ${item.source}`))
      .slice(0, 20)
  };
}

function isChildrenClothingProject(project: StructuredProjectData) {
  const profile = project.businessProfile;
  const text = `${project.businessType ?? ""} ${project.businessIdea ?? ""} ${profile?.subcategory ?? ""}`;
  return /children_clothing_store|детск.*одежд|одежд.*детск|kids.*clothing/i.test(text);
}

function isDeviceRepairProject(project: StructuredProjectData) {
  const profile = project.businessProfile;
  const text = `${project.businessType ?? ""} ${project.businessIdea ?? ""} ${profile?.subcategory ?? ""} ${(profile as Record<string, unknown> | undefined)?.businessModel ?? ""}`;
  return /device_repair|ремонт\s*(смартфон|телефон|iphone|samsung|xiaomi)|сервисн\w*\s+центр\w*\s+по\s+ремонту|phone\s*repair|smartphone\s*repair/i.test(text);
}

export function generateFallbackReport(input: {
  project: StructuredProjectData;
  financial: FinancialResult;
  risks: RiskItem[];
  feasibilityScore: number;
  bankReadinessScore: number;
  webResearch?: WebResearchResult | null;
  locale?: "ru" | "uz" | "en";
}): AIGeneratedReport {
  const locale = input.locale ?? "ru";
  const businessType = input.project.businessType ?? (locale === "en" ? "business" : locale === "uz" ? "biznes" : "бизнес");
  const f = input.financial;
  const family = detectBusinessEvidenceFamily({
    businessType: String(businessType),
    description: String(input.project.businessIdea ?? ""),
    category: String(input.project.businessProfile?.category ?? ""),
    subcategory: String(input.project.businessProfile?.subcategory ?? ""),
    businessModel: String((input.project.businessProfile as Record<string, unknown> | undefined)?.businessModel ?? ""),
    region: String(input.project.region ?? ""),
    district: String(input.project.district ?? ""),
    language: locale,
    financials: {}
  });
  const facts = selectEvidenceFacts({ project: input.project, financial: f, webResearch: input.webResearch, locale, limit: 7 });
  const marketAnalysis = buildUniversalAiAnalysis({ project: input.project, financial: f, webResearch: input.webResearch, locale });
  const unitLabel = f.revenue?.unitLabel ?? (locale === "en" ? "units/month" : locale === "uz" ? "birlik/oy" : "ед./мес.");
  const highRisks = input.risks.filter((risk) => risk.level === "high").slice(0, 5);
  const riskAssessment = highRisks.length
    ? highRisks.map((risk, index) => `${index + 1}. ${risk.title}: ${risk.mitigation || risk.description || risk.reason}`).join("\n")
    : localeFallbackText(locale,
      "Критичных рисков немного, но спрос, документы, поставщики, локация и оборотный капитал всё равно нужно подтвердить до финансовых обязательств.",
      "Kritik risklar kam, lekin talab, hujjatlar, yetkazib beruvchilar, lokatsiya va aylanma kapital moliyaviy majburiyatlardan oldin tasdiqlanishi kerak.",
      "There are few critical risks, but demand, documents, suppliers, location and working capital still need confirmation before financial commitments."
    );
  const executiveSummary = localeFallbackText(locale,
    `Проект «${businessType}» предварительно оценен на ${input.feasibilityScore}/100 по реализуемости и ${input.bankReadinessScore}/100 по готовности к финансированию. Расчетная потребность в инвестициях: ${formatUZS(f.financing.totalInvestmentNeed)}, месячная выручка: ${formatUZS(f.revenue.monthlyRevenue)}, EBITDA: ${formatUZS(f.profitability.monthlyEBITDA)}. Выручка рассчитана из структурных полей: объем ${Number(f.revenue.monthlyCapacity ?? 0).toLocaleString("ru-RU")} ${unitLabel}, средняя цена ${formatUZS(f.revenue.averagePrice)} и загрузка ${f.revenue.expectedUtilizationPct ?? 100}%.`,
    `«${businessType}» loyihasi amalga oshirish bo'yicha ${input.feasibilityScore}/100 va moliyalashtirishga tayyorlik bo'yicha ${input.bankReadinessScore}/100 deb baholandi. Hisoblangan investitsiya ehtiyoji: ${formatUZS(f.financing.totalInvestmentNeed)}, oylik tushum: ${formatUZS(f.revenue.monthlyRevenue)}, EBITDA: ${formatUZS(f.profitability.monthlyEBITDA)}. Tushum tuzilgan maydonlardan hisoblandi: hajm ${Number(f.revenue.monthlyCapacity ?? 0).toLocaleString("ru-RU")} ${unitLabel}, o'rtacha narx ${formatUZS(f.revenue.averagePrice)} va yuklama ${f.revenue.expectedUtilizationPct ?? 100}%.`,
    `Project "${businessType}" is preliminarily scored at ${input.feasibilityScore}/100 for feasibility and ${input.bankReadinessScore}/100 for financing readiness. Calculated investment need: ${formatUZS(f.financing.totalInvestmentNeed)}, monthly revenue: ${formatUZS(f.revenue.monthlyRevenue)}, EBITDA: ${formatUZS(f.profitability.monthlyEBITDA)}. Revenue is calculated from structured fields: volume ${Number(f.revenue.monthlyCapacity ?? 0).toLocaleString("en-US")} ${unitLabel}, average price ${formatUZS(f.revenue.averagePrice)} and utilization ${f.revenue.expectedUtilizationPct ?? 100}%.`
  );
  const businessModelAssessment = localeFallbackText(locale,
    family === "retail"
      ? "Модель нужно проверять через трафик, конверсию, ассортимент, товарную маржу, оборачиваемость запасов, возвраты и условия поставщиков. До закупки партии важно подтвердить прайс конкурентов, размер первой закупки, правила обмена, сезонные остатки и минимальный запас."
      : family === "manufacturing"
        ? "Модель нужно проверять через загрузку оборудования, себестоимость материалов, качество, сертификацию, брак, энергозатраты и каналы сбыта. До запуска важно получить КП по оборудованию и сырью, а также посчитать мощность в базовом и стрессовом сценариях."
        : family === "rental"
          ? "Модель нужно проверять через загрузку активов, сезонность, обслуживание, повреждения, хранение/зарядку, договор с локацией и правила ответственности клиента. Средний чек должен быть связан с фактическим временем аренды и коэффициентом использования парка."
          : "Модель нужно проверять через единицу продажи услуги, каналы заявок, производительность команды, качество, отзывы и повторные обращения. Для сервисного бизнеса ключевые допущения — реальный поток клиентов, средний чек, загрузка специалистов и прямые расходные материалы.",
    "Biznes model tushum birligi, mijoz kanallari, operatsion quvvat, jamoa unumdorligi, sifat, takroriy mijozlar va to'g'ridan-to'g'ri xarajatlar orqali tekshiriladi. Yetkazib beruvchi takliflari, test savdo va lokatsiya shartlari tasdiqlanmaguncha farazlarni fakt deb qabul qilmaslik kerak.",
    family === "retail"
      ? "The model should be validated through traffic, conversion, assortment, product margin, stock turnover, returns and supplier terms. Before purchasing inventory, confirm competitor prices, the first stock batch, exchange rules and minimum stock."
      : family === "manufacturing"
        ? "The model should be validated through equipment utilization, material cost, quality control, certification, scrap, energy costs and distribution channels. Obtain supplier/equipment offers and calculate base and stress capacity scenarios before launch."
        : "The model should be validated through the revenue unit, lead channels, team productivity, quality, reviews and repeat demand. Key assumptions are real customer flow, average ticket, staff utilization and direct inputs."
  );
  const financialAnalysis = localeFallbackText(locale,
    `Финансовая модель показывает CapEx ${formatUZS(f.capex.totalCapEx)}, оборотный капитал ${formatUZS(f.workingCapital.requiredWorkingCapital)}, ежемесячные операционные расходы ${formatUZS(f.opex.monthlyFixedOpex)}, себестоимость единицы ${formatUZS(f.cogs.wasteAdjustedUnitCOGS)}, валовую маржу ${f.profitability.grossMarginPct ?? "н/д"}% и DSCR ${f.financing.dscrLabel ?? "н/д"}. Если маржа или DSCR выглядят очень высокими, их нужно подтвердить детализацией себестоимости, зарплат, аренды и стресс-сценарием по выручке.`,
    `Moliyaviy model CapEx ${formatUZS(f.capex.totalCapEx)}, aylanma kapital ${formatUZS(f.workingCapital.requiredWorkingCapital)}, oylik operatsion xarajatlar ${formatUZS(f.opex.monthlyFixedOpex)}, birlik tannarxi ${formatUZS(f.cogs.wasteAdjustedUnitCOGS)}, yalpi marja ${f.profitability.grossMarginPct ?? "n/a"}% va DSCR ${f.financing.dscrLabel ?? "n/a"} ni ko'rsatadi. Marja yoki DSCR juda yuqori ko'rinsa, tannarx, ish haqi, ijara va tushum stress-scenariysi bilan tasdiqlash kerak.`,
    `The financial model shows CapEx ${formatUZS(f.capex.totalCapEx)}, working capital ${formatUZS(f.workingCapital.requiredWorkingCapital)}, monthly operating expenses ${formatUZS(f.opex.monthlyFixedOpex)}, unit COGS ${formatUZS(f.cogs.wasteAdjustedUnitCOGS)}, gross margin ${f.profitability.grossMarginPct ?? "n/a"}% and DSCR ${f.financing.dscrLabel ?? "n/a"}. If margin or DSCR looks unusually high, validate COGS, payroll, rent and a revenue stress scenario.`
  );
  const actionPlan = localeFallbackText(locale,
    "1. Подтвердить спрос через тестовые заказы, пилотные продажи, замер трафика или предварительные заявки.\n2. Собрать 2-3 КП по оборудованию, материалам, товару или обслуживанию в зависимости от модели.\n3. Проверить договор локации, регистрацию, налоговый режим, кассу, трудовые документы и отраслевые разрешения.\n4. Обновить финансовую модель после подтверждения цены, маржи, загрузки и оборотного капитала.",
    "1. Talabni test buyurtmalar, pilot savdo, trafik o'lchovi yoki oldindan arizalar orqali tasdiqlang.\n2. Modelga qarab uskuna, material, tovar yoki servis bo'yicha 2-3 tijorat taklifini yig'ing.\n3. Lokatsiya shartnomasi, ro'yxatdan o'tish, soliq rejimi, kassa, mehnat hujjatlari va ruxsatlarni tekshiring.\n4. Narx, marja, yuklama va aylanma kapital tasdiqlangandan keyin moliyaviy modelni yangilang.",
    "1. Validate demand through test orders, pilot sales, traffic measurement or preliminary leads.\n2. Collect 2-3 offers for equipment, materials, goods or maintenance depending on the model.\n3. Check location contract, registration, tax regime, cash register, labor documents and sector permits.\n4. Update the financial model after price, margin, utilization and working capital are confirmed."
  );
  const investmentReadiness = localeFallbackText(locale,
    `Готовность к финансированию составляет ${input.bankReadinessScore}/100. Кредитор будет проверять источник погашения, подтвержденный клиентский поток, КП поставщиков, документы по локации, залог/лизинг и достаточность оборотного капитала.`,
    `Moliyalashtirishga tayyorlik ${input.bankReadinessScore}/100. Kreditor to'lov manbai, mijoz oqimi, yetkazib beruvchi takliflari, lokatsiya hujjatlari, garov/lizing va aylanma kapital yetarliligini tekshiradi.`,
    `Financing readiness is ${input.bankReadinessScore}/100. A lender will check repayment source, confirmed customer flow, supplier offers, location documents, collateral/leasing and working-capital adequacy.`
  );
  const report: AIGeneratedReport = {
    executiveSummary,
    marketAnalysis,
    businessModelAssessment,
    financialAnalysis,
    riskAssessment,
    actionPlan,
    investmentReadiness,
    fullNarrative: [executiveSummary, marketAnalysis, businessModelAssessment, financialAnalysis, riskAssessment, investmentReadiness].join("\n\n"),
    citations: facts.map((fact) => ({
      source: fact.sourcePublisher,
      title: fact.sourceTitle || fact.metricName,
      year: String(fact.period ?? "n/a").match(/20\d{2}|19\d{2}/)?.[0] ?? "n/a",
      text: `${fact.sourcePublisher}: ${fact.metricName}`,
      url: fact.sourceUrl
    })).slice(0, 10)
  };
  return sanitizeReport(report, locale);
}

export async function generateAIReport(input: {
  project: StructuredProjectData;
  financial: FinancialResult;
  risks: RiskItem[];
  feasibilityScore: number;
  bankReadinessScore: number;
  webResearch?: WebResearchResult | null;
  locale: "ru" | "uz" | "en";
}): Promise<AIGeneratedReport> {
  const response = await callOpenAIWithUsageLog({
    projectId: (input.project as { id?: string }).id,
    operation: "ai_report",
    model: reportModel(),
    request: (client) => client.responses.create({
    model: reportModel(),
    max_output_tokens: Number(process.env.OPENAI_REPORT_MAX_TOKENS ?? 4000),
    input: [
      { role: "system", content: buildReportSystemPrompt(input.locale) },
      { role: "user", content: buildReportUserPrompt({ ...input, locale: input.locale }) }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "finko_ai_report",
        strict: true,
        schema: aiReportJsonSchema
      }
    }
  } as never)
  });

  try {
    const parsed = JSON.parse(responseText(response)) as AIGeneratedReport;
    const sanitized = sanitizeReport(parsed, input.locale);
    const combined = [sanitized.fullNarrative, sanitized.marketAnalysis, sanitized.executiveSummary, sanitized.citations.map((citation) => `${citation.title} ${citation.source} ${citation.year}`).join(" ")].join(" ");
    if (hasAiAnalysisPlaceholderLeak(combined)) return generateFallbackReport(input);
    return sanitized;
  } catch (error) {
    await writeAIUsageLog({
      projectId: (input.project as { id?: string }).id,
      operation: "ai_report",
      provider: "openai",
      model: reportModel(),
      status: "fallback",
      fallbackUsed: true,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return sanitizeReport(generateFallbackReport(input), input.locale);
  }
}
