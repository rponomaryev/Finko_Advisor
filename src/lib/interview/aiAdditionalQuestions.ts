import { buildAdditionalBlockPrompt } from "../ai/prompts.ts";
import { callOpenAIWithUsageLog } from "../ai/openaiClient.ts";
import { approvedInterviewBlocks, type BusinessProfile } from "../business/businessClassifier.ts";
import type { InterviewQuestion, Locale } from "../types/project.ts";
import { findForbiddenUserFacingTerms, replaceForbiddenUserFacingTerms } from "../i18n/userFacingSanitizer.ts";

type ApprovedBlockId = typeof approvedInterviewBlocks[number];

type AIAdditionalQuestion = {
  key?: unknown;
  type?: unknown;
  label?: unknown;
  question?: unknown;
  block?: unknown;
  blockId?: unknown;
  options?: unknown;
  required?: unknown;
  affects?: unknown;
  source?: unknown;
  helpText?: unknown;
};

const additionalQuestionCache = new Map<string, InterviewQuestion[]>();
const reservedQuestionKeys = new Set([
  "businessType",
  "businessIdea",
  "region",
  "district",
  "productOrService",
  "targetCustomers",
  "customerAcquisitionChannels",
  "monthlyCapacity",
  "averagePrice",
  "premisesStatus",
  "monthlyRent",
  "premisesAreaSqm",
  "equipmentCondition",
  "equipmentList",
  "equipmentCapex",
  "staffPlan",
  "ownContributionAmount",
  "requestedLoanAmount",
  "requestedLeasingAmount",
  "certificationAwareness"
]);

const approvedBlockSet = new Set<string>(approvedInterviewBlocks);
const approvedFallbackBlocks: ApprovedBlockId[] = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
];

const allowedAffects = new Set([
  "businessProfile",
  "revenue",
  "cogs",
  "capex",
  "opex",
  "workingCapital",
  "riskScore",
  "documents",
  "marketValidation",
  "staffing",
  "seasonality",
  "financing",
  "location"
]);

function aiResponseText(response: unknown): string {
  const direct = (response as { output_text?: string }).output_text;
  if (typeof direct === "string") return direct;
  const output = (response as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }> }).output;
  const text = output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((value) => typeof value === "string");
  return text ?? "[]";
}

function normalizeJsonArray(value: string): AIAdditionalQuestion[] {
  const trimmed = value.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(trimmed) as unknown;
  return Array.isArray(parsed) ? parsed as AIAdditionalQuestion[] : [];
}

function slugKey(value: unknown, fallbackIndex: number): string {
  const raw = typeof value === "string" ? value : `ai_unknown_business_${fallbackIndex + 1}`;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  const normalized = slug || `ai_unknown_business_${fallbackIndex + 1}`;
  return normalized.startsWith("ai_") ? normalized : `ai_${normalized}`;
}

function normalizeType(value: unknown): InterviewQuestion["type"] {
  if (value === "select") return "select";
  if (value === "number") return "number";
  if (value === "boolean") return "boolean";
  if (value === "text") return "textarea";
  return "textarea";
}

function normalizeOptions(value: unknown, type: InterviewQuestion["type"]): string[] | undefined {
  if (type !== "select" || !Array.isArray(value)) return undefined;
  const options = value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  return options.length >= 2 ? options : undefined;
}

function normalizeAffects(value: unknown, fallback: string[]): string[] {
  const items = Array.isArray(value) ? value : fallback;
  const normalized = items.map((item) => String(item).trim()).filter((item) => allowedAffects.has(item));
  return normalized.length ? Array.from(new Set(normalized)) : fallback;
}

function normalizeBlockId(value: unknown, label: string): ApprovedBlockId {
  const raw = String(value ?? "").trim();
  if (approvedBlockSet.has(raw)) return raw as ApprovedBlockId;
  const text = `${raw} ${label}`.toLowerCase();
  if (/finance|funding|loan|leasing|credit|collateral|working capital|финанс|кредит|лизинг|залог|оборот/i.test(text)) return "financing";
  if (/document|permit|license|certificate|compliance|legal|contract|experience|документ|разреш|лиценз|сертифик|договор|опыт|прав/i.test(text)) return "documents_experience";
  if (/supplier|procurement|purchase|inventory|stock|consumable|raw|cogs|spare|закуп|поставщик|запас|сырь|расходник|себестоим/i.test(text)) return "suppliers_procurement";
  if (/sale|demand|client|customer|market|price|ticket|channel|contract|b2b|продаж|спрос|клиент|цена|канал|договор/i.test(text)) return "sales";
  if (/location|premises|warehouse|storage|route|area|rent|traffic|локац|помещ|склад|маршрут|площад|аренд/i.test(text)) return "location";
  if (/equipment|launch|capex|tool|asset|vehicle|fleet|drone|sensor|battery|оборуд|запуск|инструмент|актив|дрон|батар|датчик/i.test(text)) return "equipment_launch";
  if (/operation|process|capacity|staff|team|quality|maintenance|sla|flight|monitoring|операц|процесс|мощност|команд|качество|sla|полет|монитор/i.test(text)) return "operations";
  return "business_idea";
}

function cacheKey(input: { businessType: string; businessIdea?: string; locale: Locale; profile: Pick<BusinessProfile, "category" | "subcategory" | "additionalInterviewTopics"> }) {
  return [
    input.locale,
    input.businessType.trim().toLowerCase(),
    (input.businessIdea ?? "").trim().toLowerCase(),
    input.profile.category,
    input.profile.subcategory ?? "",
    ...(input.profile.additionalInterviewTopics ?? [])
  ].join("|");
}

function localeCopy(locale: Locale, ru: string, en: string, uz: string) {
  if (locale === "en") return en;
  if (locale === "uz") return uz;
  return ru;
}


function fallbackAIQuestion(locale: Locale, index = 0): InterviewQuestion {
  const copy = {
    ru: {
      label: "Уточнение проекта",
      question: "Уточните ключевые детали проекта: продукт, клиента, цену, расходы, поставщиков и документы.",
      helpText: "Автоматический вопрос не прошёл проверку языка, длины или дублей, поэтому показан безопасный резервный вопрос."
    },
    uz: {
      label: "Loyiha aniqlashtirishi",
      question: "Loyihaning asosiy tafsilotlarini aniqlashtiring: mahsulot, mijoz, narx, xarajatlar, yetkazib beruvchilar va hujjatlar.",
      helpText: "Avtomatik savol til, uzunlik yoki takror tekshiruvidan o'tmagani uchun xavfsiz zaxira savol ko'rsatildi."
    },
    en: {
      label: "Project clarification",
      question: "Clarify the key project details: product, customer, price, costs, suppliers and documents.",
      helpText: "The generated question failed validation, so a safe fallback question is shown."
    }
  }[locale];
  return {
    key: `ai_safe_fallback_${index + 1}`,
    label: copy.label,
    question: copy.question,
    helpText: copy.helpText,
    type: "textarea",
    optional: true,
    required: false,
    blockId: "business_idea",
    semanticGroup: "ai_safe_fallback",
    affects: ["businessProfile", "riskScore"],
    source: "fallback_template",
    capabilityTags: ["ai_generated", "post_validation_fallback"]
  };
}

function stripAllowedRuntimeTokens(value: string): string {
  return value
    .replace(/https?:\/\/\S+|\b[a-z0-9.-]+\.(?:uz|com|org|net|ru|io)\S*/gi, "")
    .replace(/\b(UZS|USD|EUR|Telegram|Instagram|Google|2GIS|FINKO|PDF|Excel|API|OpenAI|ChatGPT)\b/gi, "");
}

function hasWrongLanguageLeak(value: string, locale: Locale): boolean {
  const text = stripAllowedRuntimeTokens(value);
  if (locale === "ru") return /[A-Za-z]{3,}/.test(text);
  if (locale === "uz") return /[А-Яа-яЁёЎўҒғҚқҲҳ]{2,}/.test(text);
  return false;
}

function sanitizeAIText(value: string, locale: Locale): string {
  return replaceForbiddenUserFacingTerms(value.replace(/\s+/g, " ").trim(), locale);
}

function shortFallbackLabel(blockId: ApprovedBlockId, locale: Locale, value = ""): string {
  const text = value.toLowerCase();
  if (/monitor|монитор|агро|agro|field|пол|ndvi|vegetatsiya|ekin/i.test(text)) {
    return locale === "ru" ? "Задачи мониторинга" : locale === "uz" ? "Monitoring vazifalari" : "Monitoring tasks";
  }
  if (/fleet|drone|дрон|камера|sensor|сенсор|payload|equipment|оборуд/i.test(text)) {
    return locale === "ru" ? "Оборудование" : locale === "uz" ? "Uskunalar" : "Equipment";
  }
  if (/price|цена|narx|sales|продаж|sotuv|demand|спрос|talab/i.test(text)) {
    return locale === "ru" ? "Продажи и спрос" : locale === "uz" ? "Sotuv va talab" : "Sales and demand";
  }
  if (/document|permit|license|документ|разреш|hujjat|ruxsat/i.test(text)) {
    return locale === "ru" ? "Документы" : locale === "uz" ? "Hujjatlar" : "Documents";
  }
  const fallback: Record<ApprovedBlockId, Record<Locale, string>> = {
    business_idea: { ru: "Уточнение предложения", uz: "Taklifni aniqlashtirish", en: "Offer clarification" },
    location: { ru: "Локация и инфраструктура", uz: "Joylashuv va infratuzilma", en: "Location and infrastructure" },
    equipment_launch: { ru: "Оборудование и запуск", uz: "Uskuna va ishga tushirish", en: "Equipment and launch" },
    operations: { ru: "Операционная модель", uz: "Operatsion model", en: "Operating model" },
    suppliers_procurement: { ru: "Поставщики и закупки", uz: "Yetkazib beruvchilar va xaridlar", en: "Suppliers and procurement" },
    sales: { ru: "Продажи и спрос", uz: "Sotuv va talab", en: "Sales and demand" },
    financing: { ru: "Финансирование", uz: "Moliyalashtirish", en: "Financing" },
    documents_experience: { ru: "Документы и опыт", uz: "Hujjatlar va tajriba", en: "Documents and experience" }
  };
  return fallback[blockId][locale];
}

function conciseAIFieldLabel(value: string, locale: Locale, blockId: ApprovedBlockId): string {
  const clean = sanitizeAIText(value, locale).replace(/[?.؟]+$/g, "").trim();
  const questionLike = /[?؟]|^(какие|какая|какой|как|сколько|что|кто|где|когда|укажите|which|what|how|where|who|qanday|qaysi|kim|nima)/i.test(clean);
  if (!questionLike && clean.length > 0 && clean.length <= 60) return clean;
  return shortFallbackLabel(blockId, locale, clean);
}

function similarityFingerprint(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-яё0-9ўғқҳ]+/gi, " ").split(/\s+/).filter((token) => token.length > 2));
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = similarityFingerprint(left);
  const rightTokens = similarityFingerprint(right);
  if (leftTokens.size === 0 && rightTokens.size === 0) return 1;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

function isValidGeneratedQuestion(question: InterviewQuestion, locale: Locale, seenTexts: Set<string>): boolean {
  if (!question.label.trim() || !question.question.trim()) return false;
  if (question.label.length > 60 || question.question.length > 220 || (question.helpText?.length ?? 0) > 700) return false;
  if (question.label.trim().toLowerCase() === question.question.trim().toLowerCase() || jaccardSimilarity(question.label, question.question) > 0.8) return false;
  const visibleText = [question.label, question.question, question.helpText, ...(question.options ?? [])].filter(Boolean).join(" ");
  if (findForbiddenUserFacingTerms(visibleText, locale).length > 0) return false;
  if (hasWrongLanguageLeak(visibleText, locale)) return false;
  const fingerprint = question.question.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim();
  if (seenTexts.has(fingerprint)) return false;
  seenTexts.add(fingerprint);
  return true;
}

function deterministicFallbackQuestions(input: {
  businessType: string;
  businessIdea?: string;
  locale: Locale;
  profile: BusinessProfile;
}): InterviewQuestion[] {
  const text = `${input.businessType} ${input.businessIdea ?? ""}`.toLowerCase();
  const isDroneAgro = /дрон|drone|agro|агро|пол[ея]|monitor/i.test(text);
  const source = "fallback_template";
  const tags = ["unknown_business_fallback_template", "deterministic", input.profile.category, input.profile.subcategory ?? "generic"];

  const templates = isDroneAgro ? [
    {
      key: "ai_drone_monitoring_service_scope",
      blockId: "business_idea" as ApprovedBlockId,
      semanticGroup: "unknown_drone_agromonitoring_scope",
      affects: ["businessProfile", "revenue", "marketValidation"],
      ru: "Какие задачи агромониторинга будут в базовой услуге: NDVI/здоровье посевов, ортофотоплан, подсчёт всходов, выявление сорняков или отчёт для агронома?",
      en: "Which agromonitoring tasks are included in the core service: NDVI/crop health, orthophoto map, emergence count, weed detection, or an agronomist report?",
      uz: "Asosiy agromonitoring xizmatiga qaysi vazifalar kiradi: NDVI/ekin holati, ortofotoplan, nihollarni sanash, begona o'tlarni aniqlash yoki agronom uchun hisobot?"
    },
    {
      key: "ai_drone_fleet_payloads",
      blockId: "equipment_launch" as ApprovedBlockId,
      semanticGroup: "unknown_drone_fleet_payloads",
      affects: ["capex", "riskScore"],
      ru: "Какие дроны, камеры, мультиспектральные сенсоры, аккумуляторы, зарядные станции и ПО для обработки карт нужны на старте?",
      en: "Which drones, cameras, multispectral sensors, batteries, charging stations, and mapping software are needed at launch?",
      uz: "Startda qaysi dronlar, kameralar, multispektral sensorlar, akkumulyatorlar, zaryad stansiyalari va xaritalash dasturi kerak?"
    },
    {
      key: "ai_drone_flight_operations",
      blockId: "operations" as ApprovedBlockId,
      semanticGroup: "unknown_drone_flight_operations",
      affects: ["staffing", "opex", "riskScore"],
      ru: "Сколько гектаров команда может обследовать за день с учётом выезда, погоды, разрешений на полёт, обработки данных и подготовки отчёта?",
      en: "How many hectares can the team survey per day considering travel, weather, flight permissions, data processing, and report preparation?",
      uz: "Jamoa yo'l, ob-havo, parvoz ruxsatlari, ma'lumotlarni qayta ishlash va hisobot tayyorlashni hisobga olib kuniga necha gektarni tekshira oladi?"
    },
    {
      key: "ai_drone_sales_pricing",
      blockId: "sales" as ApprovedBlockId,
      semanticGroup: "unknown_drone_sales_pricing",
      affects: ["revenue", "marketValidation", "seasonality"],
      ru: "Как будет считаться цена: за гектар, выезд, сезонный пакет или абонентский мониторинг, и есть ли предварительные договорённости с фермерскими хозяйствами?",
      en: "How will pricing work: per hectare, per visit, seasonal package, or subscription monitoring, and are there preliminary agreements with farms?",
      uz: "Narx qanday hisoblanadi: gektar bo'yicha, chiqish bo'yicha, mavsumiy paket yoki abonent monitoring, va fermer xo'jaliklari bilan dastlabki kelishuvlar bormi?"
    },
    {
      key: "ai_drone_regulatory_insurance",
      blockId: "documents_experience" as ApprovedBlockId,
      semanticGroup: "unknown_drone_regulatory_insurance",
      affects: ["documents", "riskScore"],
      ru: "Какие требования к полётам БПЛА, страхованию ответственности, согласованию съёмки и хранению геоданных нужно проверить до запуска?",
      en: "Which UAV flight, liability insurance, imaging approval, and geodata storage requirements must be checked before launch?",
      uz: "Ishga tushirishdan oldin BPLA parvozlari, javobgarlik sug'urtasi, suratga olish ruxsati va geoma'lumotlarni saqlash bo'yicha qaysi talablarni tekshirish kerak?"
    }
  ] : [
    {
      key: "ai_unknown_offer_scope",
      blockId: "business_idea" as ApprovedBlockId,
      semanticGroup: "unknown_offer_scope",
      affects: ["businessProfile", "revenue", "marketValidation"],
      ru: `Какая конкретная услуга или продукт будет основой выручки для «${input.businessType}» и какая единица продажи используется?`,
      en: `Which specific service or product will drive revenue for “${input.businessType}” and what sales unit is used?`,
      uz: `«${input.businessType}» uchun asosiy tushumni qaysi aniq xizmat yoki mahsulot beradi va sotuv birligi nima?`
    },
    {
      key: "ai_unknown_operational_capacity",
      blockId: "operations" as ApprovedBlockId,
      semanticGroup: "unknown_operational_capacity",
      affects: ["opex", "staffing", "riskScore"],
      ru: "Какая операционная мощность реалистична в месяц и что ограничивает выполнение заказов: люди, оборудование, сезонность, логистика или документы?",
      en: "What monthly operating capacity is realistic, and what limits order fulfillment: people, equipment, seasonality, logistics, or documents?",
      uz: "Oyiga qanday operatsion quvvat real va buyurtmalarni bajarishni nima cheklaydi: odamlar, uskuna, mavsumiylik, logistika yoki hujjatlar?"
    },
    {
      key: "ai_unknown_supplier_inputs",
      blockId: "suppliers_procurement" as ApprovedBlockId,
      semanticGroup: "unknown_supplier_inputs",
      affects: ["cogs", "workingCapital", "riskScore"],
      ru: "Какие регулярные закупки, расходники, комплектующие или внешние услуги нужны для выполнения одного заказа и кто запасной поставщик?",
      en: "Which recurring purchases, consumables, components, or outsourced services are needed for one order, and who is the backup supplier?",
      uz: "Bitta buyurtmani bajarish uchun qaysi doimiy xaridlar, sarf materiallari, butlovchilar yoki tashqi xizmatlar kerak va zaxira yetkazib beruvchi kim?"
    },
    {
      key: "ai_unknown_sales_validation",
      blockId: "sales" as ApprovedBlockId,
      semanticGroup: "unknown_sales_validation",
      affects: ["revenue", "marketValidation"],
      ru: "Как будет подтверждаться спрос: тестовые продажи, заявки, предзаказы, корпоративные письма о намерениях, партнёры или повторные клиенты?",
      en: "How will demand be validated: test sales, leads, preorders, corporate letters of intent, partners, or repeat customers?",
      uz: "Talab qanday tasdiqlanadi: test savdolar, arizalar, oldindan buyurtmalar, korporativ niyat xatlari, hamkorlar yoki takroriy mijozlar?"
    }
  ];

  const normalized = normalizeAIQuestions(templates.slice(0, 5).map((item, index) => ({
    key: item.key,
    label: shortFallbackLabel(item.blockId, input.locale, `${item.semanticGroup} ${localeCopy(input.locale, item.ru, item.en, item.uz)}`),
    question: localeCopy(input.locale, item.ru, item.en, item.uz),
    type: "text",
    blockId: item.blockId,
    affects: item.affects,
    source,
    helpText: input.locale === "ru"
      ? "Ответ поможет уточнить расчёт, риски и готовность проекта."
      : input.locale === "uz"
        ? "Javob hisob-kitob, risklar va loyiha tayyorligini aniqlashtirishga yordam beradi."
        : "The answer will clarify the calculation, risks and project readiness."
  })), "fallback_template", input.locale);
  return normalized.map((question) => ({
    ...question,
    source: "fallback_template",
    capabilityTags: Array.from(new Set([...(question.capabilityTags ?? []), ...tags, "post_validated"]))
  }));
}

function mockAdditionalQuestionsFromEnv(): AIAdditionalQuestion[] | undefined {
  const raw = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON ?? process.env.OPENAI_ADDITIONAL_QUESTIONS_MOCK_JSON;
  if (!raw) return undefined;
  return normalizeJsonArray(raw);
}

function normalizeAIQuestions(items: AIAdditionalQuestion[], source: "fallback_ai" | "fallback_template", locale: Locale): InterviewQuestion[] {
  const seenKeys = new Set<string>();
  const seenTexts = new Set<string>();
  const questions: InterviewQuestion[] = [];
  for (const [index, item] of items.entries()) {
    const type = normalizeType(item.type);
    const rawLabel = typeof item.label === "string" ? item.label.trim() : "";
    const rawQuestion = typeof item.question === "string" ? item.question.trim() : "";
    const questionText = sanitizeAIText(rawQuestion || rawLabel, locale);
    const questionKey = slugKey(item.key, index);
    const options = normalizeOptions(item.options, type)?.map((option) => sanitizeAIText(option, locale));
    const rawHelpText = typeof item.helpText === "string" ? item.helpText.trim() : "";
    const helpText = rawHelpText ? sanitizeAIText(rawHelpText, locale) : locale === "ru"
      ? "Ответ поможет уточнить расчёт, риски и готовность проекта."
      : locale === "uz"
        ? "Javob hisob-kitob, risklar va loyiha tayyorligini aniqlashtirishga yordam beradi."
        : "The answer will clarify the calculation, risks and project readiness.";
    if (!questionText || reservedQuestionKeys.has(questionKey) || seenKeys.has(questionKey)) continue;
    if (type === "select" && !options) continue;
    const blockId = normalizeBlockId(item.blockId ?? item.block, `${rawLabel} ${questionText}`);
    const label = conciseAIFieldLabel(rawLabel || rawQuestion || questionText, locale, blockId);
    if (!label) continue;
    const candidate: InterviewQuestion = {
      key: questionKey,
      label,
      question: questionText,
      helpText,
      type,
      options,
      optional: item.required === true ? false : true,
      required: item.required === true,
      blockId,
      semanticGroup: `ai_unknown_business_${blockId}_${index + 1}`,
      affects: normalizeAffects(item.affects, ["businessProfile", "riskScore"]),
      source: source === "fallback_template" ? "fallback_template" : String(item.source ?? "fallback_ai"),
      capabilityTags: [
        source === "fallback_template" ? "unknown_business_fallback_template" : "unknown_business_ai_fallback",
        "ai_generated",
        "post_validated",
        blockId
      ]
    };
    if (!isValidGeneratedQuestion(candidate, locale, seenTexts)) continue;
    seenKeys.add(questionKey);
    questions.push(candidate);
    if (questions.length >= 5) break;
  }
  return questions.length ? questions : [fallbackAIQuestion(locale)];
}

export async function generateAIAdditionalInterviewQuestions(input: {
  businessType: string;
  businessIdea?: string;
  locale?: Locale;
  profile: BusinessProfile;
}): Promise<InterviewQuestion[]> {
  const locale = input.locale ?? "ru";
  const key = cacheKey({ ...input, locale });
  const cached = additionalQuestionCache.get(key);
  if (cached) return cached;

  try {
    const mocked = mockAdditionalQuestionsFromEnv();
    if (mocked) {
      const questions = normalizeAIQuestions(mocked, "fallback_ai", locale);
      additionalQuestionCache.set(key, questions);
      return questions;
    }
  } catch {
    // Invalid mock JSON should not break the interview flow; fall through to deterministic fallback if needed.
  }

  if (!process.env.OPENAI_API_KEY) {
    const questions = deterministicFallbackQuestions({ ...input, locale });
    additionalQuestionCache.set(key, questions);
    return questions;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  try {
    const response = await callOpenAIWithUsageLog({
      operation: "unknown_business_additional_interview_questions",
      model,
      request: (client) => client.responses.create({
        model,
        max_output_tokens: 1400,
        input: [
          { role: "system", content: "You generate concise, business-specific interview questions for unknown business types. Return only valid JSON." },
          {
            role: "user",
            content: buildAdditionalBlockPrompt({
              businessType: input.businessType,
              businessIdea: input.businessIdea,
              profile: input.profile,
              locale
            })
          }
        ]
      } as never)
    });

    const questions = normalizeAIQuestions(normalizeJsonArray(aiResponseText(response)), "fallback_ai", locale);
    additionalQuestionCache.set(key, questions);
    return questions;
  } catch {
    const questions = deterministicFallbackQuestions({ ...input, locale });
    additionalQuestionCache.set(key, questions);
    return questions;
  }
}

export function clearAIAdditionalInterviewQuestionsCacheForTests() {
  additionalQuestionCache.clear();
}
