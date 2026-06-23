import type { Locale, StructuredProjectData } from "../types/project.ts";
import { findBusinessSampleProfile } from "../data/businessSamples/businessSamples.ts";

export type BusinessCategory =
  | "services"
  | "manufacturing"
  | "retail"
  | "ecommerce"
  | "food_service"
  | "import_export"
  | "agriculture"
  | "construction"
  | "real_estate"
  | "logistics"
  | "transport"
  | "education"
  | "healthcare"
  | "beauty_wellness"
  | "tourism_hospitality"
  | "professional_services"
  | "it_digital"
  | "financial_services"
  | "entertainment"
  | "energy"
  | "mining"
  | "recycling_waste"
  | "other"
  | "generic";

export type OperationalModel =
  | "standalone_location"
  | "rented_space"
  | "inside_partner_location"
  | "one_box_inside_larger_business"
  | "specialized_service"
  | "to_be_confirmed"
  | "home_based"
  | "mobile_service"
  | "online_only"
  | "marketplace"
  | "production_workshop"
  | "warehouse_based"
  | "franchise"
  | "b2b_contract_model"
  | "b2c_walk_in"
  | "location_based_retail"
  | "hybrid_offline_online"
  | "format_to_be_confirmed"
  | "mixed";


export type BusinessCapabilities = {
  providesServices?: boolean;
  sellsGoods?: boolean;
  hasInventory?: boolean;
  hasPhysicalLocation?: boolean;
  locationTrafficCritical?: boolean;
  needsEquipment?: boolean;
  needsStaff?: boolean;
  hasRegulatedActivity?: boolean;
  hasSanitaryRequirements?: boolean;
  dependsOnHostBusinessTraffic?: boolean;
  hasB2BClients?: boolean;
  hasRepeatCustomers?: boolean;
  hasChildSafetyRisk?: boolean;
  rentalOrUsageBasedRevenue?: boolean;
};

export type BusinessProfile = {
  category: BusinessCategory;
  subcategory?: string;
  businessModel: string;
  operationalModel?: OperationalModel;
  confidence: number;
  primaryRevenueModel: string;
  secondaryRevenueModels?: string[];
  sellsGoods: boolean;
  providesServices: boolean;
  producesGoods: boolean;
  rentsAssets: boolean;
  importsGoodsOrInputs: boolean;
  importsGoods: boolean;
  exportsGoodsOrServices: boolean;
  usesDelivery: boolean;
  usesPremises: boolean;
  usesMobileService: boolean;
  hasInventory: boolean;
  hasEquipment: boolean;
  hasPremises: boolean;
  hasStaff: boolean;
  hasLicensingOrPermits: boolean;
  hasSanitaryRequirements: boolean;
  hasEnvironmentalRisk: boolean;
  hasSafetyRisk: boolean;
  hasSeasonality: boolean;
  hasHighWorkingCapitalNeed: boolean;
  hasCustomerFlowDependency: boolean;
  hasB2BContracts: boolean;
  hasWalkInTraffic: boolean;
  hasRegulatedActivity: boolean;
  hasCurrencyExposure: boolean;
  hasCreditOrLeasingNeed: boolean;
  capabilities: BusinessCapabilities;
  revenueUnit: string;
  capacityUnit: string;
  averageTicketField: string;
  volumeField: string;
  relevantInterviewBlocks: string[];
  excludedInterviewBlocks: string[];
  requiredDataForAnalysis: string[];
  keyCostDrivers: string[];
  keyRevenueDrivers: string[];
  keyRisks: string[];
  documentCategories: string[];
  sourceCategories: string[];
  recommendedSourceCategories: string[];
  additionalInterviewTopics?: string[];
  documentProfile?: string;
  needsSpecialLicense?: boolean;
  isImportDependent?: boolean;
  isFoodRelated?: boolean;
  aiClassification?: Record<string, unknown>;
  _requiresAIClassification?: boolean;
  _classificationHint?: string;
};

export type ClassifierInput = {
  businessType?: string;
  businessName?: string;
  businessDescription?: string;
  productOrService?: string;
  businessIdea?: string;
  region?: string;
  language?: Locale | string;
  answers?: Partial<StructuredProjectData>;
  userContext?: Record<string, unknown>;
};

export type BusinessClassificationAudit = {
  inputBusinessType: string;
  normalizedBusinessType: string;
  matchedSampleId?: string;
  confidence: number;
  matchedAliases: string[];
  signals: {
    businessType: number;
    description: number;
    productService: number;
    businessName: number;
    other: number;
  };
  fallbackUsed: boolean;
  classificationNeedsReview: boolean;
  reason: string;
};

export type BusinessClassificationResult = BusinessProfile & {
  classificationNeedsReview?: boolean;
  classificationAudit?: BusinessClassificationAudit;
};

export const approvedInterviewBlocks = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
] as const;

const baseBlocks = [...approvedInterviewBlocks];

const forbiddenClassifierKeys = new Set([
  "interviewPlan",
  "advisorMessage",
  "report",
  "reportPreview",
  "questions",
  "interviewBlocks",
  "templateData",
  "reportData",
  "debug"
]);

function classifierAnswerSignal(answers: Partial<StructuredProjectData>, key: keyof StructuredProjectData) {
  if (forbiddenClassifierKeys.has(String(key))) return undefined;
  const value = answers[key];
  return typeof value === "string" ? value : undefined;
}

function normalize(input: ClassifierInput) {
  const answers = input.answers ?? {};
  const safeSignals = [
    input.businessType,
    input.businessIdea,
    input.region,
    classifierAnswerSignal(answers, "businessType"),
    classifierAnswerSignal(answers, "businessIdea"),
    classifierAnswerSignal(answers, "productOrService"),
    classifierAnswerSignal(answers, "region"),
    classifierAnswerSignal(answers, "district"),
    answers.sectionNotes?.businessIdea
  ];

  return normalizeForMatchingText(
    safeSignals
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ")
  );
}

export function normalizeBusinessSignal(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[’`]/g, "'")
    .replace(/[‐-―]/g, "-")
    .replace(/[^a-zа-я0-9'\s/-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatchingText(value: unknown) {
  const base = normalizeBusinessSignal(value);
  const additions: string[] = [];

  const addIf = (pattern: RegExp, extra: string) => {
    if (pattern.test(base)) additions.push(extra);
  };

  addIf(/\bvelosiped(?:lar)?\b/g, "велосипед велосипеды прокат bicycle bike rental");
  addIf(/\bsamokat(?:lar)?\b/g, "самокат самокаты прокат scooter rental");
  addIf(/\b(?:ijara|ijarasi|ijaraga|prokat|prokati)\b/g, "аренда прокат rental hire");
  addIf(/\bsartaroshxona\b/g, "парикмахерская hairdresser hair salon");
  addIf(/\bsoch\b/g, "волосы стрижка hair haircut");
  addIf(/\bgo'?zallik\s+saloni\b/g, "салон красоты beauty salon spa salon");
  addIf(/\bmanikur\b|\btirnoq\b/g, "маникюр ногти nail salon manicure");
  addIf(/\bmassaj\b/g, "массаж massage");
  addIf(/\bfitnes\b|\bsport\s+zali\b/g, "фитнес спортзал gym fitness");
  addIf(/\byoga\b/g, "йога yoga");
  addIf(/\bnonvoyxona\b|\bnon\b/g, "пекарня хлеб bakery bread shop");
  addIf(/\bkofe[xh]ona\b|\bqahvaxona\b|\bkofe\b/g, "кофейня coffee cafe coffee shop");
  addIf(/\btezkor\s+ovqat\b|\btez\s+ovqat\b|\bfastfud\b/g, "фастфуд fast food snack bar");
  addIf(/\blavash\b/g, "лаваш lavash");
  addIf(/\bshaorma\b/g, "шаурма shawarma");
  addIf(/\bpitsa\b/g, "пицца pizza");
  addIf(/\bburger\b/g, "бургер burger hamburger");
  addIf(/\bmuzqaymoq\b/g, "мороженое ice cream");
  addIf(/\bdo'?kon\b|\bmagazin\b/g, "магазин store shop");
  addIf(/\bkiyim\b/g, "одежда clothing clothes");
  addIf(/\bpoyabzal\b|\boyoq\s+kiyim\b/g, "обувь shoe footwear");
  addIf(/\bbolalar\b/g, "дети детский children kids");
  addIf(/\bayollar\b/g, "женский women ladies");
  addIf(/\berkaklar\b/g, "мужской men");
  addIf(/\btelefon\b|\bsmartfon\b/g, "телефон smartphone phone");
  addIf(/\bnoutbuk\b|\bkompyuter\b/g, "ноутбук компьютер laptop computer");
  addIf(/\bta'?mir(?:lash|i)?\b/g, "ремонт repair");
  addIf(/\bavto\b|\bmashina\b/g, "авто автомобиль car auto");
  addIf(/\byuvish\b|\bmoyka\b/g, "мойка wash car wash");
  addIf(/\bavtoservis\b|\bsto\b/g, "автосервис car service auto service car repair");
  addIf(/\bshinomontaj\b|\bshina\b/g, "шиномонтаж tire service tire repair");
  addIf(/\bingliz\s+tili\b/g, "английский язык english english courses");
  addIf(/\bielts\b/g, "IELTS ielts prep exam preparation");
  addIf(/\bmarkaz\b/g, "центр center");
  addIf(/\bbog'?cha\b/g, "детский сад kindergarten daycare");
  addIf(/\bo'?yin\s+xonasi\b/g, "игровая комната playroom");
  addIf(/\bbatut\b/g, "батут trampoline");
  addIf(/\btozalash\b|\bklining\b/g, "уборка cleaning");
  addIf(/\bmehmonxona\b/g, "гостиница hotel");
  addIf(/\bturistik\b|\bsayohat\b/g, "туризм travel tour");
  addIf(/\byetkazib\s+berish\b|\bdostavka\b/g, "доставка delivery");
  addIf(/\bmebel\b/g, "мебель furniture");
  addIf(/\btikuv\b|\btikish\b/g, "швейный sewing tailoring");
  addIf(/\bissiqxona\b|\bteplitsa\b/g, "теплица greenhouse");
  addIf(/\bparranda\b|\btovuq\b/g, "птица poultry chicken");
  addIf(/\basalari\b|\basal\b/g, "пчеловодство мед honey apiary");
  addIf(/\bcall\s*markaz\b|\bkol\s*markaz\b/g, "колл центр call center");

  return Array.from(new Set([base, ...additions]))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function explicitBusinessTypeText(input: ClassifierInput) {
  const answers = input.answers ?? {};
  return [input.businessType, classifierAnswerSignal(answers, "businessType")]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

function productServiceText(input: ClassifierInput) {
  const answers = input.answers ?? {};
  return [input.productOrService, classifierAnswerSignal(answers, "productOrService"), (answers as Record<string, unknown>).serviceType, (answers as Record<string, unknown>).serviceCategories]
    .map((value) => Array.isArray(value) ? value.join(" ") : value)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

function businessNameText(input: ClassifierInput) {
  const answers = input.answers ?? {};
  return [
    input.businessName,
    (answers as Record<string, unknown>).businessName,
    (answers as Record<string, unknown>).title,
    (answers as Record<string, unknown>).projectName,
    input.userContext?.businessName
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

function descriptionText(input: ClassifierInput) {
  const answers = input.answers ?? {};
  return [input.businessDescription, input.businessIdea, classifierAnswerSignal(answers, "businessIdea"), answers.sectionNotes?.businessIdea]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

function otherClassifierText(input: ClassifierInput) {
  const answers = input.answers ?? {};
  return [
    input.region,
    classifierAnswerSignal(answers, "region"),
    classifierAnswerSignal(answers, "district"),
    (answers as Record<string, unknown>).revenueModel,
    (answers as Record<string, unknown>).operationalModel,
    (answers as Record<string, unknown>).equipmentList,
    (answers as Record<string, unknown>).targetCustomers
  ]
    .map((value) => Array.isArray(value) ? value.join(" ") : value)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

const classificationSignalWeights = {
  businessType: 0.62,
  description: 0.18,
  productService: 0.1,
  businessName: 0.06,
  other: 0.04
} as const;

function weightedSampleConfidence(score: number, weight: number, exactPhrase: boolean) {
  const scoreConfidence = Math.min(1, Math.max(0, score / 2200));
  const exactBoost = exactPhrase ? 0.28 : 0;
  return Math.min(0.99, Math.max(0, weight + scoreConfidence * 0.34 + exactBoost));
}

function attachClassificationAudit(base: BusinessProfile, audit: BusinessClassificationAudit): BusinessClassificationResult {
  const result = {
    ...base,
    confidence: audit.confidence,
    classificationNeedsReview: audit.classificationNeedsReview,
    classificationAudit: audit,
    aiClassification: {
      ...(base.aiClassification ?? {}),
      sampleId: audit.matchedSampleId ?? (base.aiClassification as { sampleId?: string } | undefined)?.sampleId,
      confidence: audit.confidence,
      classificationNeedsReview: audit.classificationNeedsReview,
      fallbackUsed: audit.fallbackUsed,
      reason: audit.reason,
      signals: audit.signals,
      debug: process.env.DEBUG_BUSINESS_CLASSIFIER === "true" ? audit : undefined
    }
  };
  if (process.env.DEBUG_BUSINESS_CLASSIFIER === "true") {
    console.info("[business-classifier:audit]", audit);
  }
  return result;
}

function includesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function answerText(answers: Partial<StructuredProjectData>, key: string): string {
  const value = (answers as Record<string, unknown>)[key];
  return typeof value === "string" ? value.toLowerCase() : "";
}

function resolveLocationOperationalModel(text: string): OperationalModel {
  if (includesAny(text, [
    /(внутри|в|на территории|островок|точка|корнер)[^.!?]{0,80}(тц|торгов(ый|ого|ом)? центр|супермаркет|магазин|салон|фудкорт|бизнес[-\s]?центр|партнерск|партнёрск)/i,
    /(тц|торгов(ый|ого|ом)? центр|супермаркет|магазин|салон|фудкорт|бизнес[-\s]?центр)[^.!?]{0,80}(внутри|аренд|субаренд|точка|островок|корнер)/i,
    /inside[^.!?]{0,60}(partner|mall|store|supermarket|salon|business center)/i
  ])) return "inside_partner_location";
  if (includesAny(text, [/выездн|на выезд|выезде|мобильн|на дому у клиента|на объект|mobile|on[-\s]?site/i])) return "mobile_service";
  if (includesAny(text, [/онлайн|online|remote|удален/i])) return "online_only";
  if (includesAny(text, [/на дому|home[-\s]?based|домашн/i])) return "home_based";
  return "standalone_location";
}

function resolveAutoServiceOperationalModel(text: string, answers: Partial<StructuredProjectData>): OperationalModel {
  const format = answerText(answers, "autoServiceFormat");
  if (["one_box_inside_large_service", "one_box_inside_larger_service", "one_box_inside_partner_service", "inside_partner_location"].includes(format)) {
    return "inside_partner_location";
  }
  if (["mobile_service", "mobile", "onsite_service"].includes(format) || includesAny(text, [/выездн|мобильн|на выезд|на месте клиента|mobile/])) {
    return "mobile_service";
  }
  if (["tire_service", "detailing", "diagnostics", "specialized_service"].includes(format)) return "specialized_service";
  if (includesAny(text, [/один бокс|1 бокс|бокс внутри|inside.*service|one box|внутри большого автосервис/])) return "inside_partner_location";
  if (format === "other" || format === "not_decided") return "to_be_confirmed";
  return "standalone_location";
}


function hasExplicitNegationNear(text: string, industryWords: string[]) {
  const negation = "(?:\\bне\\s+(?:является|будет|относится\\s+к|основн(?:ой|ая|ое)|производит|нужен|нужна)?|not\\s+(?:a|an|the\\s+main)?|not\\s+the\\s+main)";
  return industryWords.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`${negation}[^.!?]{0,80}${escaped}|${escaped}[^.!?]{0,80}${negation}`, "i").test(text);
  });
}



function buildClassificationHint(text: string): string {
  const signals: string[] = [];
  if (includesAny(text, [/выездн|на выезд|выезде|мобильн|на объект|mobile/i])) signals.push("mobile_service");
  if (includesAny(text, [/b2b|организаци|предприяти|компани|заказчик|юрлиц/i])) signals.push("b2b_model");
  if (includesAny(text, [/тест|анализ|проверк|замер|диагностик/i])) signals.push("testing_diagnostics");
  if (includesAny(text, [/для .{0,80}(кафе|ресторан|офис|гостиниц|отел)/i])) signals.push("serves_hospitality_as_client");
  if (includesAny(text, [/оборудован|прибор|лаборатор|реагент|инструмент/i])) signals.push("special_equipment_or_consumables");
  return Array.from(new Set(signals)).join(", ");
}

function applyContextualProfileAdjustments(base: BusinessProfile, text: string): BusinessProfile {
  const operationalModel = resolveLocationOperationalModel(text);
  if (operationalModel === "mobile_service" && base.providesServices) {
    return {
      ...base,
      operationalModel: "mobile_service",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasWalkInTraffic: false
    };
  }
  return base;
}

function profile(category: BusinessCategory, confidence: number, extra: Partial<BusinessProfile>): BusinessProfile {
  const defaultSourceCategories = ["official_statistics", "small_business", "regional", "labor_market", "prices"];
  const result: BusinessProfile = {
    category,
    confidence,
    businessModel: String(extra.businessModel ?? category),
    primaryRevenueModel: String(extra.primaryRevenueModel ?? "sales"),
    secondaryRevenueModels: extra.secondaryRevenueModels ?? [],
    sellsGoods: false,
    providesServices: false,
    producesGoods: false,
    rentsAssets: false,
    importsGoodsOrInputs: false,
    importsGoods: false,
    exportsGoodsOrServices: false,
    usesDelivery: false,
    usesPremises: false,
    usesMobileService: false,
    hasInventory: false,
    hasEquipment: false,
    hasPremises: false,
    hasStaff: true,
    hasLicensingOrPermits: false,
    hasSanitaryRequirements: false,
    hasEnvironmentalRisk: false,
    hasSafetyRisk: true,
    hasSeasonality: false,
    hasHighWorkingCapitalNeed: false,
    hasCustomerFlowDependency: false,
    hasB2BContracts: false,
    hasWalkInTraffic: false,
    hasRegulatedActivity: false,
    hasCurrencyExposure: false,
    hasCreditOrLeasingNeed: false,
    capabilities: {},
    revenueUnit: String(extra.revenueUnit ?? (extra.providesServices ? "service_order" : "sale")),
    capacityUnit: String(extra.capacityUnit ?? (extra.providesServices ? "orders_per_month" : "units_per_month")),
    averageTicketField: String(extra.averageTicketField ?? "averagePrice"),
    volumeField: String(extra.volumeField ?? "monthlyCapacity"),
    relevantInterviewBlocks: baseBlocks,
    excludedInterviewBlocks: [],
    requiredDataForAnalysis: ["businessType", "businessIdea", "region", "monthlyCapacity", "averagePrice", "ownContributionAmount"],
    keyCostDrivers: ["startup_costs", "payroll", "rent", "working_capital"],
    keyRevenueDrivers: ["customer_flow", "average_ticket", "utilization"],
    keyRisks: ["market_demand", "competition", "working_capital", "execution"],
    documentCategories: extra.documentCategories ?? ["registration", "tax", "contracts"],
    sourceCategories: extra.sourceCategories ?? defaultSourceCategories,
    recommendedSourceCategories: defaultSourceCategories,
    additionalInterviewTopics: [],
    documentProfile: "standard_service",
    needsSpecialLicense: false,
    isImportDependent: false,
    isFoodRelated: false,
    ...extra
  };
  result.usesPremises = result.usesPremises || result.hasPremises;
  result.usesMobileService = result.usesMobileService || result.operationalModel === "mobile_service";
  result.importsGoods = result.importsGoods || result.importsGoodsOrInputs;
  const dependsOnHostBusinessTraffic =
    result.operationalModel === "inside_partner_location" ||
    result.operationalModel === "one_box_inside_larger_business" ||
    result.capabilities?.dependsOnHostBusinessTraffic === true;
  result.hasCustomerFlowDependency = result.hasCustomerFlowDependency || dependsOnHostBusinessTraffic;
  result.capabilities = {
    providesServices: result.providesServices,
    sellsGoods: result.sellsGoods,
    hasInventory: result.hasInventory,
    hasPhysicalLocation: result.hasPremises || result.usesPremises,
    locationTrafficCritical: result.hasWalkInTraffic || result.hasCustomerFlowDependency,
    needsEquipment: result.hasEquipment,
    needsStaff: result.hasStaff,
    hasRegulatedActivity: result.hasRegulatedActivity,
    hasSanitaryRequirements: result.hasSanitaryRequirements,
    dependsOnHostBusinessTraffic,
    hasB2BClients: result.hasB2BContracts,
    hasRepeatCustomers: result.providesServices || result.sellsGoods,
    hasChildSafetyRisk: result.hasSafetyRisk && /child|children|детск|болал/i.test(`${result.subcategory ?? ""} ${result.businessModel ?? ""}`),
    rentalOrUsageBasedRevenue: result.rentsAssets || /rent|rental|аренд|прокат|ижар/i.test(`${result.primaryRevenueModel ?? ""} ${result.businessModel ?? ""}`),
    ...(result.capabilities ?? {})
  };
  result.sourceCategories = result.sourceCategories?.length ? result.sourceCategories : result.recommendedSourceCategories;
  result.documentCategories = result.documentCategories?.length ? result.documentCategories : ["registration", "tax", "contracts"];
  result.additionalInterviewTopics = result.additionalInterviewTopics?.length
    ? Array.from(new Set(result.additionalInterviewTopics))
    : Array.from(new Set([...result.keyRevenueDrivers, ...result.keyCostDrivers, ...result.keyRisks])).slice(0, 5);
  result.needsSpecialLicense = result.needsSpecialLicense ?? result.hasLicensingOrPermits;
  result.isImportDependent = result.isImportDependent ?? result.importsGoodsOrInputs;
  result.isFoodRelated = result.isFoodRelated ?? (result.category === "food_service" || result.hasSanitaryRequirements);
  result.relevantInterviewBlocks = [...approvedInterviewBlocks];
  return result;
}

export function classifyBusiness(input: ClassifierInput): BusinessClassificationResult {
  const text = normalize(input);
  const answers = input.answers ?? {};
  const imports = includesAny(text, [/импорт|import|китай|china|турц|turkey|usd|eur|cny|rub|инкотерм|incoterms|тамож/]);
  const exports = includesAny(text, [/экспорт|export|foreign clients|международ/]);
  const foreignCurrency = answers.foreignCurrencyPurchases === true || answers.rawMaterialSource === "import" || imports;
  const creditOrLeasing = answers.creditNeeded === "yes" || answers.needsLeasing === true || includesAny(text, [/кредит|лизинг|loan|leasing|finance/]);
  const agricultureServiceSupportSignal = includesAny(text, [/дрон|drone|бпла|uav|агромонитор|мониторинг|съемк|съёмк|ndvi|геоданн/i]) && includesAny(text, [/сервис|услуг|аренд|rent|rental|оператор|для\s+фермер|фермерск|пол[ея]/i]);
  const rentalColdStorageServiceSignal = includesAny(text, [/аренд|прокат|rent|rental/i]) && includesAny(text, [/мобильн[^.!?]{0,50}холодильн[^.!?]{0,50}камер|холодильн[^.!?]{0,50}камер/i]);
  const serviceRevenueSignal = includesAny(text, [
    /основн[^.!?]{0,60}(услуг|ремонт|аренд|монтаж|подписк|обслужив|проект)/i,
    /(выручк|доход)[^.!?]{0,60}(услуг|ремонт|аренд|монтаж|подписк|обслужив|проект)/i,
    /(услуг|ремонт|аренд|монтаж|подписк|обслужив|проект)[^.!?]{0,60}(основн|главн)/i
  ]);
  const goodsAreInputsSignal = includesAny(text, [
    /(запчаст|расходник|компонент|материал)[^.!?]{0,80}(для|выполнен|услуг|ремонт|работ|не основн)/i,
    /(дополнительн|вторичн)[^.!?]{0,40}(продаж|доход)/i,
    /не[^.!?]{0,40}(розничн|магазин|retail|store)/i
  ]);
  const retailFalsePositive = hasExplicitNegationNear(text, ["магазин", "рознич", "retail", "store", "товар"]) || (serviceRevenueSignal && goodsAreInputsSignal) || includesAny(text, [/(аренд|прокат|сервис|услуг)[^.!?]{0,120}(для|клиент|заказчик)[^.!?]{0,80}(магазин|retail|store)/i]) || rentalColdStorageServiceSignal;
  const logisticsFalsePositive = hasExplicitNegationNear(text, ["логист", "достав", "курьер", "delivery", "courier"]) || includesAny(text, [/(доставк|курьер|забор)[^.!?]{0,80}(вспомог|не основн|как часть услуги)/i]);
  const manufacturingFalsePositive = hasExplicitNegationNear(text, ["производ", "manufacturing", "factory"]) || includesAny(text, [/не[^.!?]{0,60}производит[^.!?]{0,60}товар/i, /оборудован[^.!?]{0,80}(используется|нужно)[^.!?]{0,80}(для услуги|для оказания услуги)/i]);
  const foodFalsePositive =
    hasExplicitNegationNear(text, ["кафе", "ресторан", "общепит", "cafe", "restaurant"]) ||
    includesAny(text, [
      // Avoid classifying a B2B service as food service when cafes/restaurants are the clients,
      // but do not reject real food businesses that target office workers or residents.
      /(клиент|клиенты|объект|заказчик|потребитель)[^.!?]{0,100}(кафе|ресторан|общепит|фудкорт|магазин продуктов|супермаркет|салон)/i,
      /(кафе|ресторан|общепит|фудкорт|магазин продуктов|супермаркет|салон)[^.!?]{0,100}(клиент|объект|заказчик|потребитель)/i,
      /(для|обслужива|поставля|оказыва)[^.!?]{0,80}(кафе|ресторан|гостиниц|отел|офис|общепит|фудкорт)/i,
      /выездн[^.!?]{0,80}(услуг|проверк|замер|анализ|лаборатор|тест)/i,
      /(основн[^.!?]{0,60}выручк|основн[^.!?]{0,60}доход)[^.!?]{0,80}(тест|анализ|замер|проверк|услуг|консульт)/i
    ]);

  const businessTypeText = explicitBusinessTypeText(input);
  const productServiceSignalText = productServiceText(input);
  const businessNameSignalText = businessNameText(input);
  const descriptionSignalText = descriptionText(input);
  const otherSignalText = otherClassifierText(input);
  const businessTypeMatchText = normalizeForMatchingText(businessTypeText);
  const productServiceMatchText = normalizeForMatchingText(productServiceSignalText);
  const businessNameMatchText = normalizeForMatchingText(businessNameSignalText);
  const descriptionMatchText = normalizeForMatchingText(descriptionSignalText);
  const otherMatchText = normalizeForMatchingText(otherSignalText);

  const businessTypeSampleProfile = findBusinessSampleProfile(businessTypeMatchText, { requireExactPhrase: true, minScore: 1500 });
  const businessNameSampleProfile = findBusinessSampleProfile(businessNameMatchText, { requireExactPhrase: true, minScore: 1500 });
  const productServiceSampleProfile = findBusinessSampleProfile(productServiceMatchText, { minScore: 1500 });
  const descriptionSampleProfile = findBusinessSampleProfile(descriptionMatchText, { minScore: 1650 });
  const otherSampleProfile = findBusinessSampleProfile(otherMatchText, { minScore: 1700 });

  const exactBusinessTypeMatch = Boolean(businessTypeSampleProfile);
  const weightedCandidates = [
    businessTypeSampleProfile ? { match: businessTypeSampleProfile, signal: "businessType" as const, weight: classificationSignalWeights.businessType, exact: true } : null,
    businessNameSampleProfile ? { match: businessNameSampleProfile, signal: "businessName" as const, weight: classificationSignalWeights.businessName, exact: true } : null,
    productServiceSampleProfile ? { match: productServiceSampleProfile, signal: "productService" as const, weight: classificationSignalWeights.productService, exact: false } : null,
    descriptionSampleProfile ? { match: descriptionSampleProfile, signal: "description" as const, weight: classificationSignalWeights.description, exact: false } : null,
    otherSampleProfile ? { match: otherSampleProfile, signal: "other" as const, weight: classificationSignalWeights.other, exact: false } : null
  ].filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  const bestWeightedSample = weightedCandidates
    .map((candidate) => ({ ...candidate, confidence: weightedSampleConfidence(candidate.match.score, candidate.weight, candidate.exact) }))
    .sort((left, right) => right.confidence - left.confidence || right.match.score - left.match.score)[0];

  if (process.env.DEBUG_BUSINESS_CLASSIFIER === "true") {
    console.info("[business-classifier:weighted-sample]", {
      inputBusinessType: input.businessType,
      normalizedBusinessType: normalizeForMatchingText(businessTypeText),
      matchedSampleId: bestWeightedSample?.match.sample.id,
      confidence: bestWeightedSample?.confidence,
      signal: bestWeightedSample?.signal,
      candidates: weightedCandidates.map((candidate) => ({ signal: candidate.signal, sampleId: candidate.match.sample.id, score: candidate.match.score }))
    });
  }

  if (businessTypeSampleProfile) {
    const confidence = exactBusinessTypeMatch ? 0.94 : weightedSampleConfidence(businessTypeSampleProfile.score, classificationSignalWeights.businessType, true);
    const base = profile(businessTypeSampleProfile.sample.category, confidence, {
      ...businessTypeSampleProfile.profile,
      aiClassification: {
        sampleId: businessTypeSampleProfile.sample.id,
        source: "business_type_sample_registry",
        labels: businessTypeSampleProfile.sample.label,
        score: businessTypeSampleProfile.score,
        keepsDynamicFallbackForUnknownBusinesses: true
      },
      _requiresAIClassification: false
    });
    return attachClassificationAudit(applyContextualProfileAdjustments(base, text), {
      inputBusinessType: businessTypeText,
      normalizedBusinessType: normalizeForMatchingText(businessTypeText),
      matchedSampleId: businessTypeSampleProfile.sample.id,
      confidence,
      matchedAliases: [businessTypeSampleProfile.sample.label.ru, businessTypeSampleProfile.sample.label.en, ...businessTypeSampleProfile.sample.aliases].slice(0, 8),
      signals: { ...classificationSignalWeights },
      fallbackUsed: false,
      classificationNeedsReview: confidence >= 0.6 && confidence < 0.8,
      reason: "Exact alias match from businessType"
    });
  }

  if (bestWeightedSample && bestWeightedSample.confidence >= 0.8) {
    const base = profile(bestWeightedSample.match.sample.category, bestWeightedSample.confidence, {
      ...bestWeightedSample.match.profile,
      aiClassification: {
        sampleId: bestWeightedSample.match.sample.id,
        source: `${bestWeightedSample.signal}_sample_registry`,
        labels: bestWeightedSample.match.sample.label,
        score: bestWeightedSample.match.score,
        keepsDynamicFallbackForUnknownBusinesses: true
      },
      _requiresAIClassification: false
    });
    return attachClassificationAudit(applyContextualProfileAdjustments(base, text), {
      inputBusinessType: businessTypeText,
      normalizedBusinessType: normalizeForMatchingText(businessTypeText),
      matchedSampleId: bestWeightedSample.match.sample.id,
      confidence: bestWeightedSample.confidence,
      matchedAliases: [bestWeightedSample.match.sample.label.ru, bestWeightedSample.match.sample.label.en, ...bestWeightedSample.match.sample.aliases].slice(0, 8),
      signals: { ...classificationSignalWeights },
      fallbackUsed: false,
      classificationNeedsReview: false,
      reason: `Strong weighted sample match from ${bestWeightedSample.signal}`
    });
  }

  const tentativeWeightedSample = bestWeightedSample && bestWeightedSample.confidence >= 0.6 ? bestWeightedSample : null;


  if (includesAny(text, [/копи\s*центр|копицентр|copy\s*center|print\s*copy|копировальн|ксерокс|ксерокоп|сканирован|ламинирован|перепл[её]т|фото\s*на\s*док|печать[^.!?]{0,40}(документ|фото|лист)/i])) {
    return profile("services", 0.84, {
      subcategory: "print_copy_service",
      businessModel: "walk_in_print_copy_service",
      operationalModel: "b2c_walk_in",
      primaryRevenueModel: "service_order",
      secondaryRevenueModels: ["stationery_resale", "photo_documents"],
      providesServices: true,
      sellsGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      hasStaff: true,
      hasLicensingOrPermits: false,
      hasSanitaryRequirements: false,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasCurrencyExposure: foreignCurrency || includesAny(text, [/тонер|картридж|бумаг|бумага|импорт|usd|printer|canon|epson|xerox|hp/i]),
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "inventory", "staff_payroll", "documents_permits_compliance", "working_capital"],
      excludedInterviewBlocks: ["production_process", "seating_capacity", "sanitary_requirements"],
      requiredDataForAnalysis: ["locationTraffic", "nearbyUniversitiesOffices", "printCopyServicesMix", "equipmentList", "equipmentCondition", "consumablesSupplier", "paperTonerCost", "corporateOrders", "onlineOrders", "cashRegister", "monthlyOrders", "averageTicket"],
      revenueUnit: "order",
      capacityUnit: "orders_per_month",
      averageTicketField: "averagePrice",
      volumeField: "monthlyCapacity",
      keyCostDrivers: ["rent", "paper_toner_consumables", "printer_service", "equipment_depreciation", "payroll", "cash_register", "stationery_inventory"],
      keyRevenueDrivers: ["walk_in_traffic", "student_office_flow", "orders_per_day", "average_ticket", "service_mix", "corporate_orders", "seasonality_exam_periods"],
      keyRisks: ["weak_location_traffic", "equipment_downtime", "consumables_price_volatility", "low_average_ticket", "cash_register_tax_compliance"],
      documentCategories: ["registration", "tax", "cash_register", "lease_agreement", "fire_safety", "labor_contracts", "no_special_license"],
      sourceCategories: ["services", "retail", "small_business", "demography", "education", "real_estate", "labor_market", "prices"],
      recommendedSourceCategories: ["services", "small_business", "demography", "education", "real_estate", "labor_market", "prices", "commerce_platform"],
      additionalInterviewTopics: ["трафик у университетов и офисов", "структура услуг печати и копирования", "расходники: бумага, тонер, картриджи", "надежность оборудования и сервис", "B2B и корпоративные заказы", "сезонность экзаменов"],
      documentProfile: "no_special_license",
      needsSpecialLicense: false,
      isImportDependent: true
    });
  }

  if (includesAny(text, [/прокат[^.!?]{0,60}электросамокат|электросамокат[^.!?]{0,60}(прокат|аренд)|e[-\s]?scooter[^.!?]{0,40}(rental|rent)|самокат[^.!?]{0,40}(прокат|аренд)/i])) {
    return profile("services", 0.78, {
      subcategory: "electric_scooter_rental",
      businessModel: "rental_assets",
      operationalModel: "location_based_retail",
      primaryRevenueModel: "rental_session",
      providesServices: true,
      rentsAssets: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasSafetyRisk: true,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: true,
      hasCreditOrLeasingNeed: true,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "documents_permits_compliance", "safety_fire_labor_protection", "seasonality"],
      excludedInterviewBlocks: ["production_process", "food_service"],
      revenueUnit: "rental_session",
      capacityUnit: "rental_sessions_per_month",
      keyCostDrivers: ["scooter_purchase", "battery_replacement", "repair_service", "charging", "insurance", "location_fee"],
      keyRevenueDrivers: ["fleet_size", "rides_per_day", "average_ride_price", "tourist_flow", "seasonality"],
      keyRisks: ["accidents_liability", "theft_damage", "seasonality", "municipal_restrictions", "maintenance"],
      documentCategories: ["registration", "tax", "lease_agreement", "liability_insurance", "municipal_permit", "safety_rules"],
      sourceCategories: ["services", "transport", "tourism_hospitality", "real_estate", "demography", "prices"],
      additionalInterviewTopics: ["размер парка самокатов", "точки выдачи и трафик", "ремонт и зарядка", "ответственность за травмы и повреждения", "сезонность"],
      documentProfile: "transport_license",
      needsSpecialLicense: true
    });
  }

  if (includesAny(text, [/ремонт[^.!?]{0,40}(?:час(?:ов|ы)?\b|watch)|(?:часов(?:ая|ой)\s+мастерск|watch[^.!?]{0,20}repair)/i])) {
    return profile("services", 0.76, {
      subcategory: "watch_repair_workshop",
      businessModel: "specialized_repair_service",
      operationalModel: "specialized_service",
      primaryRevenueModel: "repair_order",
      providesServices: true,
      sellsGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasWalkInTraffic: true,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "inventory", "staff_payroll", "documents_permits_compliance"],
      excludedInterviewBlocks: ["production_process", "food_service", "seating_capacity"],
      revenueUnit: "repair_order",
      capacityUnit: "repairs_per_month",
      keyCostDrivers: ["tools", "spare_parts", "rent", "master_salary", "warranty_returns"],
      keyRevenueDrivers: ["repair_orders", "average_repair_ticket", "accessory_sales", "repeat_clients"],
      keyRisks: ["low_master_quality", "spare_parts_availability", "warranty_claims", "low_traffic"],
      documentCategories: ["registration", "tax", "lease_agreement", "consumer_protection"],
      sourceCategories: ["services", "retail", "labor_market", "prices", "real_estate"],
      additionalInterviewTopics: ["виды ремонта часов", "запчасти и поставщики", "гарантия на ремонт", "квалификация мастера", "локационный трафик"],
      documentProfile: "standard_service"
    });
  }

  if (!foodFalsePositive && includesAny(text, [/морожен|ice\s*cream|пломбир|рожк|вафельн.*рож|фризер|soft\s*serve|гелато|gelato|десертн.*трейлер|трейлер.*морож|прицеп.*морож|фуд\s*трак.*морож/i])) {
    const mobile = includesAny(text, [/трейлер|прицеп|фуд\s*трак|food\s*truck|колес|мобильн|выездн/i]);
    const stationary = includesAny(text, [/киоск|островок|парк|улиц|тц|помещен|аренд|стационар/i]);
    return profile("food_service", 0.9, {
      subcategory: mobile ? "ice_cream_mobile_trailer" : stationary ? "ice_cream_kiosk" : "ice_cream_retail",
      businessModel: mobile ? "mobile_ice_cream_retail" : stationary ? "ice_cream_kiosk_retail" : "ice_cream_retail",
      operationalModel: mobile ? "mobile_service" : stationary ? "standalone_location" : "format_to_be_confirmed",
      primaryRevenueModel: "walk_in_food_retail",
      sellsGoods: true,
      providesServices: false,
      producesGoods: false,
      rentsAssets: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: !mobile || stationary,
      usesMobileService: mobile,
      usesDelivery: false,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: false,
      hasSafetyRisk: true,
      hasSeasonality: true,
      hasHighWorkingCapitalNeed: true,
      hasCustomerFlowDependency: true,
      hasB2BContracts: false,
      hasWalkInTraffic: true,
      hasRegulatedActivity: true,
      hasCurrencyExposure: foreignCurrency || includesAny(text, [/импорт.*фризер|оборудован.*usd|смес.*импорт|сырь.*импорт/i]),
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [
        "business_idea",
        "market_sales",
        "ice_cream_location",
        "ice_cream_equipment_suppliers",
        "ice_cream_unit_economics",
        "team_operations",
        "finance",
        "documents_experience"
      ],
      excludedInterviewBlocks: ["seating_capacity", "production_process", "retail_sku", "laboratory_services", "auto_service_format"],
      requiredDataForAnalysis: [
        "businessType", "businessIdea", "region", "district", "productOrService",
        mobile ? "trailerLocationType" : "format", "locationTraffic", "monthlyRent", "infrastructureReady",
        "iceCreamEquipment", "equipmentCapex", "supplierSelected", "rawMaterialCostPerUnit",
        "monthlyCapacity", "averagePrice", "utilizationRatePct", "staffPlan",
        "ownContributionAmount", "creditNeeded", "certificationAwareness", "sanitaryRequirementsKnown"
      ],
      revenueUnit: "ice_cream_portion",
      capacityUnit: "portions_per_month",
      averageTicketField: "averagePrice",
      volumeField: "monthlyCapacity",
      keyCostDrivers: ["ice_cream_mix", "cones_packaging", "freezer_trailer_equipment", "rent_or_location_fee", "electricity", "payroll", "permits", "seasonality_buffer"],
      keyRevenueDrivers: ["customer_flow", "average_ticket", "portions_per_month", "location_quality", "weather_seasonality", "repeat_clients"],
      keyRisks: ["location_traffic", "sanitary_compliance", "freezer_downtime", "supplier_reliability", "seasonality", "price_margin"],
      documentCategories: ["business_registration", "sanitary_permit", "cash_register", "location_permit", "rent_contract", "labor_contracts"],
      sourceCategories: ["food_service", "retail_food_prices", "cpi", "demography", "small_business", "weather_seasonality", "labor_market"],
      recommendedSourceCategories: ["retail_food_prices", "cpi", "food_service", "demography", "small_business", "labor_market", "weather_seasonality"]
    });
  }

  if (includesAny(text, [
    /лаборатор|laboratory|анализ воды|water.*test|water.*analysis|экспресс.*(тест|анализ|замер)|выездн.*(лаборатор|тест|анализ)/i,
    /качество воды|water quality|экологическ.*(анализ|контроль|мониторинг)/i,
    /сертификац.*(анализ|тест)|санитарн.*(экспертиз|анализ)|аккредитован.*лаборатор/i
  ])) {
    const mobileLab = includesAny(text, [/выездн|на выезд|выезде|мобильн|на объект|mobile/i]);
    return profile("healthcare", 0.87, {
      subcategory: "analytical_laboratory",
      businessModel: "b2b_b2c_analytical_services",
      operationalModel: mobileLab ? "mobile_service" : "standalone_location",
      primaryRevenueModel: "test_service",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasEquipment: true,
      hasInventory: true,
      hasPremises: includesAny(text, [/стационарн|офис|помещен|лабораторн.*помещен/i]),
      hasStaff: true,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: false,
      hasSafetyRisk: true,
      hasB2BContracts: true,
      hasWalkInTraffic: false,
      usesMobileService: mobileLab,
      hasCurrencyExposure: foreignCurrency || includesAny(text, [/реагент|reagent|импорт.*оборуд/i]),
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [
        ...baseBlocks,
        "laboratory_services",
        "laboratory_equipment_consumables",
        "laboratory_pricing_capacity",
        "staff_payroll",
        "documents_permits_compliance",
        "laboratory_transport_logistics",
        "laboratory_compliance"
      ],
      excludedInterviewBlocks: [
        "food_service_menu", "retail_sku", "production_process",
        "cleaning_service_model", "seating_capacity", "daily_covers", "kitchen_equipment"
      ],
      requiredDataForAnalysis: [
        "serviceType", "testServiceTypes", "clientSegments", "mobilityModel",
        "labEquipmentList", "monthlyReagentsCostUZS", "accreditationStatus",
        "averageTestTicket", "testsPerMonth", "staffPlan", "requiredPermits"
      ],
      revenueUnit: "test_service",
      capacityUnit: "tests_per_month",
      averageTicketField: "averageTestTicket",
      volumeField: "testsPerMonth",
      keyCostDrivers: ["reagents_consumables", "equipment_amortization", "staff", "transport", "accreditation", "rent_or_lab_space"],
      keyRevenueDrivers: ["tests_per_month", "average_test_ticket", "b2b_contracts", "repeat_clients"],
      keyRisks: ["accreditation_loss", "reagent_supply", "equipment_downtime", "b2b_dependency", "staff_qualification"],
      documentCategories: ["accreditation_certificate", "sanitary_permit", "contract", "test_report_template", "equipment_calibration"],
      sourceCategories: ["services_statistics", "demography", "sanitary", "water_environment", "labor_market", "prices"],
      recommendedSourceCategories: ["services_statistics", "sanitary", "water_environment", "small_business", "demography", "prices", "labor_market"]
    });
  }

  if (includesAny(text, [/разработк[^.!?]{0,40}(сайт|приложени|по|software)|it[^.!?]{0,40}(консалтинг|услуг)|веб[^.!?]{0,40}(студи|агентств)|software development|web.*studio/i])) {
    return profile("it_digital", 0.84, {
      subcategory: "software_development_consulting",
      businessModel: "b2b_it_services",
      operationalModel: includesAny(text, [/онлайн|remote|удален/i]) ? "online_only" : "mixed",
      primaryRevenueModel: "project_or_subscription",
      providesServices: true,
      hasEquipment: true,
      hasPremises: includesAny(text, [/офис|студи|помещен/i]),
      hasB2BContracts: true,
      hasCurrencyExposure: foreignCurrency || exports,
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["serviceType", "clientSegments", "pricingModel", "monthlyCapacity", "averagePrice", "staffPlan"],
      excludedInterviewBlocks: ["food_service_menu", "retail_sku", "production_process", "seating_capacity"],
      keyCostDrivers: ["developers", "software_tools", "sales", "cloud", "office"],
      keyRevenueDrivers: ["projects_per_month", "average_project_ticket", "subscriptions", "retainers"],
      keyRisks: ["pipeline", "staff_capacity", "scope_creep", "client_payments"],
      recommendedSourceCategories: ["services_statistics", "small_business", "labor_market", "prices", "digital_economy"]
    });
  }

  if (includesAny(text, [/реклам[^.!?]{0,40}(агентств|студи|услуг)|дизайн[^.!?]{0,40}студи|marketing.*agency|creative.*agency/i])) {
    return profile("professional_services", 0.84, {
      subcategory: "marketing_advertising_agency",
      businessModel: "b2b_creative_services",
      operationalModel: "mixed",
      primaryRevenueModel: "project_or_retainer",
      providesServices: true,
      hasEquipment: true,
      hasPremises: includesAny(text, [/офис|студи|помещен/i]),
      hasB2BContracts: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["serviceType", "clientSegments", "pricingModel", "monthlyCapacity", "averagePrice", "staffPlan"],
      excludedInterviewBlocks: ["food_service_menu", "retail_sku", "production_process", "seating_capacity"],
      keyCostDrivers: ["creative_team", "software", "ads_testing", "sales", "office"],
      keyRevenueDrivers: ["retainers", "projects", "average_project_ticket", "repeat_clients"],
      keyRisks: ["client_acquisition", "portfolio_quality", "payment_delays", "staff_turnover"],
      recommendedSourceCategories: ["services_statistics", "small_business", "labor_market", "prices", "digital_economy"]
    });
  }

  if (includesAny(text, [/бухгалтер[^.!?]{0,40}(услуг|аутсорсинг|фирм)|аудит[^.!?]{0,40}(услуг|фирм)|accounting.*outsourcing|bookkeeping/i])) {
    return profile("professional_services", 0.86, {
      subcategory: "accounting_outsourcing",
      businessModel: "b2b_accounting_services",
      operationalModel: includesAny(text, [/онлайн|remote|удален/i]) ? "online_only" : "mixed",
      primaryRevenueModel: "monthly_subscription_contract",
      providesServices: true,
      hasEquipment: true,
      hasPremises: includesAny(text, [/офис|помещен/i]),
      hasB2BContracts: true,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: false,
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["serviceType", "clientSegments", "pricingModel", "monthlyCapacity", "averagePrice", "staffPlan"],
      excludedInterviewBlocks: ["food_service_menu", "retail_sku", "production_process", "seating_capacity"],
      keyCostDrivers: ["qualified_accountants", "software", "training", "sales", "office"],
      keyRevenueDrivers: ["monthly_clients", "average_subscription", "retention", "additional_reports"],
      keyRisks: ["tax_compliance", "data_confidentiality", "staff_qualification", "client_churn"],
      recommendedSourceCategories: ["services_statistics", "small_business", "labor_market", "tax_registration", "prices"]
    });
  }

  if (!includesAny(text, [/ателье|ремонт[^.!?]{0,40}одежд|подгонк[^.!?]{0,40}одежд|подшив|ремонт молни|мелкий пошив|tailor|alteration|clothing[^.!?]{0,40}repair/i]) && includesAny(text, [/выездн[^.!?]{0,40}(ремонт|обслужив|монтаж|наладк|диагностик)|mobile[^.!?]{0,40}(repair|maintenance|diagnostic)/i])) {
    return profile("services", 0.82, {
      subcategory: "mobile_technical_service",
      businessModel: "mobile_technical_services",
      operationalModel: "mobile_service",
      primaryRevenueModel: "service_visit",
      providesServices: true,
      hasEquipment: true,
      hasInventory: true,
      hasPremises: includesAny(text, [/склад|офис|помещен/i]),
      hasB2BContracts: includesAny(text, [/b2b|компан|организац|договор/i]),
      usesMobileService: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["serviceType", "clientSegments", "serviceArea", "equipmentList", "monthlyCapacity", "averagePrice", "staffPlan"],
      excludedInterviewBlocks: ["food_service_menu", "retail_sku", "production_process", "seating_capacity"],
      keyCostDrivers: ["tools_equipment", "transport", "spare_parts", "staff", "fuel", "marketing"],
      keyRevenueDrivers: ["visits_per_month", "average_service_ticket", "b2b_contracts", "repeat_clients"],
      keyRisks: ["travel_time", "equipment_downtime", "quality_claims", "staff_skills", "spare_parts_supply"],
      recommendedSourceCategories: ["services_statistics", "small_business", "labor_market", "prices", "transport_statistics"]
    });
  }

  if (includesAny(text, [/груминг|грумер|grooming|pet\s*groom|стрижк.*(собак|кош|животн)|салон.*(собак|кош|животн)|выезд.*(собак|кош|животн)|зоосалон|pet\s*care/i])) {
    const mobile = includesAny(text, [/мобильн|выезд|на дому|фургон|mobile|home visit/i]);
    return profile("services", 0.91, {
      subcategory: "pet_grooming",
      businessModel: mobile ? "mobile_pet_grooming_service" : "pet_grooming_service",
      operationalModel: mobile ? "mobile_service" : "standalone_location",
      primaryRevenueModel: "service_visit",
      secondaryRevenueModels: includesAny(text, [/продаж.*космет|аксессуар.*продаж|товар.*продаж/i]) ? ["retail_add_on"] : [],
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      rentsAssets: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: !mobile,
      usesPremises: !mobile,
      usesMobileService: mobile,
      usesDelivery: mobile,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: false,
      hasSafetyRisk: true,
      hasSeasonality: false,
      hasCustomerFlowDependency: true,
      hasB2BContracts: includesAny(text, [/питомник|ветеринар|зоомагазин|partner|партнер/i]),
      hasWalkInTraffic: !mobile,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: ["business_idea", "market_sales", "premises_location", "equipment_launch", "team_operations", "finance", "documents_experience", "animal_safety_sanitation"],
      excludedInterviewBlocks: ["retail_sku", "logistics_routes_fleet", "production_process", "auto_service_format", "car_wash_format"],
      requiredDataForAnalysis: ["petTypes", "groomingServiceTypes", "groomingOperatingFormat", "groomingTargetCustomers", "bookingChannels", "groomingVisitsPerMonth", "averageGroomingTicket", "groomingEquipment", "groomingConsumables", "groomingSterilizationPlan", "animalsPerGroomerPerDay", "groomingClientConsent", "animalIntakeForm", "groomingLiabilityPolicy"],
      revenueUnit: "grooming_visit",
      capacityUnit: "animals_or_visits_per_month",
      averageTicketField: "averageGroomingTicket",
      volumeField: "groomingVisitsPerMonth",
      keyCostDrivers: ["groomer_payroll", "mobile_transport_or_rent", "grooming_equipment", "cosmetics_consumables", "sterilization", "marketing"],
      keyRevenueDrivers: ["visits_per_month", "average_grooming_ticket", "repeat_clients", "booking_channels", "service_area"],
      keyRisks: ["animal_injury_or_stress", "sanitation", "quality_claims", "booking_utilization", "transport_time", "staff_skills"],
      documentCategories: ["client_consent", "animal_intake_form", "liability", "sanitation", "labor_contracts", "tax"],
      sourceCategories: ["services_statistics", "pet_services_proxy", "demography", "labor_market", "prices", "maps_proxy"],
      recommendedSourceCategories: ["services_statistics", "demography", "labor_market", "prices", "maps_proxy", "sanitary"]
    });
  }

  if (includesAny(text, [/прачечн|laundromat|laundry|самообслуживан.*стир|стирк.*самообслуж|стиральн.*сушильн.*машин|сушильн.*стиральн.*машин|сушк.*бель|бель[ея].*килограмм|прием белья|приём белья/i])) {
    return profile("services", 0.9, {
      subcategory: "self_service_laundry",
      businessModel: "self_service_laundry",
      operationalModel: "standalone_location",
      primaryRevenueModel: "wash_dry_cycle",
      secondaryRevenueModels: includesAny(text, [/килограмм|прием белья|приём белья|wash.*fold|сотрудник.*стир/i]) ? ["assisted_laundry_service"] : [],
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      usesMobileService: false,
      usesDelivery: false,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing || includesAny(text, [/лизинг|профессиональн.*машин|оборудование закупается/i]),
      relevantInterviewBlocks: ["business_idea", "market_sales", "premises_location", "equipment_launch", "team_operations", "finance", "documents_experience"],
      excludedInterviewBlocks: ["cleaning_service_model", "retail_sku", "production_process", "logistics_routes_fleet", "food_service_menu"],
      requiredDataForAnalysis: ["laundryServiceModel", "laundryMachinesCount", "dryersCount", "laundryCyclesPerDay", "averageLaundryTicket", "premisesStatus", "waterDrainageReady", "powerSupplyReady", "laundryEquipment", "laundryConsumables", "equipmentServiceSupport", "staffPlan", "damageLiability"],
      revenueUnit: "wash_or_dry_cycle",
      capacityUnit: "cycles_per_day",
      averageTicketField: "averageLaundryTicket",
      volumeField: "laundryCyclesPerDay",
      keyCostDrivers: ["laundry_equipment", "rent", "water_electricity", "detergents_consumables", "maintenance", "payment_system", "staff_payroll"],
      keyRevenueDrivers: ["cycles_per_day", "average_laundry_ticket", "machine_utilization", "repeat_clients", "location_density"],
      keyRisks: ["equipment_downtime", "water_drainage", "power_capacity", "sanitation", "damage_or_loss_claims", "location_demand", "working_capital"],
      documentCategories: ["registration", "rent_contract", "sanitary", "utility_connection", "service_terms", "liability", "labor_contracts"],
      sourceCategories: ["services_statistics", "demography", "utilities", "sanitary", "labor_market", "prices", "maps_proxy"],
      recommendedSourceCategories: ["services_statistics", "demography", "utilities", "sanitary", "labor_market", "prices", "maps_proxy"]
    });
  }


  if (includesAny(text, [/ремонт.*(смартфон|телефон|планшет|ноутбук|компьютер)|сервисн.*центр.*(смартфон|телефон|планшет|ноутбук|компьютер)|замен[аы].*(экран|аккумулятор|разъем|разъ[её]м|клавиатур)|диагностик.*(смартфон|телефон|планшет|ноутбук|компьютер)|пайк.*(плата|разъем|разъ[её]м)|phone repair|smartphone repair|laptop repair|computer repair|device repair|repair shop/i])) {
    const courier = includesAny(text, [/курьер|забор устройств|доставка устройства|pickup|courier/i]);
    const accessoryRetailMention = includesAny(text, [/продаж.*аксессуар|аксессуар.*продаж|чехл|стекл|зарядн|кабел|б\/?у телефон|used phone/i]);
    const accessoryRetailNegated = includesAny(text, [
      /аксессуар[^.!?]{0,120}не\s+основн/i,
      /не\s+основн[^.!?]{0,120}аксессуар/i,
      /дополнительно\s+возможн[^.!?]{0,120}аксессуар[^.!?]{0,120}не\s+основн/i,
      /not\s+(?:the\s+)?main[^.!?]{0,120}accessor/i
    ]);
    const sellsAccessories = accessoryRetailMention && !accessoryRetailNegated;
    return profile("services", 0.9, {
      subcategory: "device_repair",
      businessModel: "device_repair_service",
      operationalModel: includesAny(text, [/выездн|на дому|mobile/i]) ? "mobile_service" : "standalone_location",
      primaryRevenueModel: "repair_order",
      secondaryRevenueModels: sellsAccessories ? ["retail_add_on"] : [],
      providesServices: true,
      sellsGoods: sellsAccessories,
      producesGoods: false,
      rentsAssets: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      usesDelivery: courier,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: false,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasB2BContracts: includesAny(text, [/офис|компан|b2b|корпоратив|договор/i]),
      hasCurrencyExposure: foreignCurrency || imports || includesAny(text, [/запчаст|поставщик|китай|импорт/i]),
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: ["business_idea", "market_sales", "premises_location", "equipment_launch", "team_operations", "finance", "documents_experience"],
      excludedInterviewBlocks: ["retail_sku", "logistics_routes_fleet", "production_process", "food_service_menu", "cleaning_service_model"],
      requiredDataForAnalysis: ["deviceTypes", "repairServiceTypes", "repairOrdersPerMonth", "averageRepairTicket", "sparePartsPlan", "repairEquipment", "staffPlan", "deviceIntakeForm", "repairWarrantyPolicy", "dataLiabilityPolicy"],
      revenueUnit: "repair_order",
      capacityUnit: "repair_orders_per_month",
      averageTicketField: "averageRepairTicket",
      volumeField: "repairOrdersPerMonth",
      keyCostDrivers: ["spare_parts", "diagnostic_tools", "repair_equipment", "technician_payroll", "rent", "warranty_reserve", "marketing"],
      keyRevenueDrivers: ["repair_orders", "average_repair_ticket", "repeat_clients", "b2b_service_contracts", "parts_availability"],
      keyRisks: ["parts_quality", "warranty_claims", "data_loss_liability", "device_damage_or_loss", "technician_skill", "fx_spare_parts", "equipment_downtime"],
      documentCategories: ["service_order", "device_intake_act", "warranty", "liability", "data_privacy", "tax", "labor_contracts"],
      sourceCategories: ["services_statistics", "consumer_electronics", "labor_market", "prices", "maps_proxy", "small_business"],
      recommendedSourceCategories: ["services_statistics", "consumer_electronics", "labor_market", "prices", "maps_proxy", "small_business"]
    });
  }

  if (!hasExplicitNegationNear(text, ["клининг", "клинингов", "уборка", "cleaning"]) && includesAny(text, [/клининг|клинингов|уборк|уборка|cleaning|cleaning service|janitorial|housekeeping|office cleaning|квартира.*убор|офис.*убор|мойк.*мягк.*мебел|химчистк.*мягк.*мебел|чистк.*мягк.*мебел|upholstery.*clean/i])) {
    return profile("services", 0.9, {
      subcategory: "cleaning_service",
      operationalModel: includesAny(text, [/b2b|b2b[-\s]?договор|офис|корпоратив|contract/i]) ? "mixed" : "mobile_service",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: false,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasSeasonality: includesAny(text, [/сезон|season/i]),
      hasCustomerFlowDependency: true,
      hasB2BContracts: includesAny(text, [/b2b|договор|офис|корпоратив|contract/i]),
      hasWalkInTraffic: false,
      hasRegulatedActivity: false,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [
        "business_concept",
        "cleaning_service_model",
        "clients_contracts",
        "equipment_consumables",
        "staff_schedule",
        "quality_control",
        "pricing_unit_economics",
        "documents_compliance",
        "finance",
        "risks"
      ],
      excludedInterviewBlocks: [
        "auto_service_format",
        "auto_service_premises",
        "auto_service_services_capacity",
        "auto_service_revenue_customers",
        "auto_service_equipment",
        "auto_service_consumables_suppliers",
        "auto_service_compliance",
        "auto_service_staff_quality",
        "production_process",
        "retail_sku",
        "food_service_menu"
      ],
      requiredDataForAnalysis: [
        "cleaningServiceTypes",
        "targetCustomers",
        "contractModel",
        "dailyOrdersCapacity",
        "averageCleaningTicket",
        "cleaningAreaSqmPerDay",
        "staffPlan",
        "equipmentList",
        "cleaningChemicals",
        "transportNeeds",
        "qualityControlPlan",
        "documentsAndContracts"
      ],
      keyCostDrivers: ["staff_payroll", "cleaning_chemicals", "equipment", "transport", "uniforms", "marketing", "insurance_or_liability"],
      keyRevenueDrivers: ["orders_per_day", "average_ticket", "sqm_price", "repeat_clients", "b2b_contracts", "subscription_cleaning"],
      keyRisks: ["customer_acquisition", "staff_turnover", "quality_claims", "chemical_safety", "transport_delays", "b2b_payment_delays", "working_capital"],
      additionalInterviewTopics: ["cleaning_service_model", "clients_contracts", "equipment_consumables", "staff_schedule", "quality_control", "pricing_unit_economics"],
      recommendedSourceCategories: ["services_statistics", "small_business", "demography", "labor_market", "cpi", "sanitary", "tax_registration", "legal_contracts", "maps_proxy", "b2b_demand_proxy"]
    });
  }

  if (includesAny(text, [/автомойк|авто\s*мойк|мойк[аи]?\s*(авто|машин)|мойк[ау]\s*(автомобил|машин)|car\s*wash|carwash|vehicle\s*wash|self[-\s]?service\s*wash|детейлинг.*мойк/i])) {
    return profile("services", 0.91, {
      subcategory: "car_wash",
      operationalModel: includesAny(text, [/мобильн|выезд|mobile/i]) ? "mobile_service" : "standalone_location",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: !includesAny(text, [/мобильн|выезд|mobile/i]),
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasSeasonality: true,
      hasHighWorkingCapitalNeed: false,
      hasCustomerFlowDependency: true,
      hasB2BContracts: includesAny(text, [/b2b|такси|автопарк|корпоратив|fleet|договор/i]),
      hasWalkInTraffic: true,
      hasRegulatedActivity: false,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [
        "business_concept",
        "car_wash_format",
        "car_wash_location_infrastructure",
        "car_wash_services_capacity",
        "car_wash_equipment_chemicals",
        "car_wash_clients_pricing",
        "car_wash_staff_quality",
        "car_wash_documents_environment",
        "finance",
        "risks"
      ],
      excludedInterviewBlocks: [
        "auto_service_format",
        "auto_service_premises",
        "auto_service_services_capacity",
        "auto_service_revenue_customers",
        "auto_service_equipment",
        "auto_service_consumables_suppliers",
        "auto_service_compliance",
        "auto_service_staff_quality",
        "cleaning_service_model",
        "production_process",
        "retail_sku",
        "food_service_menu"
      ],
      requiredDataForAnalysis: [
        "carWashFormat",
        "washServiceTypes",
        "washBaysCount",
        "carsPerDayStart",
        "carsPerDayStable",
        "averageWashTicket",
        "locationTraffic",
        "waterSource",
        "waterDrainageReady",
        "wastewaterHandling",
        "carWashEquipment",
        "washChemicals",
        "staffPlan",
        "qualityControlPlan",
        "businessLegalForm",
        "requiredPermits"
      ],
      keyCostDrivers: ["rent_or_land", "wash_equipment", "water_electricity", "detergents_chemicals", "staff_payroll", "maintenance", "marketing", "wastewater_handling"],
      keyRevenueDrivers: ["cars_per_day", "average_wash_ticket", "service_mix", "repeat_clients", "b2b_fleet_contracts", "location_traffic"],
      keyRisks: ["location_traffic", "seasonality", "water_supply", "wastewater_compliance", "equipment_downtime", "quality_claims", "staff_turnover", "working_capital"],
      recommendedSourceCategories: ["services_statistics", "small_business", "demography", "transport_statistics", "water_environment", "sanitary", "labor_market", "prices", "maps_proxy", "b2b_demand_proxy"]
    });
  }

  if (includesAny(text, [/автосервис|авто\s*сервис|сто\b|замен[аы] масла|диагностик.*авто|ремонт авто|car service|auto repair/])) {
    return profile("services", 0.92, {
      subcategory: "auto_service",
      operationalModel: resolveAutoServiceOperationalModel(text, answers),
      providesServices: true,
      hasEquipment: true,
      hasPremises: true,
      hasInventory: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: resolveAutoServiceOperationalModel(text, answers) === "inside_partner_location",
      hasWalkInTraffic: true,
      hasLicensingOrPermits: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "suppliers", "staff_payroll", "documents_permits_compliance", "environmental_requirements", "safety_fire_labor_protection"],
      excludedInterviewBlocks: ["production_process", "capacity_manufacturing", "retail_shelf_space", "product_packaging"],
      requiredDataForAnalysis: ["autoServiceFormat", "boxLeaseTerms", "leaseTermMonths", "includedInfrastructure", "serviceCategories", "dailyServiceCapacity", "targetCustomerSegments", "customerAcquisitionChannels", "averageServiceTicket", "equipmentList", "consumables", "wasteOilHandling", "staffPlan", "creditNeeded"],
      keyCostDrivers: ["box_rent", "master_payroll", "diagnostic_equipment", "tools", "consumables", "waste_oil_disposal"],
      keyRevenueDrivers: resolveAutoServiceOperationalModel(text, answers) === "inside_partner_location"
        ? ["cars_per_day", "average_service_ticket", "repeat_customers", "host_business_customer_flow"]
        : ["cars_per_day", "average_service_ticket", "repeat_customers", "maps_recommendations_walk_in"],
      keyRisks: ["customer_flow", "lease_dependency", "equipment_downtime", "waste_oil_environmental", "staff_skills", "fx_consumables"],
      recommendedSourceCategories: ["services_statistics", "labor_market", "prices", "environmental", "maps_proxy", "small_business"]
    });
  }

  if (includesAny(text, [/салон красоты|барбер|маникюр|массаж|spa|wellness|beauty|go'zallik|guzallik|фитнес/])) {
    return profile("beauty_wellness", 0.9, {
      subcategory: "beauty_salon",
      operationalModel: "standalone_location",
      providesServices: true,
      sellsGoods: includesAny(text, [/продаж.*космет|retail cosmetics|товар/]),
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasSanitaryRequirements: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasLicensingOrPermits: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "staff_payroll", "sanitary_requirements", "documents_permits_compliance"],
      excludedInterviewBlocks: ["production_process", "raw_materials_inputs"],
      requiredDataForAnalysis: ["serviceCategories", "mastersCount", "chairsOrWorkstations", "averageServiceTicket", "appointmentsModel", "monthlyRent", "sanitaryRequirementsKnown", "consumables"],
      keyCostDrivers: ["rent", "masters_payroll", "chairs_equipment", "cosmetics_consumables", "marketing"],
      keyRevenueDrivers: ["appointments", "average_ticket", "repeat_clients", "utilization"],
      keyRisks: ["staff_skills", "sanitary", "customer_acquisition", "location"],
      recommendedSourceCategories: ["services_statistics", "demography", "labor_market", "maps_proxy", "sanitary"]
    });
  }

  if (includesAny(text, [/солнечн.*панел|solar\s*panel|solar\s*installation|фотоэлектр|pv\s*panel|установк.*панел|инвертор.*панел/i])) {
    return profile("services", 0.86, {
      subcategory: "solar_installation",
      businessModel: "solar_panel_installation_service",
      operationalModel: includesAny(text, [/b2b|предприяти|компан|contract/i]) ? "b2b_contract_model" : "mobile_service",
      primaryRevenueModel: "installation_project",
      secondaryRevenueModels: ["maintenance_service"],
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: false,
      usesMobileService: true,
      usesDelivery: true,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasEnvironmentalRisk: false,
      hasB2BContracts: includesAny(text, [/b2b|компан|предприяти|contract/i]),
      hasCurrencyExposure: foreignCurrency || imports,
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["solarSystemTypes", "targetCustomers", "customerAcquisitionChannels", "solarProjectsPerMonth", "averageSolarProjectTicket", "solarSupplierPlan", "solarInstallationEquipment", "staffPlan", "electricalSafetyPlan", "requiredPermits"],
      revenueUnit: "installation_project",
      capacityUnit: "projects_per_month",
      averageTicketField: "averageSolarProjectTicket",
      volumeField: "solarProjectsPerMonth",
      keyCostDrivers: ["panels_inverters", "installation_team", "mounting_equipment", "transport", "warranty_service", "marketing"],
      keyRevenueDrivers: ["projects_per_month", "average_project_ticket", "b2b_contracts", "maintenance"],
      keyRisks: ["supplier_fx", "installation_quality", "electrical_safety", "warranty_claims", "customer_payback_expectations"],
      documentCategories: ["contract", "warranty", "electrical_safety", "supplier_certificates", "labor_safety"],
      sourceCategories: ["energy", "import_export", "construction_statistics", "labor_market", "prices"]
    });
  }

  if (!foodFalsePositive && includesAny(text, [/кафе|кофе|кофейн|кофейня|ресторан|фастфуд|dark kitchen|пекар|хлеб|самс|выпеч|булоч|пицц|food service|coffee|bakery|bread|cafe|qahva|kafe|общепит/])) {
    const foodSubcategory = includesAny(text, [/пекар|bakery|bread|хлеб|самс|выпеч|булоч/])
      ? "bakery"
      : includesAny(text, [/кофе|кофейн|кофейня|coffee|qahva/])
        ? "coffee_shop"
        : "cafe";
    return profile("food_service", 0.9, {
      subcategory: foodSubcategory,
      operationalModel: resolveLocationOperationalModel(text) === "inside_partner_location"
        ? "inside_partner_location"
        : includesAny(text, [/dark kitchen|доставка/]) ? "production_workshop" : resolveLocationOperationalModel(text),
      sellsGoods: true,
      providesServices: false,
      producesGoods: foodSubcategory === "bakery" || includesAny(text, [/dark kitchen|пицц|ресторан|фастфуд|самс|выпеч|хлеб/i]),
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasSanitaryRequirements: true,
      hasRegulatedActivity: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasLicensingOrPermits: true,
      hasSeasonality: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "inventory", "raw_materials_inputs", "suppliers", "staff_payroll", "sanitary_requirements", "documents_permits_compliance", "seasonality"],
      excludedInterviewBlocks: ["production_line_factory", "incoterms_customs"],
      requiredDataForAnalysis: ["format", "menuCategories", "seatingCapacity", "kitchenEquipment", "dailyCovers", "averageTicket", "deliveryChannels", "foodCostPct", "laborCostPct", "monthlyRent", "sanitaryPermits"],
      keyCostDrivers: ["rent", "food_cost", "labor", "utilities", "delivery_commission", "waste"],
      keyRevenueDrivers: ["daily_covers", "average_ticket", "seats_turnover", "delivery_orders"],
      keyRisks: ["location", "sanitary", "food_cost", "staff", "seasonality", "competition"],
      recommendedSourceCategories: ["services_statistics", "retail_food_prices", "cpi", "demography", "sanitary", "labor_market"]
    });
  }



  if (includesAny(text, [/прокат[^.!?]{0,80}(детск|машин|электромоб|аттракцион)|детск[^.!?]{0,80}(электромоб|машинк)[^.!?]{0,80}(прокат|аренд|тц|mall)|kids?[^.!?]{0,80}electric[^.!?]{0,80}car[^.!?]{0,80}rental/i])) {
    const operationalModel = resolveLocationOperationalModel(text) === "mobile_service" ? "inside_partner_location" : resolveLocationOperationalModel(text);
    return profile("entertainment", 0.88, {
      subcategory: "children_electric_car_rental",
      businessModel: "mall_asset_rental",
      operationalModel: operationalModel === "standalone_location" ? "inside_partner_location" : operationalModel,
      primaryRevenueModel: "rental_session",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      rentsAssets: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasCreditOrLeasingNeed: creditOrLeasing,
      capabilities: {
        dependsOnHostBusinessTraffic: true,
        needsEquipment: true,
        needsStaff: true,
        hasChildSafetyRisk: true,
        rentalOrUsageBasedRevenue: true,
        hasRepeatCustomers: true
      },
      relevantInterviewBlocks: ["business_idea", "market_sales", "premises_location", "equipment_launch", "team_operations", "finance", "documents_experience"],
      excludedInterviewBlocks: ["auto_service_format", "production_process", "food_service_menu", "retail_sku", "cleaning_service_model", "tailoring_process"],
      requiredDataForAnalysis: ["businessType", "businessIdea", "region", "district", "targetCustomers", "mallTraffic", "mallContract", "ridingZoneAreaSqm", "rentalFleetSize", "rentalSessionMinutes", "averageRentalTicket", "chargingPlan", "childSafetyRules", "supervisorStaffPlan", "maintenancePlan", "damageLiability", "ownContributionAmount", "creditNeeded"],
      revenueUnit: "rental_session",
      capacityUnit: "rental_sessions_per_month",
      averageTicketField: "averageRentalTicket",
      volumeField: "rentalSessionsPerMonth",
      keyCostDrivers: ["asset_purchase_capex", "battery_charging", "maintenance_repairs", "supervisor_payroll", "mall_rent_or_revenue_share", "insurance_or_liability"],
      keyRevenueDrivers: ["mall_or_partner_traffic", "rental_sessions", "average_rental_ticket", "utilization_rate", "repeat_clients"],
      keyRisks: ["child_safety", "asset_damage", "battery_downtime", "mall_contract_dependency", "low_utilization", "liability"],
      documentCategories: ["registration", "tax_cash_register", "mall_contract", "service_terms", "liability", "safety_rules", "labor_contracts"],
      sourceCategories: ["services_statistics", "demography", "mall_traffic_proxy", "labor_market", "prices", "maps_proxy", "legal_contracts"],
      recommendedSourceCategories: ["services_statistics", "demography", "mall_traffic_proxy", "labor_market", "prices", "maps_proxy", "legal_contracts"]
    });
  }

  if (includesAny(text, [/ателье|ремонт[^.!?]{0,40}одежд|подгонк[^.!?]{0,40}одежд|подшив|ремонт молни|мелкий пошив|tailor|alteration/i])) {
    const operationalModel = resolveLocationOperationalModel(text);
    return profile("services", 0.88, {
      subcategory: "tailoring_alteration",
      businessModel: "tailoring_repair_service",
      operationalModel,
      primaryRevenueModel: "service_order",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: operationalModel !== "mobile_service" && operationalModel !== "online_only",
      usesPremises: operationalModel !== "mobile_service" && operationalModel !== "online_only",
      usesMobileService: operationalModel === "mobile_service",
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: operationalModel === "inside_partner_location",
      hasWalkInTraffic: operationalModel !== "mobile_service" && operationalModel !== "online_only",
      hasB2BContracts: includesAny(text, [/b2b|ателье для компаний|корпоратив|форма|униформа|договор/i]),
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: ["business_idea", "market_sales", "premises_location", "equipment_launch", "team_operations", "finance", "documents_experience"],
      excludedInterviewBlocks: ["production_process", "retail_sku", "food_service_menu", "auto_service_format", "car_wash_format"],
      requiredDataForAnalysis: ["businessType", "businessIdea", "region", "productOrService", "targetCustomers", "customerAcquisitionChannels", "monthlyCapacity", "averagePrice", "equipmentList", "staffPlan", "premisesStatus", "ownContributionAmount", "creditNeeded"],
      revenueUnit: "tailoring_order",
      capacityUnit: "orders_per_month",
      averageTicketField: "averagePrice",
      volumeField: "monthlyCapacity",
      keyCostDrivers: ["rent", "sewing_equipment", "consumables", "tailor_payroll", "marketing", "utilities"],
      keyRevenueDrivers: operationalModel === "inside_partner_location"
        ? ["mall_or_partner_traffic", "orders_per_month", "average_ticket", "repeat_clients", "recommendations"]
        : ["walk_in_traffic", "orders_per_month", "average_ticket", "repeat_clients", "recommendations"],
      keyRisks: ["location_traffic", "tailor_skill", "quality_claims", "seasonality", "equipment_downtime", "rent_dependency"],
      documentCategories: ["registration", "tax_cash_register", "rent_contract", "service_terms", "labor_contracts"],
      sourceCategories: ["services_statistics", "labor_market", "prices", "maps_proxy", "small_business", "tax_registration"],
      recommendedSourceCategories: ["services_statistics", "labor_market", "prices", "maps_proxy", "small_business", "tax_registration"]
    });
  }

  if (!manufacturingFalsePositive && includesAny(text, [/мебел|швей|производ|цех|manufacturing|factory|workshop|furniture|sewing|textile|пошив|стройматериал|упаковк.*производ/])) {
    return profile("manufacturing", 0.86, {
      subcategory: includesAny(text, [/мебел|furniture/]) ? "furniture" : includesAny(text, [/швей|пошив|sewing|textile/]) ? "sewing" : "workshop",
      operationalModel: "production_workshop",
      sellsGoods: true,
      producesGoods: true,
      importsGoodsOrInputs: imports,
      exportsGoodsOrServices: exports,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasHighWorkingCapitalNeed: true,
      hasB2BContracts: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      hasLicensingOrPermits: true,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "inventory", "raw_materials_inputs", "suppliers", "production_process", "capacity", "staff_payroll", "documents_permits_compliance", "environmental_requirements", "safety_fire_labor_protection"],
      excludedInterviewBlocks: ["seating_capacity", "daily_covers", "beauty_masters"],
      requiredDataForAnalysis: ["rawMaterials", "productionStages", "monthlyOutputCapacity", "equipmentList", "qualityControl", "storageNeeds", "wasteByproducts", "energyNeeds", "ordersPipeline"],
      keyCostDrivers: ["raw_materials", "equipment", "energy", "labor", "waste", "storage"],
      keyRevenueDrivers: ["units_produced", "sales_price", "yield", "orders_pipeline"],
      keyRisks: ["supplier", "equipment", "quality", "working_capital", "environmental", "fx"],
      recommendedSourceCategories: ["industry_statistics", "investments", "prices", "import_export", "energy", "labor_market"]
    });
  }

  if (includesAny(text, [/онлайн-магазин|интернет-магазин|ecommerce|e-commerce|marketplace|маркетплейс|telegram commerce|instagram commerce/])) {
    return profile("ecommerce", 0.84, {
      subcategory: "online_store",
      operationalModel: includesAny(text, [/marketplace|маркетплейс/]) ? "marketplace" : "online_only",
      sellsGoods: true,
      hasInventory: !includesAny(text, [/dropship|дропшип/]),
      hasEquipment: false,
      hasPremises: includesAny(text, [/склад|warehouse/]),
      hasHighWorkingCapitalNeed: true,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "inventory", "suppliers", "working_capital", "unit_economics", "sales_channels"],
      excludedInterviewBlocks: ["location_walk_in", "production_process", "seating_capacity"],
      requiredDataForAnalysis: ["salesPlatform", "marketplaces", "monthlyOrders", "averageTicket", "cac", "delivery", "fulfillment", "returnsPct", "adBudget", "inventory"],
      keyCostDrivers: ["inventory", "ads", "delivery", "marketplace_commission", "returns"],
      keyRevenueDrivers: ["orders", "aov", "repeat_purchase", "conversion"],
      keyRisks: ["cac", "platform_rules", "returns", "inventory", "supplier"],
      recommendedSourceCategories: ["ecommerce_proxy", "connectivity", "retail_statistics", "demography", "marketplaces_proxy"]
    });
  }

  if (!retailFalsePositive && includesAny(text, [/детск.*одежд|одежд.*детск|children.*clothing|kids.*clothing|baby.*clothes|магазин.*детск.*одежд|детск.*магазин/i])) {
    const hasOnline = includesAny(text, [/instagram|инстаграм|telegram|телеграм|онлайн|online|доставк|marketplace|маркетплейс/i]);
    return profile("retail", 0.92, {
      subcategory: "children_clothing_store",
      businessModel: "retail_goods_store",
      operationalModel: hasOnline ? "hybrid_offline_online" : "location_based_retail",
      primaryRevenueModel: "retail_sales",
      secondaryRevenueModels: hasOnline ? ["social_commerce"] : [],
      sellsGoods: true,
      providesServices: false,
      producesGoods: false,
      rentsAssets: false,
      importsGoodsOrInputs: imports,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      usesDelivery: hasOnline,
      hasStaff: true,
      hasWalkInTraffic: true,
      hasCustomerFlowDependency: true,
      hasHighWorkingCapitalNeed: true,
      hasSeasonality: true,
      hasCurrencyExposure: foreignCurrency || imports,
      hasCreditOrLeasingNeed: creditOrLeasing,
      hasSanitaryRequirements: false,
      hasRegulatedActivity: false,
      hasLicensingOrPermits: false,
      relevantInterviewBlocks: [
        "business_idea",
        "market_sales",
        "premises_location",
        "inventory_suppliers",
        "equipment_launch",
        "team_operations",
        "finance",
        "documents_experience"
      ],
      excludedInterviewBlocks: ["sanitary", "food_service_menu", "production_process", "raw_material_yield", "daily_covers"],
      requiredDataForAnalysis: [
        "businessType", "businessIdea", "region", "district", "targetCustomerSegments", "salesChannels",
        "productCategories", "skuCount", "initialInventoryCostUZS", "averagePurchaseCost", "averageMarkupPct", "inventoryTurnoverDays",
        "supplierSelected", "supplierPaymentTerms", "monthlyRent", "traffic", "conversion", "averageTicket", "monthlyCapacity",
        "equipmentCapex", "staffPlan", "monthlyMarketing", "ownContributionAmount", "creditNeeded"
      ],
      revenueUnit: "retail_sale",
      capacityUnit: "items_or_checks_per_month",
      averageTicketField: "averageTicket",
      volumeField: "monthlyCapacity",
      keyCostDrivers: ["inventory", "rent", "payroll", "marketing", "shrinkage", "returns", "seasonal_stock", "supplier_prices", "fx"],
      keyRevenueDrivers: ["foot_traffic", "instagram_telegram_pipeline", "conversion", "average_ticket", "repeat_customers", "inventory_turnover"],
      keyRisks: ["wrong_size_mix", "seasonal_leftovers", "stock_turnover", "supplier_prices", "margin", "high_rent", "foot_traffic", "returns_exchange", "single_supplier", "instagram_telegram_pipeline"],
      documentCategories: ["business_registration", "tax_cash_register", "rent_contract", "supplier_documents", "product_certificates_labeling", "returns_policy", "labor_contracts"],
      sourceCategories: ["retail_statistics", "clothing_production", "demography", "cpi_clothing", "income", "import_export", "maps_proxy", "marketplaces_proxy"],
      recommendedSourceCategories: ["retail_statistics", "clothing_production", "demography", "cpi_clothing", "income", "import_export", "maps_proxy", "marketplaces_proxy"]
    });
  }

  if (!retailFalsePositive && includesAny(text, [/магазин|розниц|retail|shop|товар|косметик|одежд|продуктовый|автозапчаст/])) {
    return profile("retail", 0.8, {
      subcategory: includesAny(text, [/косметик/]) ? "cosmetics" : "store",
      operationalModel: "standalone_location",
      sellsGoods: true,
      importsGoodsOrInputs: imports,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasWalkInTraffic: true,
      hasCustomerFlowDependency: true,
      hasHighWorkingCapitalNeed: true,
      hasCurrencyExposure: foreignCurrency || imports,
      hasCreditOrLeasingNeed: creditOrLeasing,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "inventory", "suppliers", "working_capital", "unit_economics"],
      excludedInterviewBlocks: ["production_process", "raw_material_yield", "daily_covers"],
      requiredDataForAnalysis: ["productCategories", "skuCount", "suppliers", "purchasePrices", "marginPct", "inventoryTurnover", "monthlyRent", "traffic", "conversion", "averageTicket"],
      keyCostDrivers: ["inventory", "rent", "payroll", "shrinkage", "marketing"],
      keyRevenueDrivers: ["traffic", "conversion", "average_ticket", "margin"],
      keyRisks: ["stock_turnover", "supplier_prices", "foot_traffic", "fx"],
      recommendedSourceCategories: ["retail_statistics", "cpi", "demography", "income", "import_export", "maps_proxy"]
    });
  }

  if (includesAny(text, [/импорт|экспорт|import|export|тамож|customs|incoterms|tn ved|тн вэд|hs code/])) {
    return profile("import_export", 0.88, {
      subcategory: includesAny(text, [/оборуд/]) ? "equipment_import" : "trade",
      operationalModel: "warehouse_based",
      sellsGoods: true,
      importsGoodsOrInputs: !exports || imports,
      exportsGoodsOrServices: exports,
      hasInventory: true,
      hasPremises: true,
      hasHighWorkingCapitalNeed: true,
      hasCurrencyExposure: true,
      hasCreditOrLeasingNeed: creditOrLeasing,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: true,
      relevantInterviewBlocks: [...baseBlocks, "import_export", "suppliers", "inventory", "working_capital", "documents_permits_compliance"],
      excludedInterviewBlocks: ["seating_capacity", "beauty_masters", "production_line"],
      requiredDataForAnalysis: ["importCountry", "supplierCurrency", "supplier", "incoterms", "customsBroker", "customsDuties", "certificates", "deliveryTime", "prepaymentPct", "alternativeSuppliers"],
      keyCostDrivers: ["purchase_price", "fx", "customs", "logistics", "storage", "certification"],
      keyRevenueDrivers: ["sales_price", "b2b_orders", "turnover", "service_warranty"],
      keyRisks: ["fx", "customs", "supplier", "delivery_delay", "certification", "working_capital"],
      recommendedSourceCategories: ["customs", "foreign_trade", "central_bank", "un_comtrade", "itc", "trade_policy"]
    });
  }

  if (!agricultureServiceSupportSignal && !rentalColdStorageServiceSignal && includesAny(text, [/теплиц|ферм|agriculture|agro|qishloq|парник|животновод|садовод/])) {
    return profile("agriculture", 0.84, {
      subcategory: includesAny(text, [/теплиц|greenhouse/]) ? "greenhouse" : "farm",
      operationalModel: "production_workshop",
      sellsGoods: true,
      producesGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasSeasonality: true,
      hasEnvironmentalRisk: true,
      hasHighWorkingCapitalNeed: true,
      hasCurrencyExposure: foreignCurrency,
      hasLicensingOrPermits: true,
      relevantInterviewBlocks: [...baseBlocks, "raw_materials_inputs", "equipment", "capacity", "seasonality", "environmental_requirements", "documents_permits_compliance"],
      excludedInterviewBlocks: ["seating_capacity", "beauty_masters"],
      requiredDataForAnalysis: ["landOrGreenhouse", "area", "cropOrLivestock", "yield", "water", "energy", "seedsFeed", "storage", "salesChannels", "climateRisks"],
      keyCostDrivers: ["seeds_feed", "water", "energy", "labor", "storage", "transport"],
      keyRevenueDrivers: ["yield", "area", "sales_price", "season"],
      keyRisks: ["climate", "water", "seasonality", "price_volatility", "biosecurity"],
      recommendedSourceCategories: ["agriculture_statistics", "prices", "exports", "faostat", "weather_proxy"]
    });
  }


  if (includesAny(text, [/аренд[ауы]?\s+(строительн(ого|ый)\s+)?инструмент|прокат\s+(строительн(ого|ый)\s+)?инструмент|аренд[ауы]?\s+оборудован|прокат\s+оборудован|tool\s*rental|equipment\s*rental|строительн.*инструмент.*аренд|перфоратор|шлифмашин|сварочн.*аппарат|бетономешалк/i])) {
    return profile("services", 0.88, {
      subcategory: "tool_equipment_rental",
      operationalModel: "warehouse_based",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasStaff: true,
      usesDelivery: includesAny(text, [/достав|delivery|привез|курьер/i]),
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: false,
      hasEnvironmentalRisk: false,
      hasSafetyRisk: true,
      hasSeasonality: true,
      hasHighWorkingCapitalNeed: true,
      hasCustomerFlowDependency: true,
      hasB2BContracts: includesAny(text, [/b2b|бригада|строительн.*компан|корпоратив|договор|contract|contractor/i]),
      hasWalkInTraffic: true,
      hasRegulatedActivity: false,
      hasCurrencyExposure: foreignCurrency,
      hasCreditOrLeasingNeed: creditOrLeasing || includesAny(text, [/лизинг|покупк.*оборуд|закупк.*инструмент/i]),
      relevantInterviewBlocks: [
        "business_concept",
        "tool_rental_inventory",
        "tool_rental_clients_pricing",
        "tool_rental_location_operations",
        "tool_rental_maintenance_safety",
        "tool_rental_documents_liability",
        "finance",
        "risks"
      ],
      excludedInterviewBlocks: [
        "auto_service_format",
        "auto_service_premises",
        "auto_service_services_capacity",
        "auto_service_revenue_customers",
        "auto_service_equipment",
        "auto_service_consumables_suppliers",
        "auto_service_compliance",
        "auto_service_staff_quality",
        "car_wash_format",
        "cleaning_service_model",
        "food_service_menu",
        "production_process",
        "retail_sku",
        "logistics_routes_fleet"
      ],
      requiredDataForAnalysis: [
        "rentalToolCategories",
        "rentalFleetSize",
        "rentalPricingModel",
        "averageRentalTicket",
        "rentalOrdersPerMonth",
        "depositPolicy",
        "damageLossPolicy",
        "toolMaintenancePlan",
        "storageNeeds",
        "deliveryModel",
        "clientContracts",
        "handoverActRequired"
      ],
      keyCostDrivers: ["tool_purchase_capex", "maintenance_repairs", "storage_rent", "delivery", "staff_payroll", "website_crm", "insurance_or_loss_reserve", "marketing"],
      keyRevenueDrivers: ["rental_orders", "average_rental_ticket", "utilization_rate", "deposit_policy", "b2b_contracts", "delivery_fee"],
      keyRisks: ["tool_damage", "tool_theft_or_non_return", "low_utilization", "weak_contracts", "maintenance_downtime", "seasonality", "working_capital"],
      recommendedSourceCategories: ["services_statistics", "construction_statistics", "small_business", "demography", "labor_market", "prices", "maps_proxy", "legal_contracts", "b2b_demand_proxy"]
    });
  }

  if (includesAny(text, [/мини[-\s]?склад|self[-\s]?storage|хранени[ея]\s+(вещ|личн|товар)|склад.*хранени[ея]\s+вещ|индивидуальн.*хранени/i])) {
    return profile("services", 0.85, {
      subcategory: "self_storage",
      businessModel: "storage_unit_rental",
      operationalModel: "warehouse_based",
      primaryRevenueModel: "storage_rent",
      secondaryRevenueModels: ["insurance", "packing_materials"],
      providesServices: true,
      rentsAssets: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: false,
      hasEquipment: true,
      hasPremises: true,
      usesPremises: true,
      hasStaff: true,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasEnvironmentalRisk: false,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasB2BContracts: includesAny(text, [/b2b|компан|интернет-магазин|ecommerce|склад.*товар/i]),
      hasCreditOrLeasingNeed: creditOrLeasing,
      requiredDataForAnalysis: ["storageUnitTypes", "targetCustomers", "storageUnitsCount", "averageStorageTicket", "premisesStatus", "premisesAreaSqm", "storageSecurityPlan", "accessControlPlan", "clientContracts", "damageLiability"],
      revenueUnit: "storage_unit_month",
      capacityUnit: "storage_units",
      averageTicketField: "averageStorageTicket",
      volumeField: "storageUnitsCount",
      keyCostDrivers: ["warehouse_rent", "fitout_partitions", "security_cameras", "staff_payroll", "utilities", "insurance"],
      keyRevenueDrivers: ["occupied_units", "average_storage_ticket", "occupancy_rate", "contract_duration", "b2b_clients"],
      keyRisks: ["low_occupancy", "theft_or_damage", "fire_safety", "weak_contracts", "location_access"],
      documentCategories: ["storage_contract", "liability", "fire_safety", "insurance", "access_rules"],
      sourceCategories: ["real_estate", "small_business", "demography", "maps_proxy", "prices"]
    });
  }

  if (!logisticsFalsePositive && includesAny(text, [/логист|достав|груз|transport|delivery|courier|warehouse|склад|экспедиц/])) {
    return profile("logistics", 0.82, {
      subcategory: "delivery_transport",
      operationalModel: "b2b_contract_model",
      providesServices: true,
      hasEquipment: true,
      hasStaff: true,
      hasB2BContracts: true,
      hasSafetyRisk: true,
      hasCurrencyExposure: foreignCurrency,
      hasLicensingOrPermits: true,
      hasCreditOrLeasingNeed: true,
      relevantInterviewBlocks: [...baseBlocks, "equipment", "staff_payroll", "documents_permits_compliance", "safety_fire_labor_protection", "working_capital"],
      excludedInterviewBlocks: ["seating_capacity", "production_process", "beauty_masters"],
      requiredDataForAnalysis: ["transportType", "routes", "fleet", "vehicleLease", "fuel", "drivers", "insurance", "b2bContracts", "loadFactor", "tariff"],
      keyCostDrivers: ["fuel", "vehicles", "maintenance", "drivers", "insurance"],
      keyRevenueDrivers: ["trips", "tariff", "load_factor", "b2b_contracts"],
      keyRisks: ["fuel_prices", "vehicle_downtime", "b2b_contracts", "safety"],
      recommendedSourceCategories: ["transport_statistics", "fuel_prices", "trade_flows", "labor_market"]
    });
  }

  if (includesAny(text, [/учеб|образован|(?<!экс)курс|школ|education|training|o'quv|oquv|детский центр|языков/])) {
    return profile("education", 0.8, {
      subcategory: includesAny(text, [/детск|children|kids/]) ? "children_center" : "training_center",
      operationalModel: includesAny(text, [/онлайн|online/]) ? "online_only" : "rented_space",
      providesServices: true,
      hasPremises: !includesAny(text, [/онлайн|online/]),
      hasStaff: true,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasSeasonality: true,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "staff_payroll", "documents_permits_compliance", "safety_fire_labor_protection", "seasonality"],
      excludedInterviewBlocks: ["inventory", "production_process"],
      requiredDataForAnalysis: ["format", "ageGroup", "program", "teachers", "premisesOrOnline", "licensing", "studentsCount", "price", "schedule", "cac", "retention"],
      keyCostDrivers: ["teachers", "rent", "marketing", "materials"],
      keyRevenueDrivers: ["students", "monthly_fee", "retention", "group_utilization"],
      keyRisks: ["teacher_quality", "retention", "licensing", "seasonality"],
      recommendedSourceCategories: ["demography", "education_statistics", "income", "labor_market", "licensing", "unicef_mics"]
    });
  }

  if (includesAny(text, [/клиник|стомат|медицин|аптек|healthcare|medical|clinic|laboratory|pharmacy/])) {
    return profile("healthcare", 0.84, {
      subcategory: includesAny(text, [/стомат/]) ? "dentistry" : "clinic",
      operationalModel: "standalone_location",
      providesServices: true,
      sellsGoods: includesAny(text, [/аптек|pharmacy/]),
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasStaff: true,
      hasRegulatedActivity: true,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSafetyRisk: true,
      hasCurrencyExposure: true,
      hasCreditOrLeasingNeed: true,
      relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "staff_payroll", "sanitary_requirements", "documents_permits_compliance", "environmental_requirements"],
      excludedInterviewBlocks: ["retail_shelf_space", "production_process"],
      requiredDataForAnalysis: ["serviceType", "licensedActivity", "doctors", "premises", "sanitaryRequirements", "medicalEquipment", "consumables", "medicalWaste", "patients", "averageTicket"],
      keyCostDrivers: ["licensed_staff", "equipment", "consumables", "rent", "medical_waste"],
      keyRevenueDrivers: ["patients", "average_ticket", "repeat_visits", "corporate_clients"],
      keyRisks: ["licensing", "sanitary", "medical_waste", "staff", "data_privacy"],
      recommendedSourceCategories: ["demography", "health_indicators", "ministry_health", "sanitary", "who", "income"]
    });
  }


  const sampleProfile = findBusinessSampleProfile(text, { minScore: 1500 });
  if (sampleProfile) {
    const confidence = 0.86;
    const base = profile(sampleProfile.sample.category, confidence, {
      ...sampleProfile.profile,
      aiClassification: {
        sampleId: sampleProfile.sample.id,
        source: "business_sample_registry",
        labels: sampleProfile.sample.label,
        score: sampleProfile.score,
        keepsDynamicFallbackForUnknownBusinesses: true
      },
      _requiresAIClassification: false
    });
    return attachClassificationAudit(applyContextualProfileAdjustments(base, text), {
      inputBusinessType: businessTypeText,
      normalizedBusinessType: normalizeForMatchingText(businessTypeText),
      matchedSampleId: sampleProfile.sample.id,
      confidence,
      matchedAliases: [sampleProfile.sample.label.ru, sampleProfile.sample.label.en, ...sampleProfile.sample.aliases].slice(0, 8),
      signals: { ...classificationSignalWeights },
      fallbackUsed: false,
      classificationNeedsReview: false,
      reason: "Strong sample match from combined weighted signals"
    });
  }

  if (tentativeWeightedSample) {
    const base = profile(tentativeWeightedSample.match.sample.category, tentativeWeightedSample.confidence, {
      ...tentativeWeightedSample.match.profile,
      aiClassification: {
        sampleId: tentativeWeightedSample.match.sample.id,
        source: `${tentativeWeightedSample.signal}_sample_registry_needs_review`,
        labels: tentativeWeightedSample.match.sample.label,
        score: tentativeWeightedSample.match.score,
        keepsDynamicFallbackForUnknownBusinesses: true
      },
      _requiresAIClassification: false
    });
    return attachClassificationAudit(applyContextualProfileAdjustments(base, text), {
      inputBusinessType: businessTypeText,
      normalizedBusinessType: normalizeForMatchingText(businessTypeText),
      matchedSampleId: tentativeWeightedSample.match.sample.id,
      confidence: tentativeWeightedSample.confidence,
      matchedAliases: [tentativeWeightedSample.match.sample.label.ru, tentativeWeightedSample.match.sample.label.en, ...tentativeWeightedSample.match.sample.aliases].slice(0, 8),
      signals: { ...classificationSignalWeights },
      fallbackUsed: false,
      classificationNeedsReview: true,
      reason: `Medium-confidence weighted sample match from ${tentativeWeightedSample.signal}`
    });
  }

  return attachClassificationAudit(profile("generic", 0.55, {
    operationalModel: "mixed",
    providesServices: true,
    sellsGoods: includesAny(text, [/прода|товар|shop|product|sale/]),
    hasCurrencyExposure: foreignCurrency,
    hasCreditOrLeasingNeed: creditOrLeasing,
    relevantInterviewBlocks: baseBlocks,
    excludedInterviewBlocks: [],
    requiredDataForAnalysis: ["businessType", "businessIdea", "region", "productOrService", "monthlyCapacity", "averagePrice", "targetCustomers", "ownContributionAmount"],
    keyRisks: ["data_quality", "market_demand", "execution", "working_capital"],
    recommendedSourceCategories: ["official_statistics", "small_business", "demography", "prices", "market_validation"],
    _requiresAIClassification: true,
    _classificationHint: buildClassificationHint(text)
  }), {
    inputBusinessType: businessTypeText,
    normalizedBusinessType: normalizeForMatchingText(businessTypeText),
    confidence: 0.55,
    matchedAliases: [],
    signals: { ...classificationSignalWeights },
    fallbackUsed: true,
    classificationNeedsReview: false,
    reason: "No sample reached confidence threshold; AI fallback required"
  });
}


export type AIClassifierResponse = {
  category?: string;
  subcategory?: string;
  confidence?: number;
  operatingModel?: string;
  revenueUnit?: string;
  needsSpecialLicense?: boolean;
  isImportDependent?: boolean;
  isFoodRelated?: boolean;
  keyRisks?: string[];
  documentProfile?: string;
  sourceCategories?: string[];
  additionalInterviewTopics?: string[];
};


const allowedAIClassifierCategories: BusinessCategory[] = [
  "services",
  "retail",
  "manufacturing",
  "food_service",
  "ecommerce",
  "agriculture",
  "import_export",
  "construction",
  "logistics",
  "education",
  "healthcare",
  "beauty_wellness",
  "it_digital",
  "tourism_hospitality",
  "financial_services",
  "real_estate",
  "entertainment",
  "generic"
];

export function classifierCacheKey(input: ClassifierInput) {
  return [input.businessType, input.businessIdea, input.region, input.language]
    .map((part) => String(part ?? "").trim().toLowerCase())
    .join("|");
}


function normalizeAIClassifierCategory(value: string | undefined): BusinessCategory {
  const candidate = String(value ?? "generic") as BusinessCategory;
  return allowedAIClassifierCategories.includes(candidate) ? candidate : "generic";
}

function normalizeAIOperatingModel(value: string | undefined): OperationalModel {
  switch (value) {
    case "service_only":
      return "specialized_service";
    case "retail_only":
      return "location_based_retail";
    case "service_retail_mix":
      return "hybrid_offline_online";
    case "manufacturing":
      return "production_workshop";
    case "online":
      return "online_only";
    case "mixed":
    default:
      return "mixed";
  }
}

export function buildAIClassificationPrompt(input: ClassifierInput): string {
  const locale = input.language === "uz" || input.language === "en" ? input.language : "ru";
  return `
You are a business classifier for Uzbekistan market.

User input:
- Business type: "${input.businessType ?? ""}"
- Business idea: "${input.businessIdea ?? ""}"
- Interface language: "${locale}"

IMPORTANT CLASSIFICATION RULES:
1. Treat the explicit "Business type" field as the primary signal. Do not override an exact or strong sample-style match from businessType because the idea/description mentions customers, premises, suppliers or adjacent industries.
2. Use the business idea/description only as a supporting signal unless businessType is empty, ambiguous or below confidence threshold.
3. Return fallback/generic only when no reliable sample/archetype match exists.
4. Return confidence and keep the reason implicit in stable fields; do not invent official facts.

IMPORTANT LANGUAGE RULE:
All human-readable string values in the JSON response MUST be written in the interface language "${locale}".
Use Russian for "ru", Uzbek in Latin script for "uz", and English for "en".
Do not mix languages. Brand names, currency codes and standard technical abbreviations may remain unchanged.

Field rules:
- "category" and "operatingModel" must use the enum values exactly as specified below.
- "subcategory" must be a stable technical short_snake_case identifier in English, not a display label.
- "keyRisks", "documentProfile" descriptions if any, "sourceCategories" display-like values and "additionalInterviewTopics" must be localized to "${locale}".

Classify this business and return ONLY a JSON object (no markdown, no explanation):
{
  "category": "services|retail|manufacturing|food_service|ecommerce|agriculture|import_export|construction|logistics|education|healthcare|beauty_wellness|it_digital|tourism_hospitality|financial_services|real_estate|entertainment|generic",
  "subcategory": "short_snake_case_name",
  "confidence": 0.0-1.0,
  "operatingModel": "service_only|retail_only|service_retail_mix|manufacturing|online|mixed",
  "revenueUnit": "order|visit|subscription|kg|unit|m2|hour|seat|other",
  "needsSpecialLicense": true|false,
  "isImportDependent": true|false,
  "isFoodRelated": true|false,
  "keyRisks": ["localized risk 1", "localized risk 2", "localized risk 3"],
  "documentProfile": "standard_service|food_license|medical_license|education_license|construction_license|transport_license|no_special_license",
  "sourceCategories": ["localized_source_category_1", "localized_source_category_2"],
  "additionalInterviewTopics": ["localized topic 1", "localized topic 2", "localized topic 3"]
}
`.trim();
}

export function inferLowConfidenceProfile(input: ClassifierInput, fallback: BusinessProfile): BusinessProfile {
  const text = normalize(input);
  if (fallback.category !== "generic" && fallback.confidence >= 0.65) return fallback;
  if (includesAny(text, [/прокат|аренд|rental|rent/i])) {
    return profile("services", 0.7, {
      subcategory: "asset_rental_service",
      businessModel: "rental_assets",
      operationalModel: "location_based_retail",
      primaryRevenueModel: "rental_session",
      providesServices: true,
      rentsAssets: true,
      hasEquipment: true,
      hasCustomerFlowDependency: true,
      hasSafetyRisk: true,
      revenueUnit: "rental_session",
      keyCostDrivers: ["asset_purchase", "maintenance", "rent", "insurance", "staff"],
      keyRevenueDrivers: ["asset_count", "utilization", "rental_price", "location_traffic"],
      keyRisks: ["asset_damage", "low_utilization", "seasonality", "liability"],
      sourceCategories: ["services", "prices", "real_estate", "demography"],
      additionalInterviewTopics: ["парк активов", "загрузка", "трафик точки", "ремонт и обслуживание", "ответственность клиента"],
      documentProfile: "standard_service"
    });
  }
  if (includesAny(text, [/мастерск|ремонт|repair|service/i])) {
    return profile("services", 0.7, {
      subcategory: "repair_workshop",
      businessModel: "repair_service",
      operationalModel: "specialized_service",
      primaryRevenueModel: "repair_order",
      providesServices: true,
      sellsGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      revenueUnit: "repair_order",
      keyCostDrivers: ["tools", "spare_parts", "rent", "master_salary"],
      keyRevenueDrivers: ["repair_orders", "average_ticket", "repeat_clients", "accessory_sales"],
      keyRisks: ["master_quality", "spare_parts_availability", "warranty_claims", "low_traffic"],
      sourceCategories: ["services", "retail", "labor_market", "prices", "real_estate"],
      additionalInterviewTopics: ["виды ремонта", "запчасти и поставщики", "гарантия", "квалификация мастеров", "локационный трафик"],
      documentProfile: "standard_service"
    });
  }
  return fallback;
}

export function profileFromAIResponse(ai: AIClassifierResponse, fallback: BusinessProfile, input: ClassifierInput): BusinessProfile {
  const category = normalizeAIClassifierCategory(ai.category);
  const confidence = Math.max(0, Math.min(1, Number(ai.confidence ?? fallback.confidence ?? 0.7)));
  const providesServices = ["services", "education", "healthcare", "beauty_wellness", "it_digital", "tourism_hospitality", "financial_services", "entertainment", "logistics"].includes(category);
  const sellsGoods = ["retail", "ecommerce", "import_export", "food_service"].includes(category) || ai.operatingModel === "service_retail_mix";
  const producesGoods = category === "manufacturing" || category === "agriculture";
  const operatingModel = normalizeAIOperatingModel(ai.operatingModel);
  const sourceCategories = ai.sourceCategories?.length ? ai.sourceCategories : fallback.sourceCategories;
  return profile(category, confidence, {
    subcategory: ai.subcategory ?? fallback.subcategory ?? "ai_classified_business",
    businessModel: ai.operatingModel ?? fallback.businessModel,
    operationalModel: operatingModel,
    primaryRevenueModel: ai.revenueUnit ?? fallback.primaryRevenueModel,
    providesServices,
    sellsGoods,
    producesGoods,
    rentsAssets: ai.revenueUnit === "hour" || /rent|rental|прокат|аренд/i.test(`${input.businessType ?? ""} ${input.businessIdea ?? ""}`),
    hasInventory: sellsGoods || producesGoods || Boolean(ai.isImportDependent),
    hasEquipment: true,
    hasPremises: operatingModel !== "online_only",
    hasStaff: true,
    hasLicensingOrPermits: Boolean(ai.needsSpecialLicense),
    hasRegulatedActivity: Boolean(ai.needsSpecialLicense),
    hasSanitaryRequirements: Boolean(ai.isFoodRelated) || category === "healthcare" || category === "beauty_wellness",
    hasSafetyRisk: true,
    hasCustomerFlowDependency: operatingModel !== "online_only",
    hasWalkInTraffic: ["retail", "food_service", "beauty_wellness", "services"].includes(category),
    hasCurrencyExposure: Boolean(ai.isImportDependent),
    relevantInterviewBlocks: [...baseBlocks, "location_premises", "equipment", "staff_payroll", "documents_permits_compliance", "working_capital"],
    excludedInterviewBlocks: category === "services" ? ["production_process"] : [],
    requiredDataForAnalysis: ["businessType", "businessIdea", "region", "productOrService", "monthlyCapacity", "averagePrice", ...(ai.additionalInterviewTopics ?? [])],
    revenueUnit: ai.revenueUnit ?? fallback.revenueUnit,
    keyCostDrivers: fallback.keyCostDrivers,
    keyRevenueDrivers: fallback.keyRevenueDrivers,
    keyRisks: ai.keyRisks?.length ? ai.keyRisks : fallback.keyRisks,
    documentCategories: ["registration", "tax", "contracts", ...(ai.needsSpecialLicense ? ["licensing"] : ["no_special_license"])],
    sourceCategories,
    recommendedSourceCategories: sourceCategories,
    additionalInterviewTopics: ai.additionalInterviewTopics?.length ? ai.additionalInterviewTopics : fallback.additionalInterviewTopics,
    documentProfile: ai.documentProfile ?? fallback.documentProfile,
    needsSpecialLicense: Boolean(ai.needsSpecialLicense),
    isImportDependent: Boolean(ai.isImportDependent),
    isFoodRelated: Boolean(ai.isFoodRelated),
    aiClassification: ai as Record<string, unknown>,
    _requiresAIClassification: false
  });
}


export function classifyBusinessWithFallback(input: ClassifierInput): BusinessClassificationResult {
  const keywordProfile = classifyBusiness(input);
  if (keywordProfile.confidence >= 0.7 && keywordProfile.category !== "generic") return keywordProfile;
  return inferLowConfidenceProfile(input, keywordProfile);
}

export function legacyBusinessProfile(profile: BusinessProfile): NonNullable<StructuredProjectData["businessProfile"]> {
  const legacyCategory = profile.category === "beauty_wellness" ? "services" : profile.category === "import_export" ? "retail" : profile.category === "professional_services" ? "services" : profile.category === "transport" ? "logistics" : profile.category === "it_digital" ? "ecommerce" : profile.category === "other" ? "generic" : profile.category;
  return {
    ...profile,
    category: legacyCategory as NonNullable<StructuredProjectData["businessProfile"]>["category"],
    businessCategory: profile.category,
    businessSubcategory: profile.subcategory,
    operationalModel: profile.operationalModel,
    capabilities: profile.capabilities,
    hasInventory: profile.hasInventory,
    hasEquipment: profile.hasEquipment,
    hasPremises: profile.hasPremises,
    hasStaff: profile.hasStaff,
    hasLicensing: profile.hasLicensingOrPermits,
    hasSeasonality: profile.hasSeasonality,
    revenueModel: profile.keyRevenueDrivers.join(", "),
    relevantFocusAreas: profile.relevantInterviewBlocks,
    keyCostDrivers: profile.keyCostDrivers,
    keyRisks: profile.keyRisks,
    recommendedInterviewBlocks: profile.relevantInterviewBlocks
  };
}
