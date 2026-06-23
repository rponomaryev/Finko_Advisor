import { resolveTemplateForData } from "../services/templateService.ts";
import { classifyBusiness, legacyBusinessProfile } from "../business/businessClassifier.ts";
import {
  buildVisibilityContext,
  isQuestionMissing as isRequiredQuestionMissing,
  isQuestionVisible,
  showIfMatches,
  valueByPath,
  valueByPathWithAliases
} from "../interview/interviewValidation.ts";
import { buildInterviewRequiredKeys, calculateInterviewProgress } from "../interview/interviewProgress.ts";
import type { AiExtractionResult, InterviewBlock, InterviewQuestion, StructuredProjectData } from "../types/project.ts";
import type { SectorTemplate } from "../types/sector.ts";

export { showIfMatches, valueByPath } from "../interview/interviewValidation.ts";

type FallbackInput = {
  message: string;
  knownData?: StructuredProjectData;
};

type NextQuestionOptions = {
  blockId?: string;
  includeAnswered?: boolean;
  template?: SectorTemplate;
};


function isValueMissing(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "" || value === "__later__";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && "roles" in value) {
    const roles = (value as { roles?: Array<Record<string, unknown>> }).roles;
    return !Array.isArray(roles) || roles.length === 0 || roles.some((role) => !String(role.role ?? "").trim() || Number(role.count ?? 0) <= 0 || Number(role.monthlySalaryAmount ?? 0) <= 0);
  }
  return false;
}

function visibilityData(data: StructuredProjectData): Record<string, unknown> {
  const profile = classifyBusiness({
    businessType: data.businessType,
    businessIdea: data.businessIdea,
    region: data.region,
    language: data.userLanguage,
    answers: data
  });
  return buildVisibilityContext({ answers: data, profile });
}

function isQuestionValueMissing(question: InterviewQuestion, data: StructuredProjectData): boolean {
  return isRequiredQuestionMissing(question, visibilityData(data));
}

function questionIsVisible(question: InterviewQuestion, data: StructuredProjectData): boolean {
  return isQuestionVisible(question, visibilityData(data));
}

function resolveTemplate(data: StructuredProjectData, template?: SectorTemplate) {
  return template ?? resolveTemplateForData(data);
}

function isRequiredQuestion(template: SectorTemplate, question: InterviewQuestion): boolean {
  if (question.isRequired === true || question.required === true) return true;
  if (question.optional === true) return false;
  if (template.requiredInputs.includes(question.key)) return true;
  // Omitted optional flag means mandatory in the interview UI/fallback flow.
  return true;
}

function getBlockById(template: SectorTemplate, blockId?: string): InterviewBlock | undefined {
  return template.interviewBlocks.find((block) => block.id === blockId);
}

function getVisibleRequiredMissingQuestions(template: SectorTemplate, block: InterviewBlock, data: StructuredProjectData): InterviewQuestion[] {
  return block.questions.filter((question) => {
    if (!isRequiredQuestion(template, question) || !questionIsVisible(question, data)) return false;
    return isQuestionValueMissing(question, data);
  });
}

function getFirstMissingBlockFrom(
  template: SectorTemplate,
  startIndex: number,
  data: StructuredProjectData
): { block: InterviewBlock; index: number } | undefined {
  const blocks = template.interviewBlocks;
  for (let index = Math.max(0, startIndex); index < blocks.length; index += 1) {
    if (getVisibleRequiredMissingQuestions(template, blocks[index], data).length > 0) return { block: blocks[index], index };
  }
  return undefined;
}

export function getMissingFields(data: StructuredProjectData, templateInput?: SectorTemplate): string[] {
  const template = resolveTemplate(data, templateInput);
  const conditionalRequired = buildInterviewRequiredKeys(template, data).filter((field) => !template.requiredInputs.includes(field));
  const requiredInputs = new Set([...template.requiredInputs, ...conditionalRequired]);
  const missingFromQuestions = template.interviewBlocks
    .flatMap((block) => block.questions)
    .filter((question) => isRequiredQuestion(template, question) || requiredInputs.has(question.key))
    .filter((question) => questionIsVisible(question, data))
    .filter((question) => isQuestionValueMissing(question, data))
    .map((question) => question.key);
  const missingFromExtraKeys = [...requiredInputs].filter((field) => {
    const question = template.interviewBlocks.flatMap((block) => block.questions).find((item) => item.key === field);
    if (question) return false;
    return isValueMissing(valueByPathWithAliases(data, field));
  });
  return Array.from(new Set([...missingFromQuestions, ...missingFromExtraKeys]));
}

export function getNextCursorBlockId(data: StructuredProjectData, currentBlockId?: string, templateInput?: SectorTemplate): string | undefined {
  const template = resolveTemplate(data, templateInput);
  const blocks = template.interviewBlocks;
  const currentIndex = blocks.findIndex((block) => block.id === currentBlockId);

  const completed = new Set(data.completedBlockIds ?? []);
  if (currentIndex >= 0 && !completed.has(blocks[currentIndex].id) && getVisibleRequiredMissingQuestions(template, blocks[currentIndex], data).length > 0) {
    return blocks[currentIndex].id;
  }

  if (currentIndex >= 0) {
    for (let index = currentIndex + 1; index < blocks.length; index += 1) {
      if (!completed.has(blocks[index].id) && blockIsRelevant(blocks[index], data)) return blocks[index].id;
    }
  }

  const nextAfterCurrent = getFirstMissingBlockFrom(template, currentIndex >= 0 ? currentIndex + 1 : 0, data);
  if (nextAfterCurrent) return nextAfterCurrent.block.id;

  const firstMissingAnywhere = getFirstMissingBlockFrom(template, 0, data);
  return firstMissingAnywhere?.block.id;
}


export type InterviewBlockStatus = "locked" | "current" | "partial" | "completed" | "skipped";

function hasAnyAnsweredQuestion(block: InterviewBlock, data: StructuredProjectData): boolean {
  const context = visibilityData(data);
  return block.questions.some((question) => questionIsVisible(question, data) && !isValueMissing(valueByPathWithAliases(context, question.key)));
}

function blockIsRelevant(block: InterviewBlock, data: StructuredProjectData): boolean {
  return block.questions.some((question) => questionIsVisible(question, data));
}

function getInterviewBlockStatuses(template: SectorTemplate, data: StructuredProjectData, currentBlockId?: string) {
  const completed = new Set(data.completedBlockIds ?? []);
  let reachedCurrent = false;
  return template.interviewBlocks.map((block, index) => {
    const missing = getVisibleRequiredMissingQuestions(template, block, data);
    const relevant = blockIsRelevant(block, data);
    let status: InterviewBlockStatus;
    if (!relevant) status = "skipped";
    else if (block.id === currentBlockId) {
      status = missing.length === 0 && completed.has(block.id) ? "completed" : "current";
      reachedCurrent = true;
    } else if (completed.has(block.id)) status = "completed";
    else if (!reachedCurrent && index === 0 && !currentBlockId) status = hasAnyAnsweredQuestion(block, data) ? "partial" : "current";
    else status = "locked";
    return {
      blockId: block.id,
      name: block.name,
      description: block.description,
      step: index + 1,
      totalSteps: template.interviewBlocks.length,
      status,
      missingRequiredFields: missing.map((question) => question.key)
    };
  });
}

function parseMoneyToAmount(message: string): { amount: number; currency: "UZS" | "USD" } | undefined {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(млрд|миллиард|млн|миллион|миллиона|миллионов|тыс|usd|долл|сум|uzs)/i);
  if (!match) return undefined;
  let amount = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  const currency = /usd|долл/.test(unit) ? "USD" : "UZS";
  if (unit.startsWith("млрд") || unit.startsWith("миллиард")) amount *= 1_000_000_000;
  else if (unit.startsWith("млн") || unit.startsWith("милли")) amount *= 1_000_000;
  else if (unit.startsWith("тыс")) amount *= 1_000;
  return { amount: Math.round(amount), currency };
}

function parseNumberNear(message: string, keywords: string[]): number | undefined {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[^0-9]*(\\d+(?:[.,]\\d+)?)`, "i");
    const match = message.match(regex);
    if (match) return Number(match[1].replace(",", "."));
  }
  return undefined;
}

function detectBusinessType(message: string, knownData: StructuredProjectData): string | undefined {
  if (knownData.businessType) return knownData.businessType;
  const direct = message.match(/(?:открыть|запустить|создать|open|start)\s+([^.,\n]+)/i)?.[1]?.trim();
  if (/пекар|хлеб|выпеч|самса|булоч|bakery|bread/i.test(message)) return "Мини-пекарня";
  if (/морожен|ice\s*cream|ice-cream|food kiosk|dessert kiosk/i.test(message)) return "Киоск мороженого";
  if (/автосервис|авто сервис|замен[ауы] масла|диагностик|auto service|car service/i.test(message)) return "Автосервис";
  if (/мебел|furniture/i.test(message)) return "Мебельный цех";
  if (/салон красоты|парикмах|маникюр|beauty salon|hair salon/i.test(message)) return "Салон красоты";
  if (/птицефер|бройлер|куриц|яйц|poultry|broiler/i.test(message)) return "Птицеферма";
  if (/импорт|экспорт|китай|import|export|china/i.test(message)) return "Импорт оборудования";
  if (/кофе|кофейн|кафе|coffee|cafe|qahva|kafe/i.test(message)) return "Кофейня";
  if (/швей|пошив|одеж|sew|tailor|garment|tikuv|kiyim/i.test(message)) return "Швейный цех";
  if (/игруш|toy|oyinchoq|o'yinchoq/i.test(message)) return "Производство игрушек";
  if (direct && direct.length <= 80) return direct.replace(/^небольш\w*\s+/i, "").trim();
  return undefined;
}

function categorizeBusiness(businessType?: string): StructuredProjectData["businessProfile"] {
  const classified = classifyBusiness({ businessType });
  if (classified.confidence >= 0.6) return legacyBusinessProfile(classified);
  const value = businessType?.toLowerCase() ?? "";
  const profile = (
    category: NonNullable<StructuredProjectData["businessProfile"]>["category"],
    confidence: number,
    focus: string[],
    extra: Partial<NonNullable<StructuredProjectData["businessProfile"]>>
  ): StructuredProjectData["businessProfile"] => ({
    category,
    confidence,
    relevantFocusAreas: focus,
    businessCategory: category,
    recommendedInterviewBlocks: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
    ...extra
  });

  if (/пекар|хлеб|выпеч|самса|булоч|bakery|bread|морожен|ice\s*cream|ice-cream|кофе|кафе|coffee|cafe|qahva|kafe|ресторан|еда|общепит/.test(value)) {
    return profile("food_service", 0.86, ["location", "average_ticket", "customer_flow", "staff"], {
      revenueModel: "walk_in_sales",
      operationalModel: "premises_based",
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasStaff: true,
      hasLicensing: true,
      keyCostDrivers: ["rent", "payroll", "ingredients", "utilities"],
      keyRisks: ["location", "sanitary_permits", "customer_flow"]
    });
  }
  if (/швей|производ|цех|manufact|sew|garment|toy|игруш|мебел|furniture|мастерск/.test(value)) {
    return profile("manufacturing", 0.82, ["equipment", "materials", "orders", "staff"], {
      revenueModel: "orders_or_batch_sales",
      operationalModel: "workshop",
      hasInventory: true,
      hasEquipment: true,
      hasPremises: true,
      hasStaff: true,
      hasLicensing: /toy|игруш/.test(value),
      keyCostDrivers: ["equipment", "raw_materials", "payroll", "quality_control"],
      keyRisks: ["supplier_stability", "defects", "seasonality"]
    });
  }
  if (/e-?commerce|онлайн|маркетплейс|marketplace|internet|интернет|онлайн-магазин/.test(value)) {
    return profile("ecommerce", 0.78, ["inventory", "marketplaces", "delivery", "margin"], {
      revenueModel: "online_sales",
      operationalModel: "online_store",
      hasInventory: true,
      hasEquipment: false,
      hasPremises: false,
      hasStaff: true,
      keyCostDrivers: ["inventory", "platform_fees", "delivery", "marketing"],
      keyRisks: ["marketplace_rules", "returns", "delivery_delays"]
    });
  }
  if (/магазин|retail|shop|savdo|торгов/.test(value)) {
    return profile("retail", 0.74, ["inventory", "traffic", "margin", "suppliers"], {
      revenueModel: "product_sales",
      operationalModel: "store",
      hasInventory: true,
      hasPremises: true,
      hasStaff: true,
      keyCostDrivers: ["inventory", "rent", "payroll", "shrinkage"],
      keyRisks: ["stock_turnover", "supplier_prices", "foot_traffic"]
    });
  }
  if (/агро|ферм|agro|farm|сельск|qishloq|птицефер|бройлер|poultry|parranda/.test(value)) {
    return profile("agriculture", 0.74, ["seasonality", "inputs", "storage", "sales_channels"], {
      revenueModel: "seasonal_sales",
      operationalModel: "farm_or_greenhouse",
      hasInventory: true,
      hasEquipment: true,
      hasPremises: false,
      hasStaff: true,
      hasSeasonality: true,
      keyCostDrivers: ["inputs", "labor", "water_energy", "storage"],
      keyRisks: ["weather", "seasonality", "price_volatility"]
    });
  }
  if (/школ|(?<!экс)курс|обуч|education|school|o'quv|oquv/.test(value)) {
    return profile("education", 0.72, ["teachers", "pricing", "groups", "premises"], {
      revenueModel: "course_fees",
      operationalModel: "classes_or_online",
      hasPremises: true,
      hasStaff: true,
      hasLicensing: true,
      keyCostDrivers: ["teachers", "rent", "marketing"],
      keyRisks: ["student_retention", "teacher_quality", "licensing"]
    });
  }
  if (/мед|клиник|салон|beauty|medical|clinic|salon|стомат/.test(value)) {
    return profile("healthcare", 0.72, ["licenses", "specialists", "equipment", "repeat_customers"], {
      revenueModel: "service_fees",
      operationalModel: "appointment_based",
      hasEquipment: true,
      hasPremises: true,
      hasStaff: true,
      hasLicensing: true,
      keyCostDrivers: ["specialists", "equipment", "rent", "consumables"],
      keyRisks: ["licensing", "specialist_availability", "quality"]
    });
  }
  if (/логист|достав|transport|delivery|logistic/.test(value)) {
    return profile("logistics", 0.72, ["vehicles", "routes", "clients", "fuel"], {
      revenueModel: "delivery_or_transport_fees",
      operationalModel: "fleet_or_courier",
      hasEquipment: true,
      hasStaff: true,
      keyCostDrivers: ["fuel", "vehicles", "payroll", "maintenance"],
      keyRisks: ["vehicle_downtime", "route_load", "fuel_prices"]
    });
  }
  if (/ремонт|строит|construction|repair|build/.test(value)) {
    return profile("construction", 0.7, ["tools", "crew", "orders", "materials"], {
      revenueModel: "project_based",
      operationalModel: "mobile_crews",
      hasInventory: true,
      hasEquipment: true,
      hasStaff: true,
      keyCostDrivers: ["materials", "tools", "payroll", "transport"],
      keyRisks: ["project_delays", "material_prices", "quality_claims"]
    });
  }
  if (/импорт|экспорт|китай|import|export|china|лизинг|leasing/.test(value)) {
    return profile("services", 0.76, ["supplier_country", "currency_risk", "customs", "logistics", "financing"], {
      revenueModel: "trade_or_leasing_margin",
      operationalModel: "sourcing_and_delivery",
      hasInventory: true,
      hasEquipment: false,
      hasPremises: false,
      hasStaff: true,
      keyCostDrivers: ["purchase_price", "fx", "customs", "logistics"],
      keyRisks: ["currency", "customs", "supplier_reliability"]
    });
  }

  if (/b2b|консалт|маркетинг|it|аутсорс|outsourc|consult/.test(value)) {
    return profile("b2b_services", 0.72, ["team", "contracts", "pipeline", "pricing"], {
      revenueModel: "contracts_or_subscription",
      operationalModel: "professional_services",
      hasStaff: true,
      hasPremises: false,
      keyCostDrivers: ["payroll", "sales", "software"],
      keyRisks: ["client_concentration", "pipeline", "team_capacity"]
    });
  }
  if (/сервис|service|xizmat/.test(value)) {
    return profile("services", 0.72, ["team", "pricing", "demand", "repeat_customers"], {
      revenueModel: "service_fees",
      operationalModel: "service_delivery",
      hasStaff: true,
      keyCostDrivers: ["payroll", "tools", "marketing"],
      keyRisks: ["demand", "quality", "repeat_customers"]
    });
  }
  return profile("generic", 0.55, ["demand", "costs", "staff", "financing"], {
    revenueModel: "mixed",
    operationalModel: "to_be_confirmed",
    hasStaff: true,
    keyCostDrivers: ["startup_costs", "working_capital", "payroll"],
    keyRisks: ["demand", "suppliers", "financing"]
  });
}

function advisorSavedMessage(locale: StructuredProjectData["userLanguage"]) {
  if (locale === "uz") return "Ma'lumotlar saqlandi. Loyihani aniqlashtirishda davom etamiz.";
  if (locale === "en") return "Your data has been saved. Let's continue refining the project.";
  return "Данные сохранены. Продолжим уточнение проекта.";
}

export function fallbackToDeterministicFlow({ message, knownData = {} }: FallbackInput): AiExtractionResult {
  const normalized = message.trim().toLowerCase();
  const businessType = detectBusinessType(message, knownData);
  const extractedFields: StructuredProjectData = {
    ...knownData,
    businessType: businessType ?? knownData.businessType,
    businessProfile: categorizeBusiness(businessType ?? knownData.businessType),
    sectionNotes: { ...(knownData.sectionNotes ?? {}) }
  };
  let template = resolveTemplateForData(extractedFields);

  if (/андижан|andijan/i.test(message)) extractedFields.region = "Андижанская область";
  if (/ташкентск\w*\s+област|tashkent\s+region|toshkent\s+viloyati/i.test(message)) extractedFields.region = "Ташкентская область";
  else if (/ташкент|tashkent|toshkent/i.test(message)) extractedFields.region = "Ташкент город";
  if (/самарканд|samarkand/i.test(message)) extractedFields.region = "Самаркандская область";
  if (/ферган|fergan/i.test(message)) extractedFields.region = "Ферганская область";

  if (!extractedFields.businessIdea && message.trim().length > 10) extractedFields.businessIdea = message.trim();
  if (/аренд|rent/i.test(message)) extractedFields.premisesStatus = "rent";
  if (/собственн.*помещ|свое помещ|owned/i.test(message)) extractedFields.premisesStatus = "owned";
  if (/б\/у|бу|использован|used/i.test(normalized)) extractedFields.equipmentCondition = "used";
  if (/нов.*оборуд|new equipment/i.test(normalized)) extractedFields.equipmentCondition = "new";
  if (/лизинг|leasing/i.test(message)) extractedFields.needsLeasing = true;
  if (/импорт|import/i.test(message)) extractedFields.rawMaterialSource = "import";
  if (/локальн|местн|local/i.test(message)) extractedFields.rawMaterialSource = "local";
  if (/смешан|mixed/i.test(message)) extractedFields.rawMaterialSource = "mixed";
  if (/кредит не нужен|без кредит|не нужен кредит|no loan|no credit/i.test(message)) extractedFields.creditNeeded = "no";
  if (/кредит.*нуж|нужен кредит|за[её]м|loan|credit/i.test(message)) extractedFields.creditNeeded = "yes";
  if (/пока не знаю.*кредит|не знаю.*кредит/i.test(message)) extractedFields.creditNeeded = "unknown";
  if (/залог.*есть|есть залог|collateral/i.test(message)) extractedFields.collateralAvailable = true;
  if (/без залог|залога нет|нет залога/i.test(message)) extractedFields.collateralAvailable = false;
  if (/разреш|сертифик|санитар|документ|permit|license/i.test(message)) extractedFields.certificationAwareness = extractedFields.certificationAwareness ?? "partly_aware";
  if (/бухгалтер|консультант|юрист|accountant|lawyer/i.test(message)) extractedFields.hasAccountantOrConsultant = true;

  const money = parseMoneyToAmount(message);
  if (money && /своих|собствен|влож|own|contribution/i.test(message)) {
    extractedFields.ownContributionAmount = money.amount;
    extractedFields.ownContributionCurrency = money.currency;
    if (money.currency === "UZS") {
      extractedFields.ownContributionUZS = money.amount;
      extractedFields.ownContribution = money.amount;
    }
  }
  if (money && /кредит|loan|credit/i.test(message)) {
    extractedFields.requestedLoanAmount = money.amount;
    extractedFields.requestedLoanCurrency = money.currency;
    if (money.currency === "UZS") extractedFields.requestedLoanUZS = money.amount;
  }
  if (money && /лизинг|leasing/i.test(message)) extractedFields.requestedLeasingAmount = money.amount;

  const capacity = parseNumberNear(message, ["мощност", "производ", "заказ", "клиент", "продаж", "orders", "clients"]);
  if (capacity) extractedFields.monthlyCapacity = capacity;
  const price = parseNumberNear(message, ["цена", "стоимост", "чек", "price", "ticket"]);
  if (price) extractedFields.averagePrice = price;
  const employees = parseNumberNear(message, ["сотрудник", "персонал", "работник", "staff", "employees"]);
  if (employees) {
    extractedFields.staffPlan = extractedFields.staffPlan ?? {
      roles: [{ role: "Команда", count: employees, monthlySalaryAmount: 0, monthlySalaryCurrency: "UZS" }]
    };
  }

  if (/опт|базар|маркетплейс|супермаркет|экспорт|доставка|b2b|офис|студент|wholesale|delivery|marketplace/i.test(message)) {
    const channels = new Set(extractedFields.targetCustomers ?? []);
    if (/опт|wholesale/i.test(message)) channels.add("wholesale");
    if (/базар/i.test(message)) channels.add("bazaars");
    if (/маркетплейс|marketplace/i.test(message)) channels.add("marketplaces");
    if (/супермаркет/i.test(message)) channels.add("supermarkets");
    if (/экспорт|export/i.test(message)) channels.add("export");
    if (/доставка|delivery/i.test(message)) channels.add("delivery");
    if (/b2b/i.test(message)) channels.add("b2b_orders");
    if (/офис|студент|office|student/i.test(message)) channels.add("walk_in");
    extractedFields.targetCustomers = [...channels];
  }

  if (/средн.*опыт|есть опыт|some experience/i.test(message)) extractedFields.experienceLevel = "medium";
  if (/больш.*опыт|10 лет|5 лет|high experience/i.test(message)) extractedFields.experienceLevel = "high";
  if (/нет опыт|без опыта|no experience/i.test(message)) extractedFields.experienceLevel = "low";

  if (message.trim().length > 80) {
    extractedFields.sectionNotes = {
      ...(extractedFields.sectionNotes ?? {}),
      businessIdea: extractedFields.sectionNotes?.businessIdea ?? message.trim()
    };
  }

  const updatedProfile = classifyBusiness({
    businessType: extractedFields.businessType,
    businessIdea: extractedFields.businessIdea,
    region: extractedFields.region,
    language: extractedFields.userLanguage,
    answers: extractedFields
  });
  extractedFields.businessProfile = legacyBusinessProfile(updatedProfile);
  if (updatedProfile.importsGoodsOrInputs) extractedFields.rawMaterialSource = extractedFields.rawMaterialSource ?? "import";
  if (updatedProfile.hasCurrencyExposure) extractedFields.supplierCurrency = extractedFields.supplierCurrency ?? "USD";
  template = resolveTemplateForData(extractedFields);

  const missingFields = getMissingFields(extractedFields, template);
  const nextQuestions = getNextFallbackQuestions(extractedFields, { template }).questions.map((question) => ({
    key: question.key,
    question: question.question,
    type: question.type,
    unit: question.unit,
    options: question.options
  }));

  return {
    mode: "fallback",
    detectedSector: template.code,
    confidence: businessType ? 0.78 : 0.58,
    extractedFields,
    missingFields,
    nextQuestions,
    advisorMessage: missingFields.length === 0
      ? "Ключевые данные собраны. Можно рассчитать предварительную финансовую модель и риски."
      : advisorSavedMessage(extractedFields.userLanguage)
  };
}

export function getNextFallbackQuestions(data: StructuredProjectData, options: NextQuestionOptions = {}) {
  const template = resolveTemplate(data, options.template);
  const blocks = template.interviewBlocks;
  const missingFields = getMissingFields(data, template);
  const requiredKeys = new Set(buildInterviewRequiredKeys(template, data));
  const progress = calculateInterviewProgress({ data, template, currentBlockId: options.blockId });
  const completionPct = progress.project.pct;

  const forcedBlock = getBlockById(template, options.blockId);
  if (forcedBlock) {
    const forcedIndex = blocks.findIndex((block) => block.id === forcedBlock.id);
    const requiredVisibleQuestions = forcedBlock.questions.filter((question) => isRequiredQuestion(template, question) && questionIsVisible(question, data));
    const forcedMissing = getVisibleRequiredMissingQuestions(template, forcedBlock, data);
    const nextBlockId = getNextCursorBlockId(data, forcedBlock.id, template) ?? null;
    return {
      block: forcedBlock.name,
      blockId: forcedBlock.id,
      blockDescription: forcedBlock.description,
      step: forcedIndex + 1,
      totalSteps: blocks.length,
      mode: "fallback" as const,
      questions: forcedBlock.questions.filter((question) => questionIsVisible(question, data)),
      requiredVisibleQuestions,
      completionPct,
      projectProgressPct: progress.project.pct,
      blockProgressPct: progress.blocks.find((block) => block.blockId === forcedBlock.id)?.pct ?? 0,
      missingFields,
      canAdvance: forcedMissing.length === 0,
      nextBlockId,
      isInterviewComplete: missingFields.length === 0 && nextBlockId === null,
      isManualBlock: true,
      templateCode: template.code,
      blockStatuses: getInterviewBlockStatuses(template, data, forcedBlock.id)
    };
  }

  const cursorIndex = blocks.findIndex((block) => block.id === data.interviewCursorBlockId);
  const cursorBlock = cursorIndex >= 0 ? blocks[cursorIndex] : undefined;
  const cursorMissing = cursorBlock ? getVisibleRequiredMissingQuestions(template, cursorBlock, data) : [];
  const nextCandidate = cursorMissing.length > 0
    ? { block: cursorBlock as InterviewBlock, index: cursorIndex }
    : getFirstMissingBlockFrom(template, cursorIndex >= 0 ? cursorIndex + 1 : 0, data) ?? getFirstMissingBlockFrom(template, 0, data);

  const currentBlock = nextCandidate?.block ?? blocks[blocks.length - 1];
  const blockIndex = nextCandidate?.index ?? blocks.length - 1;
  const blockMissing = getVisibleRequiredMissingQuestions(template, currentBlock, data);
  const requiredVisibleQuestions = currentBlock.questions.filter((question) => isRequiredQuestion(template, question) && questionIsVisible(question, data));
  const questions = (options.includeAnswered
    ? currentBlock.questions.filter((question) => questionIsVisible(question, data))
    : blockMissing).slice(0, 3);
  const nextBlockId = getNextCursorBlockId(data, currentBlock.id, template) ?? null;

  return {
    block: currentBlock.name,
    blockId: currentBlock.id,
    blockDescription: currentBlock.description,
    step: blockIndex + 1,
    totalSteps: blocks.length,
    mode: "fallback" as const,
    questions,
    requiredVisibleQuestions,
    completionPct,
    missingFields,
    canAdvance: blockMissing.length === 0,
    nextBlockId,
    isInterviewComplete: missingFields.length === 0 && nextBlockId === null,
    isManualBlock: false,
    templateCode: template.code,
    blockStatuses: getInterviewBlockStatuses(template, data, currentBlock.id)
  };
}
