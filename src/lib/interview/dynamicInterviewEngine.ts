import { approvedInterviewBlocks, classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";
import type { DynamicBusinessTemplate } from "../types/sector.ts";
import { answerAliases, buildAnswerMemory, detectMissingAnalysisInputs, isQuestionAlreadyAnswered, type AnswerMemory, type MissingInput } from "./answerMemory.ts";
import type { InterviewBlock, InterviewQuestion, SectorAssumptions, StructuredProjectData } from "../types/project.ts";
import { sampleSpecificQuestionsForProfile } from "./sampleSpecificQuestionLibrary.ts";

const assumptionsByCategory: Record<string, SectorAssumptions> = {
  services: { minViableInvestmentUZS: 90000000, recommendedOwnContributionMinPct: 20, recommendedOwnContributionMaxPct: 35, typicalGrossMarginMinPct: 35, typicalGrossMarginMaxPct: 60, defaultGrossMarginPct: 45, defaultMonthlyFixedCostsUZS: 28000000, defaultVariableCostPct: 35, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 36, defaultLeasingTermMonths: 36, defaultWorkingCapitalMonths: 2, defaultCertificationCostUZS: 5000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 70000000, defaultPremisesSetupCostUZS: 30000000, defaultPackagingSetupCostUZS: 7000000, defaultInitialInventoryCostUZS: 10000000, defaultExpectedUtilizationPct: 65 },
  manufacturing: { minViableInvestmentUZS: 260000000, recommendedOwnContributionMinPct: 25, recommendedOwnContributionMaxPct: 40, typicalGrossMarginMinPct: 22, typicalGrossMarginMaxPct: 38, defaultGrossMarginPct: 32, defaultMonthlyFixedCostsUZS: 45000000, defaultVariableCostPct: 58, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 48, defaultLeasingTermMonths: 48, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 15000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 180000000, defaultPremisesSetupCostUZS: 60000000, defaultPackagingSetupCostUZS: 15000000, defaultInitialInventoryCostUZS: 70000000, defaultExpectedUtilizationPct: 62 },
  retail: { minViableInvestmentUZS: 130000000, recommendedOwnContributionMinPct: 25, recommendedOwnContributionMaxPct: 40, typicalGrossMarginMinPct: 18, typicalGrossMarginMaxPct: 35, defaultGrossMarginPct: 28, defaultMonthlyFixedCostsUZS: 32000000, defaultVariableCostPct: 70, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 36, defaultLeasingTermMonths: 36, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 6000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 50000000, defaultPremisesSetupCostUZS: 35000000, defaultPackagingSetupCostUZS: 8000000, defaultInitialInventoryCostUZS: 80000000, defaultExpectedUtilizationPct: 70 },
  ecommerce: { minViableInvestmentUZS: 80000000, recommendedOwnContributionMinPct: 20, recommendedOwnContributionMaxPct: 35, typicalGrossMarginMinPct: 18, typicalGrossMarginMaxPct: 35, defaultGrossMarginPct: 25, defaultMonthlyFixedCostsUZS: 22000000, defaultVariableCostPct: 68, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 30, defaultLeasingTermMonths: 30, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 5000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 25000000, defaultPremisesSetupCostUZS: 10000000, defaultPackagingSetupCostUZS: 18000000, defaultInitialInventoryCostUZS: 50000000, defaultExpectedUtilizationPct: 70 },
  food_service: { minViableInvestmentUZS: 180000000, recommendedOwnContributionMinPct: 25, recommendedOwnContributionMaxPct: 40, typicalGrossMarginMinPct: 35, typicalGrossMarginMaxPct: 55, defaultGrossMarginPct: 42, defaultMonthlyFixedCostsUZS: 38000000, defaultVariableCostPct: 46, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 42, defaultLeasingTermMonths: 42, defaultWorkingCapitalMonths: 2, defaultCertificationCostUZS: 12000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 90000000, defaultPremisesSetupCostUZS: 60000000, defaultPackagingSetupCostUZS: 12000000, defaultInitialInventoryCostUZS: 25000000, defaultExpectedUtilizationPct: 65 },
  agriculture: { minViableInvestmentUZS: 250000000, recommendedOwnContributionMinPct: 25, recommendedOwnContributionMaxPct: 45, typicalGrossMarginMinPct: 18, typicalGrossMarginMaxPct: 35, defaultGrossMarginPct: 27, defaultMonthlyFixedCostsUZS: 50000000, defaultVariableCostPct: 68, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 48, defaultLeasingTermMonths: 48, defaultWorkingCapitalMonths: 4, defaultCertificationCostUZS: 10000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 180000000, defaultPremisesSetupCostUZS: 80000000, defaultPackagingSetupCostUZS: 12000000, defaultInitialInventoryCostUZS: 90000000, defaultExpectedUtilizationPct: 60 },
  import_export: { minViableInvestmentUZS: 300000000, recommendedOwnContributionMinPct: 30, recommendedOwnContributionMaxPct: 45, typicalGrossMarginMinPct: 15, typicalGrossMarginMaxPct: 30, defaultGrossMarginPct: 22, defaultMonthlyFixedCostsUZS: 35000000, defaultVariableCostPct: 72, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 36, defaultLeasingTermMonths: 36, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 18000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 30000000, defaultPremisesSetupCostUZS: 25000000, defaultPackagingSetupCostUZS: 20000000, defaultInitialInventoryCostUZS: 180000000, defaultExpectedUtilizationPct: 70 },
  logistics: { minViableInvestmentUZS: 180000000, recommendedOwnContributionMinPct: 20, recommendedOwnContributionMaxPct: 35, typicalGrossMarginMinPct: 18, typicalGrossMarginMaxPct: 35, defaultGrossMarginPct: 28, defaultMonthlyFixedCostsUZS: 42000000, defaultVariableCostPct: 62, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 42, defaultLeasingTermMonths: 42, defaultWorkingCapitalMonths: 2, defaultCertificationCostUZS: 8000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 130000000, defaultPremisesSetupCostUZS: 15000000, defaultPackagingSetupCostUZS: 5000000, defaultInitialInventoryCostUZS: 20000000, defaultExpectedUtilizationPct: 68 },
  education: { minViableInvestmentUZS: 70000000, recommendedOwnContributionMinPct: 20, recommendedOwnContributionMaxPct: 35, typicalGrossMarginMinPct: 35, typicalGrossMarginMaxPct: 60, defaultGrossMarginPct: 45, defaultMonthlyFixedCostsUZS: 27000000, defaultVariableCostPct: 35, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 30, defaultLeasingTermMonths: 30, defaultWorkingCapitalMonths: 2, defaultCertificationCostUZS: 6000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 35000000, defaultPremisesSetupCostUZS: 25000000, defaultPackagingSetupCostUZS: 5000000, defaultInitialInventoryCostUZS: 5000000, defaultExpectedUtilizationPct: 65 },
  healthcare: { minViableInvestmentUZS: 300000000, recommendedOwnContributionMinPct: 30, recommendedOwnContributionMaxPct: 45, typicalGrossMarginMinPct: 30, typicalGrossMarginMaxPct: 55, defaultGrossMarginPct: 42, defaultMonthlyFixedCostsUZS: 55000000, defaultVariableCostPct: 42, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 48, defaultLeasingTermMonths: 48, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 25000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 220000000, defaultPremisesSetupCostUZS: 80000000, defaultPackagingSetupCostUZS: 10000000, defaultInitialInventoryCostUZS: 45000000, defaultExpectedUtilizationPct: 60 },
  generic: { minViableInvestmentUZS: 120000000, recommendedOwnContributionMinPct: 20, recommendedOwnContributionMaxPct: 35, typicalGrossMarginMinPct: 18, typicalGrossMarginMaxPct: 38, defaultGrossMarginPct: 28, defaultMonthlyFixedCostsUZS: 25000000, defaultVariableCostPct: 58, defaultLoanAnnualRatePct: 26, defaultLeasingAnnualRatePct: 24, defaultLoanTermMonths: 36, defaultLeasingTermMonths: 36, defaultWorkingCapitalMonths: 3, defaultCertificationCostUZS: 8000000, defaultMoldCostUZS: 0, defaultEquipmentCostUZS: 85000000, defaultPremisesSetupCostUZS: 35000000, defaultPackagingSetupCostUZS: 6000000, defaultInitialInventoryCostUZS: 30000000, defaultExpectedUtilizationPct: 65 }
};

function t(key: string, label: string, question: string, type: InterviewQuestion["type"], extra: Partial<InterviewQuestion> = {}): InterviewQuestion {
  return { key, label, question, type, ...extra };
}
const text = (key: string, label: string, question: string, extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "text", extra);
const textarea = (key: string, label: string, question: string, extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "textarea", extra);
const number = (key: string, label: string, question: string, unit?: string, extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "number", { unit, ...extra });
const select = (key: string, label: string, question: string, options: string[], extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "select", { options, ...extra });
const multi = (key: string, label: string, question: string, options: string[], extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "multiselect", { options, ...extra });
const bool = (key: string, label: string, question: string, extra: Partial<InterviewQuestion> = {}) => t(key, label, question, "boolean", extra);
const staff = () => t("staffPlan", "Команда и зарплаты", "Какие роли сотрудников нужны на старте и какая плановая ежемесячная зарплата по каждой роли?", "staffPlan");

function isManufacturingLikeProfile(profile: BusinessProfile): boolean {
  return profile.category === "manufacturing" || profile.producesGoods === true;
}

function isServiceOrRentalLikeProfile(profile: BusinessProfile): boolean {
  return !isManufacturingLikeProfile(profile) && (
    profile.providesServices === true ||
    profile.rentsAssets === true ||
    profile.usesMobileService === true ||
    profile.capabilities?.rentalOrUsageBasedRevenue === true ||
    profile.operationalModel === "inside_partner_location" ||
    profile.operationalModel === "mobile_service"
  );
}

function sanitizeServiceRentalQuestionText(value: string): string {
  return value
    .replace(/производственная линия/gi, "ключевой актив")
    .replace(/производственной линии/gi, "ключевого актива")
    .replace(/производственную линию/gi, "ключевой актив")
    .replace(/производственное оборудование/gi, "рабочее оборудование")
    .replace(/производственный процесс/gi, "операционный процесс")
    .replace(/производственного процесса/gi, "операционного процесса")
    .replace(/процесс обслуживания\/производства/gi, "процесс обслуживания")
    .replace(/процесс работы\/производства/gi, "процесс работы")
    .replace(/обслуживания\/производства/gi, "обслуживания")
    .replace(/производства\/обслуживания/gi, "обслуживания")
    .replace(/сырь[её]м?/gi, "расходными материалами")
    .replace(/сырь[её]/gi, "расходные материалы")
    .replace(/сырья/gi, "расходных материалов")
    .replace(/выпуск продукции/gi, "объём заказов или услуг")
    .replace(/выпуска продукции/gi, "объёма заказов или услуг")
    .replace(/сменная производительность/gi, "сменная загрузка")
    .replace(/минимальная партия/gi, "минимальный заказ")
    .replace(/минимальной партии/gi, "минимального заказа")
    .replace(/партия/gi, "заказ")
    .replace(/партии/gi, "заказы")
    .replace(/цеха\/производства/gi, "рабочей зоны")
    .replace(/цех\/производство/gi, "рабочая зона")
    .replace(/factory/gi, "workspace")
    .replace(/manufacturing/gi, "service operations")
    .replace(/production line/gi, "key asset")
    .replace(/production capacity/gi, "operating capacity")
    .replace(/batch production/gi, "service batch")
    .replace(/raw materials/gi, "consumables");
}

function applyQuestionSpecificityGuardrails(blocks: InterviewBlock[], profile: BusinessProfile): InterviewBlock[] {
  if (!isServiceOrRentalLikeProfile(profile)) return blocks;

  const sanitizeQuestion = (question: InterviewQuestion): InterviewQuestion => {
    const sanitized: InterviewQuestion = {
      ...question,
      label: sanitizeServiceRentalQuestionText(question.label),
      question: sanitizeServiceRentalQuestionText(question.question),
      placeholder: typeof question.placeholder === "string" ? sanitizeServiceRentalQuestionText(question.placeholder) : question.placeholder
    };

    if (question.key === "leasingAssetType" && Array.isArray(question.options)) {
      sanitized.options = question.options.filter((option) => option !== "production_line");
    }

    return sanitized;
  };

  return blocks.map((item) => ({
    ...item,
    name: sanitizeServiceRentalQuestionText(item.name),
    description: sanitizeServiceRentalQuestionText(item.description),
    questions: item.questions.map(sanitizeQuestion)
  }));
}

function showIf(question: InterviewQuestion, condition: InterviewQuestion["showIf"]): InterviewQuestion {
  return { ...question, showIf: condition };
}

const hostBusinessTrafficFormats = ["one_box_inside_large_service", "one_box_inside_larger_service", "one_box_inside_partner_service", "inside_partner_location"];
const autoServiceFormatOptions = ["one_box_inside_large_service", "standalone_service", "mobile_service", "tire_service", "detailing", "diagnostics", "other"];

function showIfHostBusinessTraffic(question: InterviewQuestion): InterviewQuestion {
  return showIf(question, { autoServiceFormat: hostBusinessTrafficFormats });
}

function showIfNotHostBusinessTraffic(question: InterviewQuestion): InterviewQuestion {
  return showIf(question, { field: "autoServiceFormat", operator: "not_equals", value: hostBusinessTrafficFormats });
}

function showIfMobileService(question: InterviewQuestion): InterviewQuestion {
  return showIf(question, { autoServiceFormat: "mobile_service" });
}

const rentPremisesStatuses = [
  "rent",
  "sublease",
  "street_retail_rent",
  "mall_point",
  "rented_space",
  "office_and_storage",
  "small_office",
  "storage_only"
];

function showIfRent(question: InterviewQuestion): InterviewQuestion {
  return showIf(question, { premisesStatus: rentPremisesStatuses });
}

const rentStatusQuestionKeys = new Set(["premisesStatus", "rentalPremisesStatus"]);

function showIfRentForStatusField(question: InterviewQuestion, statusKey: string): InterviewQuestion {
  return showIf(question, { [statusKey]: rentPremisesStatuses });
}

function rentQuestionForStatusField(statusKey: string): InterviewQuestion {
  return sg(showIfRentForStatusField(number(
    "monthlyRent",
    "Аренда в месяц",
    "Какая ежемесячная сумма аренды/субаренды помещения, склада, площадки или точки? Если договор еще не подписан, укажите ожидаемый лимит аренды.",
    "UZS",
    { optional: false, required: true, isRequired: true }
  ), statusKey), "premises_rent");
}

function normalizeMonthlyRentQuestion(question: InterviewQuestion, statusKey: string): InterviewQuestion {
  return sg(showIfRentForStatusField({
    ...question,
    optional: false,
    required: true,
    isRequired: true
  }, statusKey), "premises_rent");
}

function questionHasRentStatusOption(question: InterviewQuestion): boolean {
  return Boolean(question.options?.some((option) => rentPremisesStatuses.includes(option)));
}

function ensureConditionalMonthlyRentQuestions(blocks: InterviewBlock[]): InterviewBlock[] {
  return blocks.map((item) => {
    const questions = [...item.questions];
    const rentStatusIndex = questions.findIndex((question) => rentStatusQuestionKeys.has(question.key) && questionHasRentStatusOption(question));
    if (rentStatusIndex < 0) return item;

    const statusKey = questions[rentStatusIndex].key;
    const existingRentIndex = questions.findIndex((question) => question.key === "monthlyRent");
    if (existingRentIndex >= 0) {
      questions[existingRentIndex] = normalizeMonthlyRentQuestion(questions[existingRentIndex], statusKey);
      return { ...item, questions: dedupeQuestions(questions) };
    }

    questions.splice(rentStatusIndex + 1, 0, rentQuestionForStatusField(statusKey));
    return { ...item, questions: dedupeQuestions(questions) };
  });
}

function block(id: string, name: string, description: string, questions: InterviewQuestion[]): InterviewBlock {
  return { id, name, description, questions };
}

function commonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const goodsOrService = profile.producesGoods ? "Что именно будет производиться?" : profile.sellsGoods && !profile.providesServices ? "Какие товарные категории будете продавать?" : "Какие услуги или продукты будет предлагать бизнес?";
  const usesServicePremisesQuestion = profile.category === "services" && (profile.operationalModel === "mobile_service" || profile.subcategory === "cleaning_service");
  const premisesStatusQuestion = usesServicePremisesQuestion
    ? select("premisesStatus", "Офис/склад", "Нужно ли помещение для офиса, склада инвентаря или хранения химии?", ["no_office_needed", "storage_only", "small_office", "office_and_storage", "not_decided"])
    : select("premisesStatus", "Помещение", "Какой статус помещения/площадки?", ["owned", "rent", "searching", "sublease", "land_required", "online_only", "other"]);
  return [
    block("business_idea", "Стартовая бизнес-идея", "Два универсальных вопроса и регион запуска.", [
      text("businessType", "Что за бизнес", "Что за бизнес вы планируете открыть или развивать?", { placeholder: "Например: автосервис, кафе, швейное производство, магазин косметики" }),
      textarea("businessIdea", "Описание бизнес-идеи", "Опишите бизнес-идею в 2-5 предложениях: что продаете/оказываете, кто клиент, где будет работать бизнес, что уже есть и что нужно профинансировать."),
      text("region", "Регион", "В каком регионе Узбекистана будет работать бизнес?"),
      text("district", "Район/город", "В каком районе или городе будет работать бизнес?", { optional: true }),
      text("productOrService", profile.producesGoods ? "Продукт" : profile.sellsGoods ? "Товар/услуга" : "Услуга", goodsOrService),
      textarea("sectionNotes.businessIdea", "Контекст", "Какие важные детали уже известны по клиентам, месту, конкурентам или запуску?", { optional: true })
    ]),
    block("market_sales", "Клиенты, спрос и продажи", "Проверяем спрос, каналы продаж и цену.", [
      multi("targetCustomers", "Основные клиенты", "Кто основные клиенты или покупатели?", profile.hasB2BContracts ? ["small_businesses", "corporate_clients", "wholesale_buyers", "contract_clients", "repeat_clients", "other"] : ["individuals", "families", "women", "men", "students", "nearby_residents", "online_customers", "repeat_clients", "other"]),
      multi("customerAcquisitionChannels", "Каналы продаж", "Через какие каналы будут приходить клиенты или заказы?", ["instagram", "telegram", "website", "marketplace", "maps_2gis_google_yandex", "recommendations", "partners", "repeat_clients", "other"], { optional: true }),
      number("monthlyCapacity", profile.providesServices && !profile.producesGoods ? "Клиентов/заказов в месяц" : "Объем в месяц", "Какой реалистичный месячный объем продаж, заказов, клиентов или выпуска?", profile.providesServices ? "клиентов/мес." : "ед./мес."),
      number("averagePrice", profile.providesServices && !profile.producesGoods ? "Средний чек" : "Средняя цена", "Какая ожидаемая средняя цена/средний чек?", "UZS"),
      bool("hasBuyerAgreements", "Подтверждение спроса", "Есть ли предварительные договоренности, заявки, письма о намерениях или тестовые продажи?", { optional: true }),
      textarea("sectionNotes.salesMarketing", "Маркетинг и спрос", "Опишите конкурентов, каналы привлечения, цены и доказательства спроса.", { optional: true })
    ]),
    block("premises", "Помещение и инфраструктура", "Проверяем локацию, аренду, инфраструктуру и ограничения.", [
      premisesStatusQuestion,
      showIfRent(number("monthlyRent", "Аренда в месяц", "Какая ежемесячная сумма аренды/субаренды?", "UZS", { optional: true })),
      number("leaseTermMonths", "Срок договора", "На какой срок планируется договор аренды/субаренды?", "мес.", { optional: true }),
      bool("infrastructureReady", "Инфраструктура", "Готовы ли электричество, вода, вентиляция, интернет, склад или подъезд?", { optional: true }),
      number("premisesAreaSqm", "Площадь", "Какая ориентировочная площадь помещения/площадки?", "м2", { optional: true }),
      textarea("sectionNotes.premisesInfrastructure", "Описание помещения", "Опишите условия помещения, инфраструктуру, срок договора и ограничения.", { optional: true })
    ]),
    block("equipment", "Оборудование и запуск", "Оцениваем оборудование, поставщиков, сервис и сроки.", [
      select("equipmentCondition", "Оборудование", "Какое оборудование нужно и в каком состоянии оно планируется?", ["new", "used", "mixed", "not_selected", "not_needed", "other"]),
      textarea("equipmentList", "Список оборудования", "Перечислите ключевое оборудование, инвентарь или цифровые инструменты."),
      bool("supplierSelected", "Поставщик выбран", "Выбран ли поставщик оборудования/ключевых услуг?", { optional: true }),
      bool("supplierOfferAvailable", "Коммерческое предложение", "Есть ли КП/смета/ссылка на цены?", { optional: true }),
      number("equipmentCapex", "Оборудование CapEx", "Сколько ориентировочно стоит оборудование и ключевой инвентарь?", "UZS", { optional: true }),
      textarea("sectionNotes.equipment", "Детали оборудования", "Опишите поставщика, гарантию, сервис, монтаж, обучение и сроки запуска.", { optional: true })
    ]),
    block("staff", "Команда и операционная модель", "Оцениваем персонал, качество и ежедневный процесс.", [
      staff(),
      bool("qualityControlPlan", "Контроль качества", "Есть ли план контроля качества продукта или услуги?", { optional: true }),
      textarea("sectionNotes.productionCapacity", "Операционный процесс", profile.producesGoods ? "Опишите режим работы, производственный процесс, узкие места и загрузку." : "Опишите режим работы, процесс обслуживания, узкие места и загрузку.", { optional: true })
    ]),
    block("finance", "Финансирование и оборотный капитал", "Собственные средства, кредит, лизинг, оборотка и залог.", [
      number("ownContributionAmount", "Собственные средства", "Сколько собственных средств готовы вложить?", undefined),
      select("ownContributionCurrency", "Валюта собственных средств", "В какой валюте указаны собственные средства?", ["UZS", "USD"]),
      select("creditNeeded", "Кредит", "Нужен ли кредит?", ["yes", "no", "unknown"]),
      showIf(number("requestedLoanAmount", "Сумма кредита", "Какая сумма кредита нужна?", undefined), { creditNeeded: "yes" }),
      showIf(select("requestedLoanCurrency", "Валюта кредита", "В какой валюте указан кредит?", ["UZS", "USD"]), { creditNeeded: "yes" }),
      showIf(number("loanTermMonths", "Срок кредита", "На какой срок нужен кредит?", "мес."), { creditNeeded: "yes" }),
      showIf(number("loanAnnualRatePct", "Годовая ставка кредита", "Какая годовая ставка кредита? Если банк еще не дал ставку, укажите ожидаемую.", "%"), { creditNeeded: "yes" }),
      showIf(select("loanRepaymentType", "Тип погашения", "Какой тип погашения использовать?", ["annuity", "equal_principal"]), { creditNeeded: "yes" }),
      showIf(textarea("loanPurpose", "Цель кредита", "На что именно нужен кредит?"), { creditNeeded: "yes" }),
      showIf(bool("collateralAvailable", "Залог", "Есть ли потенциальный залог?"), { creditNeeded: "yes" }),
      showIf(text("collateralType", "Тип залога", "Какой залог можно предложить? Например: автомобиль, оборудование, недвижимость, поручительство."), { collateralAvailable: true }),
      showIf(number("collateralEstimatedValue", "Оценочная стоимость залога", "Какую примерную стоимость залога вы оцениваете? Можно указать в UZS или USD — система пересчитает в сумы по курсу ЦБ.", "UZS"), { collateralAvailable: true }),
      showIf(bool("collateralDocumentsAvailable", "Документы по залогу", "Есть ли документы собственности/техпаспорт/оценка или другой подтверждающий документ?", { optional: true }), { collateralAvailable: true }),
      bool("needsLeasing", "Лизинг", "Планируете ли лизинг оборудования или транспорта?", { optional: true }),
      number("workingCapitalBufferMonths", "Запас оборотки", "На сколько месяцев фиксированных расходов нужен буфер?", "мес.", { optional: true }),
      textarea("sectionNotes.finance", "Финансовые детали", "Опишите структуру финансирования, кредит/лизинг, залог и оборотный капитал.", { optional: true })
    ]),
    block("compliance", "Документы, разрешения и риски", "Фиксируем документы, регуляторные требования и опыт команды.", [
      select("certificationAwareness", "Понимание документов", "Насколько понятны документы, разрешения и отраслевые требования?", ["aware", "partly_aware", "not_aware"]),
      bool("sanitaryRequirementsKnown", "Санитарные требования", "Если применимо, понятны ли санитарные требования?", { optional: !profile.hasSanitaryRequirements }),
      bool("hasAccountantOrConsultant", "Консультант/бухгалтер", "Есть ли бухгалтер, юрист или профильный консультант?", { optional: true }),
      select("experienceLevel", "Опыт", "Какой опыт у команды в этой сфере?", ["low", "medium", "high"]),
      textarea("requiredPermits", "Документы и разрешения", "Какие документы, договоры, разрешения или уведомления уже известны?", { optional: true }),
      textarea("sectionNotes.complianceExperience", "Compliance-комментарий", "Опишите, какие требования нужно проверить до запуска.", { optional: true })
    ])
  ];
}

function cleaningServiceSpecific(): InterviewBlock[] {
  return [
    block("cleaning_service_model", "Клининг: формат и модель услуги", "Фиксируем виды уборки, модель выездной команды, B2B/B2C и географию обслуживания.", [
      multi("cleaningServiceTypes", "Формат услуг", "Какой формат клининговых услуг планируется?", ["apartment_cleaning", "house_cleaning", "office_cleaning", "commercial_cleaning", "deep_cleaning", "post_construction_cleaning", "carpet_furniture_cleaning", "window_cleaning", "disinfection", "mixed", "other"]),
      multi("cleaningBusinessModel", "Модель работы", "Как будет организована услуга?", ["mobile_team", "on_site_team", "b2b_contracts", "b2c_orders", "subscription_cleaning", "mixed"]),
      text("serviceArea", "Зона обслуживания", "В каком городе/районе будет зона обслуживания?"),
      bool("hasInitialClients", "Первые клиенты", "Есть ли уже первые клиенты или договоренности?", { optional: true }),
      select("brandOrPartnerModel", "Бренд или партнеры", "Будет ли работа под собственным брендом или через партнеров/агрегаторы?", ["own_brand", "partners", "aggregators", "mixed", "not_decided"], { optional: true })
    ]),
    block("cleaning_clients_contracts", "Клиенты, договоры и каналы продаж", "Разбираем целевых клиентов, каналы привлечения, оплату, предоплату и гарантии.", [
      multi("targetCustomers", "Основные клиенты", "Кто основные клиенты?", ["apartments", "private_houses", "offices", "shops", "cafes_restaurants", "warehouses", "construction_companies", "property_managers", "corporate_clients", "repeat_clients", "other"]),
      multi("customerAcquisitionChannels", "Каналы привлечения", "Какие каналы привлечения клиентов?", ["instagram", "telegram", "website", "maps_2gis_google_yandex", "recommendations", "b2b_sales", "partners", "aggregators", "repeat_clients", "other"]),
      bool("b2bAgreements", "B2B-договоренности", "Есть ли предварительные договоренности с B2B-клиентами?", { optional: true }),
      select("contractModel", "Модель договоров", "Будут ли регулярные договоры или разовые заказы?", ["one_time_orders", "regular_contracts", "subscription", "mixed", "not_decided"]),
      select("clientPaymentTerm", "Срок оплаты", "Как быстро клиенты оплачивают услуги?", ["immediate", "days_7", "days_15", "days_30", "days_60_plus"]),
      bool("prepaymentRequired", "Предоплата", "Будет ли предоплата?", { optional: true }),
      select("clientPaymentFlow", "Кто принимает оплату", "Кто принимает оплату?", ["direct_to_entrepreneur", "administrator", "online_payment", "mixed", "not_decided"], { optional: true }),
      textarea("warrantyPolicy", "Гарантии", "Какие гарантии даются клиенту?", { optional: true })
    ]),
    block("cleaning_location_mobility", "Локация, выезд и зона обслуживания", "Уточняем офис/склад, хранение химии, транспорт и ограничения по времени работ.", [
      select("premisesStatus", "Офис/склад", "Нужен ли офис/склад или бизнес будет работать без помещения?", ["no_office_needed", "storage_only", "small_office", "office_and_storage", "not_decided"]),
      textarea("storageNeeds", "Хранение", "Где будет храниться оборудование и химия?"),
      select("transportNeeds", "Транспорт", "Нужен ли транспорт для команды?", ["not_needed", "own_car", "rented_vehicle", "taxi_delivery", "mixed", "not_decided"]),
      select("serviceZone", "Зона обслуживания", "Какая зона обслуживания?", ["one_district", "whole_city", "city_and_region", "multiple_cities"]),
      select("teamTransportModel", "Логистика команды", "Как команда будет добираться до объектов?", ["own_transport", "public_transport", "taxi", "client_location_team", "mixed", "not_decided"]),
      textarea("clientTimeRestrictions", "Ограничения по времени", "Есть ли ограничения по времени работы клиентов?", { optional: true })
    ]),
    block("cleaning_equipment_consumables", "Оборудование, инвентарь и химия", "Собираем оборудование, расходники, поставщиков, валюту и безопасное хранение химии.", [
      multi("equipmentList", "Оборудование", "Какое оборудование нужно?", ["professional_vacuums", "wet_vacuums", "steam_cleaner", "floor_scrubber", "ladders", "cleaning_carts", "inventory_tools", "uniforms", "ppe", "car_delivery", "other"]),
      select("equipmentCondition", "Состояние оборудования", "Оборудование новое, б/у или смешанное?", ["new", "used", "mixed", "not_selected"]),
      bool("supplierSelected", "Поставщик оборудования", "Есть ли поставщик оборудования?", { optional: true }),
      bool("supplierOfferAvailable", "КП/смета", "Есть ли КП/смета?", { optional: true }),
      multi("cleaningChemicals", "Постоянные расходники", "Какие расходники нужны постоянно?", ["cleaning_agents", "disinfectants", "gloves", "masks", "wipes", "trash_bags", "inventory_tools", "uniforms", "other"]),
      select("chemicalsSource", "Поставщики химии", "Поставщики химии локальные, импортные или смешанные?", ["local", "import", "mixed", "unknown"]),
      select("supplierCurrency", "Валюта поставщика", "Есть ли валютная зависимость?", ["UZS", "USD", "EUR", "CNY", "RUB", "mixed", "unknown"], { optional: true }),
      bool("foreignCurrencyPurchases", "Валютные закупки", "Будут ли закупки в иностранной валюте?", { optional: true }),
      textarea("chemicalStorageSafety", "Безопасное хранение", "Как будет организовано безопасное хранение химии?"),
      bool("alternativeSuppliers", "Альтернативные поставщики", "Есть ли альтернативные поставщики?", { optional: true })
    ]),
    block("cleaning_staff_quality", "Команда, график и контроль качества", "Планируем состав бригад, график, supervisor, обучение и контроль результата.", [
      staff(),
      number("teamSizePerOrder", "Размер бригады", "Сколько человек в одной бригаде?", "чел."),
      number("dailyOrdersCapacity", "Объектов в день", "Сколько объектов бригада может обслужить в день?", "объектов/день"),
      textarea("workingSchedule", "График", "Какой график работы?"),
      bool("supervisorNeeded", "Supervisor/бригадир", "Нужен ли supervisor/бригадир?", { optional: true }),
      multi("qualityControlPlan", "Контроль качества", "Как будет контролироваться качество?", ["checklists", "before_after_photos", "client_acceptance", "repeat_cleaning_for_complaint", "supervisor", "other"]),
      bool("staffTrainingSafety", "Обучение безопасности", "Есть ли обучение персонала по химии и безопасности?", { optional: true }),
      textarea("staffTurnoverMitigation", "Текучка персонала", "Как будет снижаться риск текучки персонала?", { optional: true })
    ]),
    block("cleaning_pricing_capacity", "Ценообразование и пропускная способность", "Фиксируем модель цены, средний чек, площадь, число заказов и маржу.", [
      select("pricingModel", "Модель цены", "Как считается цена?", ["per_object", "per_sqm", "per_hour", "package_price", "negotiated_price", "subscription", "mixed"]),
      number("averageCleaningTicket", "Средний чек", "Средний чек за один заказ.", "UZS"),
      number("averageCleaningAreaSqm", "Средняя площадь", "Средняя площадь уборки.", "м2", { optional: true }),
      number("firstMonthOrdersPerDay", "Заказов в день на старте", "Сколько заказов в день планируется на старте?", "заказов/день"),
      number("stableOrdersPerDay", "Заказов в день стабильно", "Сколько заказов в день после стабильной загрузки?", "заказов/день"),
      number("repeatOrdersPct", "Повторные заказы", "Какой % заказов будет повторным?", "%", { optional: true }),
      number("costPerOrder", "Себестоимость заказа", "Какая себестоимость одного заказа?", "UZS", { optional: true }),
      number("grossMarginPct", "Gross margin", "Какой плановый gross margin?", "%", { optional: true })
    ]),
    block("cleaning_documents_safety", "Документы, безопасность и ответственность", "Проверяем форму бизнеса, договоры, акты, ответственность за имущество, оформление персонала и правила работы с химией.", [
      select("businessLegalForm", "Форма бизнеса", "Какая форма бизнеса планируется?", ["individual_entrepreneur", "llc", "self_employed", "not_decided"]),
      bool("clientContracts", "Договоры", "Будут ли договоры с клиентами?"),
      bool("workCompletionActs", "Акты выполненных работ", "Будут ли акты выполненных работ?", { optional: true }),
      textarea("damageLiability", "Ответственность за имущество", "Кто несет ответственность за повреждение имущества клиента?"),
      bool("liabilityInsurance", "Страховка ответственности", "Нужна ли страховка ответственности?", { optional: true }),
      textarea("employeeFormalization", "Оформление сотрудников", "Как оформляются сотрудники?"),
      bool("chemicalSafetyRules", "Правила по химии", "Есть ли правила безопасного использования химии?"),
      textarea("chemicalStorageSafety", "Хранение химии", "Как хранится химия?"),
      bool("sanitaryRequirementsKnown", "Санитарные/экологические требования", "Нужны ли санитарные/экологические проверки для выбранных видов услуг?", { optional: true }),
      textarea("requiredPermits", "Разрешения", "Если будет дезинфекция или работа с опасными средствами — какие разрешения нужно проверить?", { optional: true })
    ])
  ];
}


function carWashSpecific(): InterviewBlock[] {
  return [
    block("car_wash_format", "Автомойка: формат и модель", "Фиксируем формат автомойки, виды услуг, поток машин и модель продаж.", [
      select("carWashFormat", "Формат автомойки", "Какой формат автомойки вы планируете?", ["manual_wash", "self_service_wash", "automatic_tunnel", "detailing_wash", "mobile_wash", "mixed", "other"]),
      multi("washServiceTypes", "Виды услуг", "Какие услуги будут оказываться?", ["exterior_wash", "interior_cleaning", "complex_wash", "dry_cleaning_salon", "polishing", "engine_wash", "wax_protection", "fleet_wash", "subscription_wash", "other"]),
      select("customerFlowModel", "Модель потока", "Как клиенты будут приезжать: по живой очереди, записи, B2B-договорам или смешанно?", ["walk_in", "booking", "b2b_contracts", "subscription", "mixed"]),
      textarea("carWashPositioning", "Позиционирование", "Чем автомойка будет отличаться: скорость, качество, цена, локация, премиум-услуги или B2B-пакеты?", { optional: true })
    ]),
    block("car_wash_location_infrastructure", "Автомойка: локация, вода и инфраструктура", "Проверяем помещение/площадку, трафик, воду, слив, электричество и ограничения арендодателя.", [
      select("premisesStatus", "Помещение/площадка", "Где будет расположена автомойка?", ["owned", "rent", "sublease", "searching", "not_decided"]),
      number("premisesAreaSqm", "Площадь", "Какая площадь помещения или площадки для автомойки?", "м2", { optional: true }),
      textarea("locationTraffic", "Трафик и окружение", "Опишите локацию: рядом дорога, парковка, АЗС, жилой массив, офисы, ТЦ или автопарк?"),
      select("waterSource", "Источник воды", "Как будет обеспечена вода для мойки?", ["central_water", "well_water", "delivered_water", "recycled_water", "not_decided"]),
      bool("waterDrainageReady", "Слив и канализация", "Есть ли готовый слив/канализация, подходящие для автомойки?"),
      textarea("wastewaterHandling", "Сточные воды", "Как будет организована фильтрация, сбор и отведение сточных вод после мойки?"),
      bool("powerSupplyReady", "Электричество", "Достаточно ли электрической мощности для аппаратов высокого давления, пылесосов и освещения?", { optional: true }),
      textarea("landlordRestrictions", "Ограничения", "Есть ли ограничения арендодателя или соседей по шуму, воде, химии, графику работы и вывеске?", { optional: true })
    ]),
    block("car_wash_services_capacity", "Автомойка: пропускная способность", "Считаем посты, рабочие дни, длительность услуг, автомобили в день и узкие места.", [
      number("washBaysCount", "Количество постов", "Сколько моечных постов будет на старте?", "постов"),
      number("workingDaysPerMonth", "Рабочие дни", "Сколько дней в месяц автомойка будет работать?", "дней/мес."),
      number("workingHoursPerDay", "Часы работы", "Сколько часов в день будет работать автомойка?", "часов/день"),
      number("averageServiceDurationMinutes", "Средняя длительность", "Сколько минут занимает средняя мойка одного автомобиля?", "мин."),
      number("carsPerDayStart", "Авто в день на старте", "Сколько автомобилей в день ожидается в первый месяц?", "авто/день"),
      number("carsPerDayStable", "Авто в день стабильно", "Сколько автомобилей в день ожидается после выхода на стабильную загрузку?", "авто/день"),
      textarea("capacityBottleneck", "Узкое место", "Что будет ограничивать рост: количество постов, вода, персонал, очередь, локация или оборудование?", { optional: true })
    ]),
    block("car_wash_equipment_chemicals", "Автомойка: оборудование и химия", "Собираем оборудование, автохимию, поставщиков, сервис и расходы на обслуживание.", [
      multi("carWashEquipment", "Оборудование", "Какое оборудование нужно для запуска автомойки?", ["high_pressure_washer", "foam_generator", "vacuum_cleaner", "compressor", "water_filter", "water_recycling_system", "drying_equipment", "pos_cash_register", "cctv", "signage", "other"]),
      select("equipmentCondition", "Состояние оборудования", "Оборудование будет новым, б/у или смешанным?", ["new", "used", "mixed", "not_selected"]),
      bool("supplierSelected", "Поставщик выбран", "Выбран ли поставщик оборудования и автохимии?", { optional: true }),
      bool("supplierOfferAvailable", "КП/смета", "Есть ли коммерческое предложение или смета по оборудованию/монтажу?", { optional: true }),
      multi("washChemicals", "Автохимия и расходники", "Какие расходники нужны постоянно?", ["shampoo", "active_foam", "wax", "interior_cleaners", "towels_microfiber", "water_filters", "gloves_ppe", "packaging_consumables", "other"]),
      select("chemicalsSource", "Поставщики химии", "Автохимия будет локальной, импортной или смешанной?", ["local", "import", "mixed", "unknown"]),
      bool("alternativeSuppliers", "Альтернативные поставщики", "Есть ли 2-3 альтернативных поставщика оборудования/химии?", { optional: true }),
      textarea("equipmentServiceSupport", "Сервис оборудования", "Кто будет обслуживать аппараты высокого давления, насосы, фильтры и пылесосы?", { optional: true })
    ]),
    block("car_wash_clients_pricing", "Автомойка: клиенты, продажи и цены", "Уточняем клиентов, каналы привлечения, средний чек, повторные визиты и B2B-договоры.", [
      multi("targetCustomers", "Клиенты", "Кто основные клиенты автомойки?", ["private_car_owners", "taxi_drivers", "corporate_fleets", "delivery_fleets", "car_dealers", "nearby_residents", "office_workers", "repeat_clients", "other"]),
      multi("customerAcquisitionChannels", "Каналы привлечения", "Какие каналы будут привлекать клиентов?", ["road_signage", "maps_2gis_google_yandex", "instagram", "telegram", "recommendations", "b2b_sales", "partnerships", "subscription", "other"]),
      bool("b2bFleetAgreements", "B2B/автопарки", "Есть ли предварительные договоренности с таксопарками, доставкой, компаниями или автодилерами?", { optional: true }),
      select("pricingModel", "Модель цены", "Как будет считаться цена услуги?", ["per_car", "service_package", "subscription", "fleet_contract", "mixed"]),
      number("averageWashTicket", "Средний чек", "Какой ожидаемый средний чек за одну мойку/заказ?", "UZS"),
      number("repeatOrdersPct", "Повторные клиенты", "Какой процент клиентов будет возвращаться регулярно?", "%", { optional: true }),
      textarea("warrantyPolicy", "Гарантии и претензии", "Что делаете, если клиент недоволен качеством мойки или повреждено имущество?", { optional: true })
    ]),
    block("car_wash_staff_quality", "Автомойка: команда и качество", "Планируем мойщиков, администратора, график, обучение, чек-листы и контроль качества.", [
      staff(),
      number("teamSizePerShift", "Смена", "Сколько сотрудников нужно в одной смене?", "чел."),
      textarea("workingSchedule", "График", "Какой график работы и сколько смен планируется?"),
      bool("administratorNeeded", "Администратор", "Нужен ли администратор/кассир для приема клиентов и контроля очереди?", { optional: true }),
      multi("qualityControlPlan", "Контроль качества", "Как будет контролироваться качество мойки?", ["checklists", "client_acceptance", "before_after_photos", "camera_control", "supervisor", "repeat_service_for_complaint", "other"]),
      bool("staffTrainingSafety", "Обучение", "Будет ли обучение персонала по оборудованию, химии, безопасности и общению с клиентами?", { optional: true })
    ]),
    block("car_wash_documents_environment", "Автомойка: документы, безопасность и экология", "Проверяем регистрацию, договор аренды, кассу, трудовые документы, охрану труда, воду, слив и автохимию.", [
      select("businessLegalForm", "Форма бизнеса", "Какая форма бизнеса планируется?", ["individual_entrepreneur", "llc", "self_employed", "not_decided"]),
      bool("clientContracts", "B2B-договоры", "Будут ли договоры и акты с корпоративными клиентами/автопарками?", { optional: true }),
      bool("cashRegisterNeeded", "Касса/оплата", "Планируется ли онлайн-касса, терминал или безналичная оплата?", { optional: true }),
      textarea("requiredPermits", "Что проверить по документам", "Какие документы, требования по воде/сливу, охране труда, пожарной безопасности и договору аренды уже известны?"),
      bool("chemicalSafetyRules", "Правила химии", "Есть ли правила безопасного хранения и использования автохимии?"),
      bool("sanitaryRequirementsKnown", "Санитарные/экологические требования", "Проверены ли требования по сточным водам, фильтрации, хранению химии и условиям помещения?", { optional: true }),
      textarea("damageLiability", "Ответственность", "Кто отвечает за повреждение автомобиля или имущества клиента и как это фиксируется?", { optional: true })
    ])
  ];
}


function toolEquipmentRentalSpecific(): InterviewBlock[] {
  return [
    block("tool_rental_inventory", "Аренда инструмента: парк и категории", "Фиксируем, какие инструменты сдаются, сколько единиц будет на старте, стоимость парка и ограничения по износу.", [
      multi("rentalToolCategories", "Категории инструмента", "Какие категории инструмента и оборудования будете сдавать в аренду?", ["power_tools", "construction_equipment", "welding_equipment", "concrete_mixers", "grinders", "drills_perforators", "ladders_scaffolding", "garden_tools", "generators", "other"]),
      number("rentalFleetSize", "Количество единиц", "Сколько единиц инструмента/оборудования будет в арендном парке на старте?", "ед."),
      textarea("rentalEquipmentList", "Состав парка", "Перечислите основные позиции: перфораторы, шлифмашины, сварочные аппараты, бетономешалки, генераторы и т.д."),
      select("equipmentCondition", "Состояние парка", "Инструмент будет новым, б/у или смешанным?", ["new", "used", "mixed", "not_selected"]),
      bool("supplierSelected", "Поставщик выбран", "Выбран ли поставщик инструмента/оборудования?", { optional: true }),
      bool("supplierOfferAvailable", "КП/смета", "Есть ли коммерческие предложения, прайс-листы или смета закупки?", { optional: true }),
      number("equipmentCapex", "Стоимость парка", "Сколько стоит закупка стартового парка инструмента и оборудования?", "UZS", { optional: true })
    ]),
    block("tool_rental_clients_pricing", "Аренда инструмента: клиенты, цена и загрузка", "Считаем клиентов, каналы продаж, модель тарифа, средний чек, загрузку парка и повторные аренды.", [
      multi("rentalTargetCustomers", "Клиенты", "Кто основные клиенты сервиса аренды?", ["private_masters", "repair_crews", "small_construction_companies", "contractors", "homeowners", "b2b_contracts", "repeat_clients", "other"]),
      multi("customerAcquisitionChannels", "Каналы продаж", "Откуда будут приходить клиенты?", ["telegram", "instagram", "website", "maps_2gis_google_yandex", "recommendations", "b2b_sales", "partnerships", "walk_in", "other"]),
      select("rentalPricingModel", "Модель тарифа", "Как будет считаться цена аренды?", ["per_hour", "per_day", "per_week", "monthly_subscription", "deposit_plus_rent", "mixed"]),
      number("averageRentalTicket", "Средний чек аренды", "Какой средний чек одной аренды/заказа?", "UZS"),
      number("rentalOrdersPerMonth", "Заказов в месяц", "Сколько заказов аренды планируется в месяц после запуска?", "заказов/мес."),
      number("utilizationRatePct", "Загрузка парка", "Какую среднюю загрузку парка инструмента планируете?", "%", { optional: true }),
      bool("hasBuyerAgreements", "Первые договоренности", "Есть ли первые заявки, постоянные мастера, бригады или компании?", { optional: true })
    ]),
    block("tool_rental_location_operations", "Аренда инструмента: пункт выдачи, доставка и учет", "Уточняем помещение, склад, выдачу/возврат, доставку, учет инструмента и контроль состояния.", [
      select("rentalPremisesStatus", "Пункт выдачи/склад", "Где будет храниться и выдаваться инструмент?", ["owned", "rent", "sublease", "storage_pickup_only", "searching", "not_decided"]),
      number("premisesAreaSqm", "Площадь", "Какая площадь нужна для склада/пункта выдачи?", "м2", { optional: true }),
      bool("rentalInfrastructureReady", "Инфраструктура", "Готовы ли электричество, охрана, стеллажи, зона проверки и подъезд для клиентов/доставки?", { optional: true }),
      staff(),
      select("deliveryModel", "Доставка", "Как будет организована доставка инструмента клиентам?", ["pickup_only", "own_delivery", "taxi_delivery", "courier_partner", "mixed", "not_decided"]),
      textarea("toolTrackingSystem", "Учет инструмента", "Как будет вестись учет выдачи, возврата, состояния и истории ремонта инструмента?"),
      textarea("handoverInspectionProcess", "Проверка при возврате", "Как будете проверять состояние инструмента при возврате и фиксировать повреждения?", { optional: true })
    ]),
    block("tool_rental_maintenance_safety", "Аренда инструмента: обслуживание, ремонт и безопасность", "Планируем сервис, износ, запчасти, инструкции, безопасность клиентов и простой оборудования.", [
      textarea("toolMaintenancePlan", "Обслуживание и ремонт", "Как будет организован ремонт, профилактика, замена расходников и проверка инструмента между арендами?"),
      number("maintenanceCostPct", "Ремонт и износ", "Какой процент от выручки или стоимости парка заложить на ремонт, износ и списания?", "%", { optional: true }),
      bool("alternativeSuppliers", "Запчасти/сервис", "Есть ли 2-3 поставщика запчастей или сервисных мастера?", { optional: true }),
      textarea("clientSafetyInstructions", "Инструктаж клиента", "Какие инструкции по безопасному использованию инструмента будете выдавать клиенту?", { optional: true }),
      textarea("damageLossPolicy", "Поломка или невозврат", "Что происходит при поломке, краже, потере или невозврате инструмента?"),
      bool("liabilityInsurance", "Страхование/резерв", "Планируется ли страховка или отдельный резерв на потери и спорные случаи?", { optional: true })
    ]),
    block("tool_rental_documents_liability", "Аренда инструмента: договоры, залог и ответственность", "Фиксируем договор аренды, залог, акт приема-передачи, оплату, документы клиента и ответственность сторон.", [
      select("businessLegalForm", "Форма бизнеса", "Какая форма бизнеса планируется?", ["individual_entrepreneur", "llc", "self_employed", "not_decided"]),
      select("depositPolicy", "Залог", "Как будет работать залог за инструмент?", ["cash_deposit", "card_hold", "passport_or_id_copy", "no_deposit", "mixed", "not_decided"]),
      bool("rentalClientContracts", "Договор аренды", "Будет ли письменный договор аренды инструмента с клиентом?"),
      bool("handoverActRequired", "Акт приема-передачи", "Будет ли акт приема-передачи с состоянием инструмента, комплектностью и сроком возврата?"),
      select("rentalPaymentFlow", "Оплата", "Как клиент будет оплачивать аренду и залог?", ["cash", "card_terminal", "bank_transfer", "online_payment", "mixed", "not_decided"]),
      textarea("rentalRequiredDocuments", "Документы", "Какие документы нужны: регистрация бизнеса, договор аренды инструмента, акт выдачи/возврата, правила залога, касса/чеки?"),
      textarea("rentalDamageLiability", "Ответственность сторон", "Как в договоре фиксируется ответственность за поломку, просрочку, невозврат и травмы при неправильном использовании?", { optional: true })
    ])
  ];
}

function serviceSpecific(profile: BusinessProfile): InterviewBlock[] {
  if (profile.subcategory === "cleaning_service") return cleaningServiceSpecific();
  if (profile.subcategory === "car_wash") return carWashSpecific();
  if (profile.subcategory === "tool_equipment_rental") return toolEquipmentRentalSpecific();
  if (profile.subcategory === "auto_service" && profile.confidence >= 0.8) {
    return [
      block("auto_service_format", "Автосервис: формат и бизнес-модель", "Сначала фиксируем, что это именно автосервис, какой формат работы и кто контролирует клиентский поток.", [
        select("autoServiceFormat", "Формат автосервиса", "Какой формат автосервиса вы планируете?", autoServiceFormatOptions, { helpText: "Бокс = отдельное рабочее место/пост в автосервисе, где можно обслуживать автомобиль." }),
        showIfHostBusinessTraffic(text("parentAutoServiceName", "Большой автосервис/площадка", "Если это один бокс внутри большого автосервиса, как называется площадка или кто владелец/основной арендатор?", { optional: true })),
        showIfHostBusinessTraffic(select("boxLeaseModel", "Модель пользования рабочим местом", "Если вы запускаете не отдельный автосервис, а один рабочий пост/бокс внутри существующего автосервиса, на каких условиях вы будете пользоваться этим местом?", ["rent", "sublease", "revenue_share", "partnership", "verbal_agreement", "not_decided"], { helpText: "Бокс = отдельное рабочее место/пост в автосервисе, где можно обслуживать автомобиль." })),
        showIfHostBusinessTraffic(bool("subleaseAllowed", "Право субаренды", "Письменно подтверждено, что владелец или основной арендатор имеет право передать вам бокс?", { optional: true })),
        showIfHostBusinessTraffic(textarea("boxLeaseTerms", "Условия бокса", "Опишите условия аренды/субаренды: ставка, депозит, коммунальные платежи, доступ к клиентам, ограничения по видам работ и ответственность сторон.")),
        textarea("servicePositioning", "Специализация и отличие", "В чем специализация бокса: скорость, качество, конкретные марки авто, гарантия, цена, опыт мастера или поток большого сервиса?", { optional: true })
      ]),
      block("auto_service_premises", "Бокс, аренда и инфраструктура", "Для одного бокса главный риск - не строительство, а право долгосрочно пользоваться местом и общей инфраструктурой.", [
        number("leaseTermMonths", "Срок договора", "На какой срок планируется письменный договор аренды/субаренды?", "мес."),
        bool("leaseRenewalOption", "Право продления", "Есть ли право продления договора на понятных условиях?", { optional: true }),
        number("terminationNoticeDays", "Срок уведомления о расторжении", "За сколько дней арендодатель может расторгнуть договор или изменить условия?", "дней", { optional: true }),
        number("boxAreaSqm", "Площадь бокса", "Какая площадь бокса и достаточно ли места для выбранных работ?", "м2", { optional: true }),
        number("carsServedAtOnce", "Авто одновременно", "Сколько автомобилей можно обслуживать одновременно в этом боксе?", "авто", { optional: true }),
        textarea("includedInfrastructure", "Включенная инфраструктура", "Что включено: подъемник, электричество, вода/слив, вентиляция, компрессор, отопление, парковка, склад, охрана, санузел, зона ожидания, администратор, касса, интернет, уборка?"),
        bool("liftIncluded", "Подъемник включен", "Подъемник уже есть и включен в условия пользования боксом?", { optional: true }),
        bool("compressorIncluded", "Компрессор/воздух", "Есть ли доступ к компрессору или линии сжатого воздуха?", { optional: true }),
        bool("ventilationReady", "Вентиляция", "Вентиляция подходит для выбранных работ?", { optional: true }),
        bool("waterDrainageReady", "Вода и слив", "Есть ли вода, слив и безопасная зона для технических жидкостей?", { optional: true }),
        bool("signageAllowed", "Вывеска/реклама", "Можно ли разместить вывеску, баннер или рекламу вашего бокса на территории сервиса?", { optional: true })
      ]),
      block("auto_service_services_capacity", "Услуги и пропускная способность", "Уточняем не товары, а услуги, загрузку мастера и пропускную способность бокса.", [
        multi("serviceCategories", "Услуги автосервиса", "Какие услуги будете оказывать?", ["oil_change", "filters", "diagnostics", "minor_repair", "suspension", "brakes", "electrical", "air_conditioning", "tire_service", "alignment", "detailing", "bodywork", "painting", "gas_equipment", "vehicle_modification", "other"]),
        number("workingDaysPerMonth", "Рабочие дни", "Сколько дней в месяц будет работать бокс?", "дней/мес.", { optional: true }),
        number("workingHoursPerDay", "Рабочие часы", "Сколько часов в день будет работать бокс?", "часов/день", { optional: true }),
        number("averageServiceDurationMinutes", "Средняя длительность услуги", "Сколько минут занимает средняя услуга с учетом приемки и выдачи авто?", "мин.", { optional: true }),
        number("dailyServiceCapacity", "Авто в день", "Сколько автомобилей реально обслуживать в день при обычной загрузке?", "авто/день"),
        select("capacityBottleneck", "Узкое место", "Что будет главным ограничением роста: мастер, подъемник, поток клиентов, запчасти, диагностика, место, администратор или другое?", ["master", "lift", "customer_flow", "parts", "diagnostics", "space", "administrator", "other"], { optional: true })
      ]),
      block("auto_service_revenue_customers", "Клиенты, продажи и оплата", "Фиксируем, откуда берутся клиенты и кто контролирует деньги - это критично для бокса внутри чужого сервиса.", [
        number("averageServiceTicket", "Средний чек услуги", "Какой средний чек по основной услуге или средний чек на один автомобиль?", "UZS"),
        number("firstMonthCarsPerDay", "Авто в день на старте", "Сколько авто в день ожидается в первый месяц?", "авто/день", { optional: true }),
        number("stableCarsPerDay", "Авто в день после стабилизации", "Сколько авто в день ожидается после выхода на стабильную загрузку?", "авто/день", { optional: true }),
        multi("targetCustomerSegments", "Основные клиенты", "Кто основные клиенты/покупатели?", ["private_car_owners", "taxi_drivers", "taxi_fleets", "corporate_fleets", "commercial_vehicle_drivers", "repeat_clients", "other"]),
        multi("customerAcquisitionChannels", "Каналы привлечения клиентов", "Откуда будут приходить клиенты?", ["walk_in", "maps_2gis_google_yandex", "instagram", "telegram", "recommendations", "partners", "b2b_sales", "repeat_visits", "host_business_traffic", "other"], { optionShowIf: { host_business_traffic: { autoServiceFormat: hostBusinessTrafficFormats } } }),
        multi("mainRevenueServices", "Основной доход", "Какие услуги будут давать основной доход?", ["diagnostics", "oil_change", "filters", "suspension", "brakes", "electrical", "air_conditioning", "tire_service", "detailing", "minor_repair", "parts_resale", "other"], { optional: true }),
        textarea("demandValidation", "Подтверждение спроса", "Есть ли подтверждение спроса: предварительные клиенты, звонки, заявки, договоренности с таксопарками или автопарками?", { optional: true }),
        showIfHostBusinessTraffic(bool("hostServiceTrafficAgreement", "Договоренность о передаче клиентов", "Есть ли договоренность с владельцем большого сервиса о передаче клиентов вашему боксу?")),
        showIfHostBusinessTraffic(number("hostServiceExpectedClientsPerDay", "Поток от партнера", "Сколько клиентов в день может приходить от большого сервиса?", "клиентов/день", { optional: true })),
        showIfHostBusinessTraffic(select("clientPaymentFlow", "Кто принимает оплату", "Кто принимает оплату от клиента?", ["direct_to_entrepreneur", "host_business_cashier", "revenue_share", "mixed", "not_decided"])),
        showIfHostBusinessTraffic(select("revenueShareModel", "Как делится выручка", "Как будет распределяться выручка с площадкой/партнером?", ["fixed_rent", "percent_commission", "revenue_share", "mixed", "not_decided"], { optional: true })),
        showIfHostBusinessTraffic(bool("hostServiceWrittenAgreement", "Письменное соглашение", "Есть ли письменная договоренность с большим сервисом?", { optional: true })),
        showIfHostBusinessTraffic(number("parentServiceCommissionPct", "Комиссия площадки", "Если большой автосервис берет процент/комиссию, какой процент?", "%", { optional: true })),
        showIfHostBusinessTraffic(textarea("paymentSettlementTerms", "Перечисление денег", "Если оплату принимает большой автосервис, когда и как он перечисляет вашу долю?", { optional: true })),
        showIfMobileService(text("mobileServiceZone", "Зона обслуживания", "Какая зона обслуживания для выездного сервиса?")),
        showIfMobileService(number("mobileVisitsPerDay", "Выездов в день", "Сколько выездов в день реально выполнить?", "выездов/день", { optional: true })),
        showIfMobileService(textarea("travelTimeAccounting", "Время дороги", "Как учитывается время дороги между клиентами?", { optional: true })),
        showIfMobileService(bool("mobileEquipmentReady", "Транспорт и мобильное оборудование", "Есть ли транспорт и мобильное оборудование для выездной работы?", { optional: true })),
        bool("partsResalePlanned", "Продажа запчастей", "Планируется ли отдельно зарабатывать на продаже запчастей/расходников клиенту?", { optional: true }),
        number("partsMarginPct", "Маржа на запчастях", "Если запчасти/расходники продаются клиенту, какая средняя маржа?", "%", { optional: true })
      ]),
      block("auto_service_equipment", "Оборудование, инструмент и сервис", "AI должен понять, что для автосервиса важны инструмент, диагностика, подъемник, монтаж, гарантия и сервис в Узбекистане.", [
        textarea("equipmentList", "Оборудование и инструмент", "Какое оборудование нужно: подъемник, диагностический сканер, компрессор, набор инструмента, оборудование для масла, кондиционеров, шиномонтажа, сварки, покраски?"),
        select("equipmentOwnership", "Оборудование в боксе", "Оборудование уже есть в боксе, покупается вами, арендуется, берется в лизинг или используется совместно?", ["included_in_box", "buy_new", "buy_used", "rent", "leasing", "shared", "mixed", "not_decided"]),
        select("equipmentCondition", "Состояние оборудования", "Оборудование новое, б/у или смешанное?", ["new", "used", "mixed", "unknown"], { optional: true }),
        bool("supplierOfferAvailable", "КП поставщика", "Есть ли коммерческое предложение на оборудование/инструменты?", { optional: true }),
        textarea("equipmentServiceSupport", "Гарантия и сервис", "Есть ли гарантия, сервис, запчасти и обучение по оборудованию в Узбекистане?", { optional: true }),
        number("equipmentDeliveryMonths", "Доставка/монтаж", "Сколько месяцев займет доставка, монтаж и запуск оборудования?", "мес.", { optional: true }),
        bool("needsLeasing", "Лизинг оборудования", "Планируете ли лизинг оборудования для бокса?", { optional: true })
      ]),
      block("auto_service_consumables_suppliers", "Расходники, запчасти и поставщики", "Это не сырье завода и не SKU магазина: фиксируем расходники, запчасти, валюту, запас и альтернативных поставщиков.", [
        textarea("consumables", "Расходники и запчасти", "Какие расходники нужны постоянно: масла, фильтры, тормозные жидкости, антифриз, химия, перчатки, ветошь, крепеж, мелкие запчасти?"),
        select("consumablesSource", "Источник расходников", "Поставщики расходников/запчастей локальные, импортные или смешанные?", ["local", "import", "mixed", "unknown"]),
        select("supplierCurrency", "Валюта закупок", "В какой валюте закупаются расходники, запчасти или оборудование?", ["UZS", "USD", "EUR", "CNY", "RUB", "mixed", "unknown"], { optional: true }),
        number("importedPartsSharePct", "Доля импорта", "Какая примерная доля импортных расходников/запчастей/оборудования?", "%", { optional: true }),
        bool("foreignCurrencyPurchases", "Валютные закупки", "Будут ли закупки в иностранной валюте или с валютной привязкой?", { optional: true }),
        bool("alternativeSuppliers", "Альтернативные поставщики", "Есть ли минимум 2-3 альтернативных поставщика по ключевым расходникам?", { optional: true }),
        textarea("supplierPaymentTerms", "Условия оплаты поставщикам", "Какие условия оплаты: предоплата, отсрочка, покупка под клиента, минимальный заказ, доставка?", { optional: true }),
        number("initialInventoryCapex", "Запас на старт", "Какой запас расходников/запчастей нужен на первый месяц?", "UZS", { optional: true })
      ]),
      block("auto_service_compliance", "Документы, разрешения и ответственность", "Фиксируем договор, отходы, специальные виды работ и зоны, где нужна проверка официальных требований.", [
        textarea("requiredPermits", "Документы по автосервису", "Какие документы уже есть или нужны: регистрация бизнеса, договор аренды/субаренды, разрешение владельца на виды работ, касса/оплата, бухгалтерия?", { optional: true }),
        textarea("wasteOilHandling", "Отработанное масло/отходы", "Кто отвечает за сбор, хранение и передачу отработанного масла, фильтров, жидкостей, химии и ветоши: вы или большой автосервис? Есть ли договор/процесс?"),
        select("wasteOilHandlingPlan", "План по отходам", "Какой статус по отработанному маслу и отходам?", ["confirmed_contract", "handled_by_parent_service", "planned", "unknown"]),
        bool("vehicleModificationServices", "Изменение конструкции", "Будут ли услуги, связанные с изменением конструкции автомобиля или тюнингом?", { optional: true }),
        bool("gasEquipmentInstallation", "Газовое оборудование", "Будет ли установка/обслуживание газового оборудования?", { optional: true }),
        bool("paintingOrBodywork", "Покраска/кузовные работы", "Будут ли покраска, кузовные, сварочные или химические работы?", { optional: true }),
        bool("hazardousWasteHandlingKnown", "Опасные отходы", "Понятен ли порядок обращения с техническими жидкостями, маслами, фильтрами и химией?", { optional: true }),
        bool("hasAccountantOrConsultant", "Юрист/бухгалтер", "Есть ли бухгалтер, юрист или консультант, который проверит договор и разрешительные вопросы?", { optional: true })
      ]),
      block("auto_service_staff_quality", "Мастера, качество и гарантия", "Для автосервиса важны квалификация мастера, ответственность за качество работ и гарантийные случаи.", [
        staff(),
        textarea("staffSkills", "Опыт мастеров", "Какой опыт у мастеров по выбранным услугам и маркам автомобилей?"),
        textarea("serviceQualityControl", "Контроль качества", "Как будет проверяться качество работ перед выдачей автомобиля клиенту?", { optional: true }),
        textarea("warrantyPolicy", "Гарантия клиенту", "Какую гарантию вы будете давать на работы и кто несет ответственность при споре с клиентом?", { optional: true })
      ])
    ];
  }
  return [block("service_model", "Услуги", "Уточняем услугу, клиентский поток и качество.", [
    multi("serviceCategories", "Услуги", "Какие услуги будете оказывать?", ["consulting", "repair", "cleaning", "maintenance", "personal_service", "other"]),
    number("dailyServiceCapacity", "Клиентов в день", "Сколько клиентов/заказов можно обслужить в день?", "клиентов/день"),
    number("averageServiceTicket", "Средний чек услуги", "Какой средний чек по услугам?", "UZS"),
    select("bookingOrWalkInModel", "Запись или walk-in", "Как клиенты будут приходить: запись, walk-in, B2B-договоры или смешанная модель?", ["booking", "walk_in", "b2b_contracts", "mixed"]),
    textarea("serviceQualityControl", "Качество и гарантия", "Как будете контролировать качество и гарантию услуги?", { optional: true })
  ])];
}

function categoryBlocks(profile: BusinessProfile): InterviewBlock[] {
  if (profile.category === "services" || profile.category === "professional_services") {
    if (profile.subcategory === "auto_service" && profile.confidence >= 0.8) return serviceSpecific(profile);
    if (profile.subcategory === "cleaning_service") return cleaningServiceSpecific();
    if (profile.subcategory === "car_wash") return carWashSpecific();
    if (profile.subcategory === "tool_equipment_rental") return toolEquipmentRentalSpecific();
    return serviceSpecific({ ...profile, subcategory: profile.subcategory === "auto_service" ? undefined : profile.subcategory });
  }
  if (profile.category === "beauty_wellness") return [block("beauty_model", "Beauty/wellness", "Услуги, мастера, оборудование и санитарные требования.", [
    multi("serviceCategories", "Услуги", "Какие услуги будут в салоне?", ["hair", "manicure", "cosmetology", "barber", "massage", "spa", "other"]),
    number("dailyServiceCapacity", "Клиентов в день", "Сколько клиентов можно обслужить в день?", "клиентов/день"),
    number("averageServiceTicket", "Средний чек", "Какой средний чек по услугам?", "UZS"),
    number("chairsOrWorkstations", "Кресла/рабочие места", "Сколько кресел или рабочих мест планируется?", "шт.", { optional: true }),
    textarea("consumables", "Расходники", "Какая косметика, расходники и стерилизационные материалы нужны?"),
    select("bookingOrWalkInModel", "Запись", "Какая модель клиентского потока?", ["booking", "walk_in", "mixed"])
  ])];
  if (profile.category === "food_service") return [block("food_service", "Food service", "Меню, кухня, посадка, food cost и delivery.", [
    select("format", "Формат", "Какой формат заведения?", ["cafe", "coffee_shop", "restaurant", "fast_food", "dark_kitchen", "bakery", "kiosk", "other"]),
    multi("menuCategories", "Меню", "Какие основные категории меню?", ["coffee", "drinks", "bakery", "hot_food", "desserts", "fast_food", "breakfast", "other"]),
    number("seatingCapacity", "Посадочные места", "Сколько посадочных мест планируется?", "мест"),
    textarea("kitchenEquipment", "Кухня и оборудование", "Какое кухонное оборудование нужно?"),
    number("dailyCovers", "Заказы/посетители в день", "Сколько заказов или посетителей в день планируется?", "заказов/день"),
    number("foodCostPct", "Себестоимость продуктов", "Какой процент выручки составляет себестоимость продуктов и напитков?", "%", { optional: true }),
    number("laborCostPct", "Labor cost", "Какой плановый labor cost в процентах от выручки?", "%", { optional: true }),
    multi("deliveryChannels", "Доставка", "Какие каналы доставки будут?", ["own_delivery", "aggregators", "pickup", "none", "other"], { optional: true }),
    textarea("sanitaryPermits", "Санитарные требования", "Какие санитарные требования и разрешения нужно проверить?", { optional: true })
  ])];
  if (profile.category === "manufacturing") return [block("manufacturing", "Производство", "Сырье, процесс, мощность, брак, хранение и отходы.", [
    textarea("rawMaterials", "Сырье", "Какое сырье и комплектующие нужны?"),
    textarea("productionStages", "Производственный процесс", "Какие основные этапы производства?"),
    number("monthlyOutputCapacity", "Мощность", "Какой плановый выпуск в месяц?", "ед./мес."),
    textarea("storageNeeds", "Хранение", "Какие требования к хранению сырья и готовой продукции?"),
    number("defectRatePct", "Брак", "Какой процент брака или потерь нужно заложить?", "%", { optional: true }),
    textarea("wasteByproducts", "Отходы", "Какие отходы или побочные продукты возникают?", { optional: true }),
    textarea("energyNeeds", "Энергия/вода", "Какие требования по электричеству, воде, вентиляции?", { optional: true })
  ])];
  if (profile.category === "retail") return [block("retail", "Розница", "SKU, остатки, маржа, трафик и склад.", [
    multi("productCategories", "Товарные категории", "Какие товарные категории будете продавать?", ["cosmetics", "clothes", "food", "auto_parts", "construction", "electronics", "other"]),
    number("skuCount", "SKU", "Сколько SKU планируется на старте?", "SKU"),
    textarea("purchasePrices", "Закупочные цены", "Как будете подтверждать закупочные цены и поставщиков?"),
    number("marginPct", "Маржа", "Какая плановая валовая маржа?", "%"),
    number("inventoryTurnover", "Оборачиваемость", "Сколько оборотов товарного запаса в месяц ожидаете?", "раз/мес.", { optional: true }),
    number("traffic", "Трафик", "Сколько посетителей/лидов в день ожидаете?", "чел./день", { optional: true }),
    number("conversion", "Конверсия", "Какая ожидаемая конверсия посетителей в покупки?", "%", { optional: true })
  ])];
  if (profile.category === "ecommerce") return [block("ecommerce", "Онлайн-продажи", "Платформы, стоимость привлечения, доставка, возвраты и юнит-экономика.", [
    select("salesPlatform", "Платформа", "Где будут продажи?", ["marketplace", "website", "instagram", "telegram", "mixed"]),
    multi("marketplaces", "Маркетплейсы", "Какие маркетплейсы/каналы будут использоваться?", ["uzum", "wildberries", "instagram", "telegram", "website", "other"], { optional: true }),
    number("monthlyOrders", "Заказы в месяц", "Сколько заказов в месяц ожидаете?", "заказов/мес."),
    number("averagePurchaseCost", "Закупочная цена", "Какова средняя закупочная/себестоимость одной единицы товара?", "UZS"),
    textarea("purchasePricesDetail", "Закупочные цены по категориям", "Если категорий несколько, укажите закупочную цену по основным категориям: сыворотка — 45 000 сум, крем — 30 000 сум.", { optional: true }),
    number("packagingCostPerUnit", "Упаковка на единицу", "Сколько стоит упаковка на одну единицу/заказ?", "UZS"),
    number("directLogisticsCostPerUnit", "Доставка на единицу", "Какая прямая стоимость доставки или логистики на один заказ?", "UZS"),
    number("cac", "Стоимость привлечения клиента", "Сколько стоит привлечь один заказ или клиента через рекламу?", "UZS", { optional: true }),
    textarea("delivery", "Доставка", "Как будет организована доставка?"),
    textarea("fulfillment", "Хранение, упаковка и отправка", "Где будут храниться товары, как будет организована упаковка и отправка заказов?"),
    number("returnsPct", "Возвраты", "Какой процент возвратов нужно заложить?", "%", { optional: true }),
    number("adBudget", "Реклама", "Какой месячный рекламный бюджет?", "UZS", { optional: true })
  ])];
  if (profile.category === "agriculture") return [block("agriculture", "Сельское хозяйство", "Площадь, урожайность, вода, энергия и сезонность.", [
    text("landOrGreenhouse", "Земля/теплица/ферма", "Что используется: земля, теплица, ферма, сад или другое?"),
    number("area", "Площадь", "Какая площадь проекта?", "га/м2"),
    text("cropOrLivestock", "Культура/животные", "Какая культура, животные или продукция?"),
    number("yield", "Урожайность/выход", "Какая ожидаемая урожайность или выход продукции?", "ед./сезон"),
    textarea("water", "Вода", "Какие источники воды и лимиты?"),
    textarea("energy", "Энергия", "Какие потребности в электричестве/газе/топливе?"),
    textarea("seedsFeed", "Семена/корма", "Какие семена, корма или основные inputs нужны?"),
    textarea("climateRisks", "Климатические риски", "Какие климатические, водные или сезонные риски нужно учитывать?", { optional: true })
  ])];
  if (profile.category === "import_export") return [block("import_export", "Импорт/экспорт", "Страна, валюта, Incoterms, таможня, сертификаты и FX risk.", [
    text("importCountry", "Страна", "Из какой страны импорт/в какую страну экспорт?"),
    text("supplier", "Поставщик", "Кто поставщик или как будет выбран поставщик?"),
    select("supplierCurrency", "Валюта поставщика", "В какой валюте будут закупки/контракт?", ["USD", "EUR", "CNY", "RUB", "UZS", "other"]),
    text("incoterms", "Incoterms", "Какие условия Incoterms планируются, если известны?"),
    text("customsBroker", "Таможенный брокер", "Есть ли таможенный брокер или консультант?"),
    number("customsDuties", "Пошлины/платежи", "Какие пошлины/таможенные платежи нужно заложить, если известно?", "%", { optional: true }),
    textarea("certificates", "Сертификаты", "Какие сертификаты, декларации или разрешения могут понадобиться?"),
    text("deliveryTime", "Срок поставки", "Какой срок поставки от предоплаты до склада?"),
    number("prepaymentPct", "Предоплата", "Какой процент предоплаты поставщику?", "%", { optional: true }),
    bool("alternativeSuppliers", "Альтернативные поставщики", "Есть ли 2-3 альтернативных поставщика?", { optional: true }),
    bool("foreignCurrencyPurchases", "Валютные закупки", "Будут ли закупки в иностранной валюте?")
  ])];
  if (profile.category === "logistics" || profile.category === "transport") return [block("logistics", "Логистика/транспорт", "Маршруты, парк, топливо, водители, тариф и загрузка.", [
    select("transportType", "Вид транспорта", "Какой вид транспорта/доставки?", ["truck", "van", "courier", "warehouse", "mixed", "other"]),
    textarea("routes", "Маршруты", "Какие маршруты или зоны доставки?"),
    textarea("fleet", "Парк", "Сколько единиц транспорта и какого типа?"),
    textarea("vehicleLease", "Аренда/лизинг", "Транспорт покупается, арендуется или берется в лизинг?", { optional: true }),
    textarea("fuel", "Топливо", "Какой расход топлива и цена заложены?"),
    textarea("drivers", "Водители", "Сколько водителей и какой график?"),
    textarea("insurance", "Страхование/разрешения", "Какие страховки, разрешения и путевые документы нужны?", { optional: true }),
    textarea("b2bContracts", "B2B contracts", "Есть ли B2B-клиенты или предварительные договоры?", { optional: true }),
    number("loadFactor", "Загрузка", "Какая плановая загрузка транспорта/курьеров?", "%", { optional: true }),
    number("tariff", "Тариф", "Какой средний тариф за рейс/заказ?", "UZS", { optional: true })
  ])];
  if (profile.category === "education") return [block("education", "Образование", "Формат, ученики, преподаватели, лицензирование и retention.", [
    select("format", "Формат", "Какой формат обучения?", ["offline", "online", "hybrid", "children_center", "language_school", "other"]),
    text("ageGroup", "Возрастная группа", "Какая возрастная группа учеников?"),
    textarea("program", "Программа", "Какая программа или курсы?"),
    textarea("teachers", "Преподаватели", "Кто будет преподавать и какая квалификация?"),
    number("studentsCount", "Ученики", "Сколько учеников планируется в месяц?", "учеников"),
    number("averageTicket", "Цена", "Какая средняя цена курса/месяца?", "UZS"),
    textarea("schedule", "Расписание", "Какое расписание и загрузка групп?", { optional: true }),
    number("retention", "Retention", "Какой процент учеников продолжит обучение?", "%", { optional: true })
  ])];
  if (profile.category === "healthcare") return [block("healthcare", "Healthcare", "Лицензирование, персонал, оборудование, медотходы и пациенты.", [
    text("serviceType", "Тип услуги", "Какие медицинские услуги или товары?"),
    text("licensedActivity", "Лицензируемая деятельность", "Какая лицензируемая деятельность может применяться?"),
    textarea("doctors", "Врачи/персонал", "Какие врачи, медсестры и специалисты нужны?"),
    textarea("medicalEquipment", "Медоборудование", "Какое медицинское оборудование и сервис нужны?"),
    textarea("consumables", "Расходники", "Какие медрасходники нужны?"),
    textarea("medicalWaste", "Медотходы", "Как будет организован сбор и утилизация медотходов?"),
    number("patients", "Пациенты", "Сколько пациентов/визитов в месяц планируется?", "визитов/мес."),
    number("averageTicket", "Средний чек", "Какой средний чек за услугу/визит?", "UZS")
  ])];
  return serviceSpecific(profile);
}


export const commonBlockShells = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
] as const;

function sg(question: InterviewQuestion, semanticGroup: string): InterviewQuestion {
  return { ...question, semanticGroup };
}

function withLocalizedCopy(question: InterviewQuestion, localizedCopy: NonNullable<InterviewQuestion["localizedCopy"]>): InterviewQuestion {
  return { ...question, localizedCopy };
}

function makeCommonShell(id: typeof commonBlockShells[number], questions: InterviewQuestion[]): InterviewBlock {
  const names: Record<typeof commonBlockShells[number], [string, string]> = {
    business_idea: ["Бизнес-идея", "Уточняем, что именно продается или оказывается, кто платит, формат запуска и что уже подтверждено."],
    location: ["Помещение и локация", "Проверяем помещение, зону обслуживания, хранение, инфраструктуру, трафик и ограничения operational model."],
    equipment_launch: ["Оборудование и запуск", "Собираем оборудование, активы, инструменты, IT/POS, монтаж, сервис и готовность запуска."],
    operations: ["Операционная модель", "Фиксируем мощность, график, роли, зарплаты, процесс, KPI и контроль качества."],
    suppliers_procurement: ["Поставщики и закупки", "Собираем закупки, себестоимость, расходники, поставщиков, условия оплаты, запасы и списания."],
    sales: ["Продажи", "Проверяем цену, объем, каналы продаж, маркетинг, повторные продажи, конкурентов и подтверждение спроса."],
    financing: ["Финансирование", "Считаем собственные средства, кредит, лизинг, гранты, залог, оборотный капитал и cash gap."],
    documents_experience: ["Документы и опыт", "Проверяем регистрацию, налоги, договоры, разрешения, ответственность, опыт команды и готовность к проверке."]
  };
  const [name, description] = names[id];
  return block(id, name, description, dedupeQuestions(questions));
}

export function dedupeInterviewQuestions(blocks: InterviewBlock[]): InterviewBlock[] {
  const seenKeys = new Set<string>();
  const seenTexts = new Set<string>();
  const seenGroups = new Set<string>();
  return blocks
    .map((item) => {
      const questions: InterviewQuestion[] = [];
      for (const question of dedupeQuestions(item.questions)) {
        const group = question.semanticGroup ?? questionSemanticGroups[question.key];
        const keepCommon = alwaysKeepCommonKeys.has(question.key);
        const normalizedText = normalizeQuestionText(`${question.label} ${question.question}`);
        const globalSemanticDedupe = group === "target_customers" || group === "sales_channels" || group === "average_ticket" || group === "supplier";
        if (!keepCommon && seenKeys.has(question.key)) continue;
        if (!keepCommon && normalizedText && seenTexts.has(normalizedText)) continue;
        if (!keepCommon && globalSemanticDedupe && group && seenGroups.has(group)) continue;
        seenKeys.add(question.key);
        if (normalizedText) seenTexts.add(normalizedText);
        if (globalSemanticDedupe && group) seenGroups.add(group);
        questions.push(group ? { ...question, semanticGroup: group } : question);
      }
      return { ...item, questions };
    })
    .filter((item) => item.questions.length > 0);
}

function normalizeQuestionText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\b(какой|какая|какие|сколько|будет|нужно|планируете|ожидаемая|ожидаемый|средний|средняя|what|which|how|will|do|does|is|are)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const canonicalInterviewBlockNames: Record<typeof approvedInterviewBlocks[number], [string, string]> = {
  business_idea: ["Бизнес-идея", "Что продается, кому, в каком формате и чем бизнес отличается."],
  location: ["Помещение и локация", "Помещение, зона обслуживания, инфраструктура, трафик, склад и ограничения."],
  equipment_launch: ["Оборудование и запуск", "Оборудование, инструменты, IT/POS, ремонт, монтаж, обучение, стартовые расходы и сроки."],
  operations: ["Операционная модель", "Мощность, график, персонал, процесс, качество, сервис и постоянные расходы."],
  suppliers_procurement: ["Поставщики и закупки", "Сырье, товары, расходники, комплектующие, закупочные цены, условия поставки, запас и списания."],
  sales: ["Продажи", "Цена, объем продаж, каналы, маркетинг, повторные клиенты, конкуренты и подтверждение спроса."],
  financing: ["Финансирование", "Собственные средства, кредит, лизинг, гранты, залог, оборотный капитал и cash gap."],
  documents_experience: ["Документы и опыт", "Регистрация, налоги, касса, договоры, разрешения, требования, опыт команды и готовность к проверке."]
};

function textForBlockRouting(block: InterviewBlock, question?: InterviewQuestion) {
  return `${block.id} ${block.name} ${block.description} ${question?.key ?? ""} ${question?.label ?? ""} ${question?.question ?? ""} ${question?.semanticGroup ?? ""}`.toLowerCase();
}

function canonicalBlockForQuestion(block: InterviewBlock, question: InterviewQuestion): typeof approvedInterviewBlocks[number] {
  if ((approvedInterviewBlocks as readonly string[]).includes(block.id)) {
    return block.id as typeof approvedInterviewBlocks[number];
  }
  const explicitQuestionBlock: Partial<Record<string, typeof approvedInterviewBlocks[number]>> = {
    testServiceTypes: "business_idea",
    reportDocumentFormat: "business_idea",
    clientSegments: "sales",
    pricingModel: "sales",
    averageTestTicket: "sales",
    testsPerMonth: "sales",
    b2bContractsPlanned: "sales",
    averageContractValueUZS: "sales",
    testResultDeliveryHours: "operations",
    mobilityModel: "location",
    serviceArea: "location",
    transportStatus: "location",
    transportNeeds: "location",
    clientAddressDrivenSchedule: "location",
    labEquipmentList: "equipment_launch",
    equipmentOwnership: "equipment_launch",
    equipmentCalibrationPlan: "equipment_launch",
    reagentsSupplierSelected: "suppliers_procurement",
    reagentSource: "suppliers_procurement",
    monthlyReagentsCostUZS: "suppliers_procurement",
    accreditationAvailable: "documents_experience",
    accreditationStatus: "documents_experience",
    sanitaryPermitRequired: "documents_experience",
    liabilityInsurance: "documents_experience",
    businessLegalForm: "documents_experience"
  };
  if (explicitQuestionBlock[question.key]) return explicitQuestionBlock[question.key]!;
  const text = textForBlockRouting(block, question);
  if (/business_idea|business concept|бизнес[-\s]?иде|offer|productorservice|product_or_service|format|positioning|ценност|уникальн|stage|стад/i.test(text)) return "business_idea";
  if (/finance|financing|credit|loan|leasing|collateral|owncontribution|workingcapitalbuffermonths|grant|funding|залог|кредит|лизинг|финанс|собственн|оборотн|cash gap/i.test(text)) return "financing";
  if (/document|permit|compliance|license|licens|certification|sanitary|safety|liability|legal|tax|contract|experience|accountant|consultant|fire|labor|environment|документ|разреш|лиценз|сертифик|санитар|безопас|ответствен|договор|налог|опыт|бухгалтер|юрист|пожар|эколог/i.test(text)) return "documents_experience";
  if (/supplier|procurement|purchase|raw|material|inventory|stock|cogs|consumable|chemical|reagent|spare|parts|markup|turnover|paymentterms|customs|currency|incoterms|закуп|поставщик|сырь|материал|товарн|запас|себестоим|расходник|комплект|наценк|оборач|списан|тамож|валют/i.test(text)) return "suppliers_procurement";
  if (/sales|market|customer|client|demand|pricing|price|ticket|channel|marketing|compet|preorder|contract|b2b|repeat|conversion|revenue|loi|продаж|клиент|покупател|спрос|цена|чек|канал|маркетинг|конкур|предзаказ|повторн|выручк/i.test(text)) return "sales";
  if (/location|premises|infrastructure|rent|traffic|area|warehouse|storage|route|servicearea|servicezone|water|electric|ventilation|parking|локац|помещ|аренд|площад|инфраструкт|трафик|склад|хранен|маршрут|зона|вода|электр|вентиляц|парков/i.test(text)) return "location";
  if (/equipment|launch|capex|tool|asset|vehicle|fleet|installation|mount|repair|setup|it\/pos|pos|cash register|машин|оборуд|запуск|инструмент|актив|транспорт|парк|монтаж|настрой|ремонт|касс|смет/i.test(text)) return "equipment_launch";
  if (/operations|team|staff|capacity|schedule|quality|process|production|maintenance|warranty|service terms|kpi|payroll|shift|utilization|операц|команд|персонал|мощност|график|качество|процесс|производ|обслужив|гарант|зарплат|смен|загруз/i.test(text)) return "operations";
  return "operations";
}

export function canonicalizeInterviewBlocks(blocks: InterviewBlock[]): InterviewBlock[] {
  const grouped = new Map<typeof approvedInterviewBlocks[number], InterviewQuestion[]>();
  for (const id of approvedInterviewBlocks) grouped.set(id, []);
  for (const item of blocks) {
    for (const question of item.questions) {
      const canonicalId = canonicalBlockForQuestion(item, question);
      grouped.get(canonicalId)?.push({ ...question, blockId: canonicalId });
    }
  }
  return approvedInterviewBlocks.map((id) => {
    const [name, description] = canonicalInterviewBlockNames[id];
    return block(id, name, description, dedupeQuestions(grouped.get(id) ?? []));
  });
}

function dedupeQuestions(questions: InterviewQuestion[]): InterviewQuestion[] {
  const seenKeys = new Set<string>();
  const seenGroups = new Set<string>();
  const result: InterviewQuestion[] = [];
  for (const question of questions) {
    const group = question.semanticGroup ?? questionSemanticGroups[question.key];
    const keepCommon = typeof alwaysKeepCommonKeys !== "undefined" && alwaysKeepCommonKeys.has(question.key);
    if (!keepCommon && seenKeys.has(question.key)) continue;
    if (!keepCommon && group && seenGroups.has(group)) continue;
    seenKeys.add(question.key);
    if (!keepCommon && group) seenGroups.add(group);
    result.push(group ? { ...question, semanticGroup: group } : question);
  }
  return result;
}

function baseIdentityQuestions(): InterviewQuestion[] {
  return [
    sg(text("businessType", "Что за бизнес", "Что за бизнес вы планируете открыть или развивать?", { placeholder: "Например: мобильный груминг животных, аренда строительного инструмента, автомойка" }), "initial_business_type"),
    sg(textarea("businessIdea", "Описание бизнес-идеи", "Опишите бизнес-идею: что продаете/оказываете, кто клиент, где работает бизнес, что уже есть и что нужно профинансировать."), "initial_business_idea"),
    sg(text("region", "Регион", "В каком регионе Узбекистана будет работать бизнес?"), "region"),
    sg(text("district", "Район/город", "В каком районе или городе будет работать бизнес?", { optional: true }), "district")
  ];
}

function financeQuestions(profile: BusinessProfile): InterviewQuestion[] {
  const extra: InterviewQuestion[] = [];
  if (profile.rentsAssets || profile.subcategory === "tool_equipment_rental") {
    extra.push(sg(number("equipmentCapex", "Стоимость парка активов", "Сколько стоит стартовый парк оборудования/инструмента/активов?", "UZS", { optional: true }), "equipment_cost"));
  } else if (profile.providesServices && !profile.producesGoods) {
    extra.push(sg(number("trainingLaunchCapex", "Запуск сервиса", "Сколько нужно на оборудование, расходники, рекламу и обучение/зарплаты до стабильных записей?", "UZS", { optional: true }), "launch_budget"));
  }
  if (profile.hasCurrencyExposure) {
    extra.push(sg(bool("foreignCurrencyPurchases", "Валютные закупки", "Есть ли закупки в USD/EUR/CNY/RUB или зависимость от курса?", { optional: true }), "currency"));
  }
  return [
    sg(number("ownContributionAmount", "Собственные средства", "Сколько собственных средств готовы вложить?", undefined), "own_contribution"),
    sg(select("ownContributionCurrency", "Валюта собственных средств", "В какой валюте указаны собственные средства?", ["UZS", "USD"]), "own_contribution_currency"),
    sg(select("creditNeeded", "Кредит", "Нужен ли кредит?", ["yes", "no", "unknown"]), "credit_need"),
    sg(showIf(number("requestedLoanAmount", "Сумма кредита", "Какая сумма кредита нужна?", undefined), { creditNeeded: "yes" }), "loan_amount"),
    sg(showIf(select("requestedLoanCurrency", "Валюта кредита", "В какой валюте указан кредит?", ["UZS", "USD"]), { creditNeeded: "yes" }), "loan_currency"),
    sg(showIf(number("loanTermMonths", "Срок кредита", "На какой срок нужен кредит?", "мес."), { creditNeeded: "yes" }), "loan_term"),
    sg(showIf(number("loanAnnualRatePct", "Годовая ставка кредита", "Какая годовая ставка кредита? Если банк еще не дал ставку, укажите ожидаемую.", "%"), { creditNeeded: "yes" }), "loan_rate"),
    sg(showIf(select("loanRepaymentType", "Тип погашения", "Какой тип погашения использовать?", ["annuity", "equal_principal"]), { creditNeeded: "yes" }), "loan_repayment"),
    sg(showIf(textarea("loanPurpose", "Цель кредита", "На что именно нужен кредит?"), { creditNeeded: "yes" }), "loan_purpose"),
    sg(showIf(bool("collateralAvailable", "Залог", "Есть ли потенциальный залог?"), { creditNeeded: "yes" }), "collateral"),
    sg(showIf(text("collateralType", "Тип залога", "Какой залог можно предложить? Например: автомобиль, оборудование, недвижимость, поручительство."), { collateralAvailable: true }), "collateral_type"),
    sg(showIf(number("collateralEstimatedValue", "Оценочная стоимость залога", "Какую примерную стоимость залога вы оцениваете? Можно указать в UZS или USD — система пересчитает в сумы по курсу ЦБ.", "UZS"), { collateralAvailable: true }), "collateral_value"),
    sg(showIf(bool("collateralDocumentsAvailable", "Документы по залогу", "Есть ли документы собственности/техпаспорт/оценка или другой подтверждающий документ?", { optional: true }), { collateralAvailable: true }), "collateral_documents"),
    sg(bool("needsLeasing", "Лизинг", "Планируете ли лизинг оборудования, транспорта или активов?", { optional: true }), "leasing"),
    sg(showIf(textarea("leasingItem", "Предмет лизинга", isManufacturingLikeProfile(profile) ? "Что планируется взять в лизинг: оборудование, транспорт, спецтехника, производственная линия или другой актив?" : "Что планируется взять в лизинг: оборудование, транспорт, спецтехника или другой ключевой актив?"), { needsLeasing: true }), "leasing_asset"),
    sg(showIf(select("leasingAssetType", "Тип актива", "Какой тип актива берется в лизинг?", isManufacturingLikeProfile(profile) ? ["equipment", "vehicle", "special_equipment", "production_line", "other"] : ["equipment", "vehicle", "special_equipment", "other"]), { needsLeasing: true }), "leasing_asset_type"),
    sg(showIf(number("requestedLeasingAmount", "Стоимость предмета лизинга", "Какая стоимость предмета лизинга или сумма финансирования?", "UZS"), { needsLeasing: true }), "leasing_amount"),
    sg(showIf(select("requestedLeasingCurrency", "Валюта лизинга", "В какой валюте указана стоимость предмета лизинга?", ["UZS", "USD"]), { needsLeasing: true }), "leasing_currency"),
    sg(showIf(number("leasingAdvancePayment", "Первоначальный взнос", "Какой первоначальный взнос по лизингу?", "UZS", { optional: true }), { needsLeasing: true }), "leasing_advance"),
    sg(showIf(number("leasingTermMonths", "Срок лизинга", "На какой срок нужен лизинг?", "мес."), { needsLeasing: true }), "leasing_term"),
    sg(showIf(number("leasingAnnualRatePct", "Ставка/удорожание лизинга", "Какая ориентировочная ставка или удорожание по лизингу?", "%"), { needsLeasing: true }), "leasing_rate"),
    sg(showIf(number("leasingMonthlyPayment", "Ежемесячный лизинговый платеж", "Если лизинговая компания уже дала график, укажите ежемесячный платеж.", "UZS", { optional: true }), { needsLeasing: true }), "leasing_payment"),
    sg(showIf(number("leasingResidualValue", "Выкупная стоимость", "Есть ли остаточная или выкупная стоимость в конце договора?", "UZS", { optional: true }), { needsLeasing: true }), "leasing_residual"),
    sg(showIf(text("leasingSupplier", "Поставщик предмета лизинга", "Кто поставщик оборудования, транспорта или другого предмета лизинга?", { optional: true }), { needsLeasing: true }), "leasing_supplier"),
    sg(showIf(bool("leasingOfferAvailable", "КП или счет", "Есть ли коммерческое предложение, счет или спецификация по предмету лизинга?", { optional: true }), { needsLeasing: true }), "leasing_offer"),
    sg(showIf(bool("leasingCollateralByAsset", "Предмет лизинга как обеспечение", "Используется ли сам предмет лизинга как обеспечение?", { optional: true }), { needsLeasing: true }), "leasing_collateral"),
    sg(showIf(bool("additionalLeasingCollateralNeeded", "Дополнительное обеспечение", "Нужно ли дополнительное обеспечение по лизингу?", { optional: true }), { needsLeasing: true }), "leasing_additional_collateral"),
    sg(showIf(select("leasingOwnershipUntilBuyout", "Собственник до выкупа", "Кто будет собственником актива до выкупа?", ["leasing_company", "entrepreneur", "supplier", "not_decided"], { optional: true }), { needsLeasing: true }), "leasing_ownership"),
    sg(showIf(textarea("leasingDocuments", "Документы по предмету лизинга", "Какие документы есть по предмету лизинга: КП, счет, спецификация, гарантия, техпаспорт, договор поставщика?", { optional: true }), { needsLeasing: true }), "leasing_documents"),
    sg(showIf(textarea("leasingAssetRevenueImpact", "Влияние актива на бизнес", "На что влияет актив: мощность, выручка, себестоимость, качество или скорость обслуживания?", { optional: true }), { needsLeasing: true }), "leasing_impact"),
    ...extra,
    sg(number("workingCapitalBufferMonths", "Запас оборотки", "На сколько месяцев фиксированных расходов нужен cash buffer до стабильной загрузки?", "мес.", { optional: true }), "working_capital_buffer"),
    sg(textarea("sectionNotes.finance", "Финансовые детали", "Опишите структуру финансирования, кредит/лизинг, залог, оборотный капитал и основные риски денежного потока.", { optional: true }), "finance_notes")
  ];
}

function genericAdaptiveCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const serviceUnit = profile.providesServices && !profile.producesGoods;
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(text("productOrService", serviceUnit ? "Услуга" : profile.producesGoods ? "Продукт" : "Товар/услуга", serviceUnit ? "Какие услуги будут основными и за что клиент платит основную сумму?" : profile.producesGoods ? "Что именно будет производиться и какая единица продажи?" : "Какие товары или услуги будут основными и какая единица продажи?"), "offer"),
      sg(textarea("sectionNotes.businessIdea", "Подтверждение идеи", "Что уже подтверждено: первые клиенты, партнеры, место, поставщики, опыт, тестовые продажи или КП?", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomers", "Основные клиенты", "Кто основные клиенты именно этой бизнес-модели?", profile.hasB2BContracts ? ["small_businesses", "corporate_clients", "direct_b2b", "wholesale_buyers", "contract_clients", "repeat_clients", "other"] : ["individuals", "families", "women", "men", "students", "office_workers", "nearby_residents", "online_customers", "gift_buyers", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы привлечения", "Через какие каналы клиенты будут узнавать и покупать?", ["instagram", "telegram", "website", "marketplace", "maps_2gis_google_yandex", "recommendations", "partners", "repeat_clients", "other"], { optional: true }), "sales_channels"),
      sg(number("monthlyCapacity", serviceUnit ? "Заказов/клиентов в месяц" : "Объем в месяц", serviceUnit ? "Какой реалистичный месячный объем продаж, заказов или клиентов?" : profile.producesGoods ? "Какой реалистичный месячный объем выпуска?" : "Какой реалистичный месячный объем продаж?", serviceUnit ? "клиентов/мес." : "ед./мес."), "monthly_volume"),
      sg(number("averagePrice", serviceUnit ? "Средний чек" : "Средняя цена", "Какая ожидаемая средняя цена/средний чек за единицу продажи?", "UZS"), "average_ticket"),
      sg(bool("hasBuyerAgreements", "Подтверждение спроса", "Есть ли предварительные договоренности, заявки, письма о намерениях или тестовые продажи?", { optional: true }), "demand_validation"),
      sg(textarea("sectionNotes.salesMarketing", "Маркетинг и спрос", "Опишите конкурентов, каналы привлечения, цены, доказательства спроса и сезонность.", { optional: true }), "sales_notes")
    ]),
    makeCommonShell("location", [
      sg(select("premisesStatus", "Помещение", profile.usesMobileService ? "Нужно ли помещение/склад для оборудования, расходников или команды?" : "Какой статус помещения, площадки или точки работы?", profile.usesMobileService ? ["no_office_needed", "storage_only", "small_office", "office_and_storage", "not_decided"] : ["owned", "rent", "searching", "sublease", "online_only", "other"]), "premises_status"),
      ...(profile.usesMobileService ? [sg(text("serviceArea", "Зона обслуживания", "Какая зона обслуживания/выезда и какие районы вы реально покрываете?", { optional: true }), "service_area")] : []),
      sg(showIfRent(number("monthlyRent", "Аренда в месяц", "Какая ежемесячная сумма аренды/субаренды?", "UZS", { optional: true })), "premises_rent"),
      sg(number("premisesAreaSqm", "Площадь", "Какая ориентировочная площадь помещения/площадки/склада?", "м2", { optional: true }), "premises_area"),
      sg(bool("infrastructureReady", "Инфраструктура", "Готовы ли ключевые условия: электричество, вода, вентиляция, интернет, склад, подъезд или безопасность?", { optional: true }), "infrastructure"),
      sg(textarea("sectionNotes.premisesInfrastructure", "Описание помещения/локации", "Опишите условия помещения, зоны обслуживания, инфраструктуру, ограничения, подъезд и хранение.", { optional: true }), "location_notes")
    ]),
    makeCommonShell("equipment_launch", [
      sg(select("equipmentCondition", "Оборудование", "Оборудование будет новым, б/у, смешанным или пока не выбрано?", ["new", "used", "mixed", "not_selected", "not_needed", "other"]), "equipment_condition"),
      sg(textarea("equipmentList", "Список оборудования", "Перечислите ключевое оборудование, активы, инвентарь, инструменты, IT/POS или цифровые инструменты для запуска."), "equipment"),
      sg(bool("supplierOfferAvailable", "КП/смета", "Есть ли КП, смета, прайс-лист или ссылка на цены по оборудованию/монтажу?", { optional: true }), "supplier_offer"),
      sg(number("equipmentCapex", "Оборудование и запуск", "Сколько ориентировочно стоит оборудование, инвентарь, монтаж, настройка и запуск?", "UZS", { optional: true }), "equipment_cost"),
      sg(textarea("sectionNotes.equipment", "Детали запуска", "Опишите гарантию, сервис, монтаж, обучение, сроки поставки, настройку и резерв запуска.", { optional: true }), "launch_notes")
    ]),
    makeCommonShell("suppliers_procurement", [
      sg(textarea("regularPurchases", profile.sellsGoods || profile.producesGoods ? "Регулярные закупки" : "Расходные материалы и подрядчики", profile.producesGoods ? "Что будет закупаться регулярно: расходные материалы, упаковка, комплектующие и производственные входы?" : profile.sellsGoods ? "Что будет закупаться регулярно: товары, упаковка, комплектующие или расходники?" : "Какие расходные материалы, запчасти, комплектующие, подрядчики или сервисные услуги нужны регулярно?"), "inputs"),
      sg(bool("supplierSelected", "Поставщик выбран", profile.sellsGoods || profile.producesGoods ? "Выбран ли основной поставщик товаров, расходных материалов, оборудования или ключевых услуг?" : "Выбран ли основной поставщик расходников, запчастей, оборудования или ключевых услуг?", { optional: true }), "supplier"),
      sg(bool("alternativeSuppliers", "Запасные поставщики", "Есть ли 2-3 альтернативных поставщика на случай роста цен, задержек или брака?", { optional: true }), "supplier_backup"),
      sg(number("averagePurchaseCost", "Закупочная себестоимость", profile.sellsGoods || profile.producesGoods ? "Какая закупочная себестоимость единицы товара, комплекта или расходников на один заказ?" : "Какая себестоимость расходников, запчастей или материалов на один заказ?", "UZS", { optional: true }), "purchase_price"),
      sg(number("inventoryTurnoverDays", "Запас и оборачиваемость", "На сколько дней продаж/работ нужен минимальный запас и как быстро он оборачивается?", "дней", { optional: true }), "inventory"),
      sg(textarea("supplierPaymentTerms", "Условия закупки", "Какие условия оплаты, сроки доставки, валюта закупки, минимальная партия, возвраты и списания?", { optional: true }), "supplier_terms")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(bool("qualityControlPlan", "Контроль качества", "Есть ли план контроля качества продукта или услуги?", { optional: true }), "quality_control"),
      sg(textarea("sectionNotes.productionCapacity", "Операционный процесс", profile.producesGoods ? "Опишите режим работы, производственный процесс, узкие места, мощность и загрузку." : "Опишите режим работы, процесс обслуживания, узкие места, мощность и загрузку.", { optional: true }), "operations")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", dedupeQuestions([
      sg(select("certificationAwareness", "Понимание документов", "Насколько понятны документы, разрешения и отраслевые требования?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      ...(profile.hasSanitaryRequirements ? [sg(bool("sanitaryRequirementsKnown", "Санитарные требования", "Понятны ли санитарные требования и кто отвечает за их выполнение?"), "sanitation")] : []),
      ...(!profile.hasSanitaryRequirements && profile.sellsGoods ? [sg(textarea("requiredPermits", "Документы поставщика и маркировка", "Какие документы поставщика, накладные, сертификаты/декларации, маркировку, чеки и правила возврата нужно проверить?", { optional: true }), "documents")] : []),
      sg(bool("hasAccountantOrConsultant", "Консультант/бухгалтер", "Есть ли бухгалтер, юрист или профильный консультант?", { optional: true }), "advisor_support"),
      sg(select("experienceLevel", "Опыт", "Какой опыт у команды в этой сфере?", ["low", "medium", "high"]), "team_experience"),
      sg(textarea("requiredPermits", "Документы и разрешения", "Какие документы, договоры, разрешения, уведомления или формы ответственности уже известны?", { optional: true }), "documents"),
      sg(textarea("sectionNotes.complianceExperience", "Compliance-комментарий", "Опишите, какие требования нужно проверить до запуска и кто за это отвечает.", { optional: true }), "compliance_notes")
    ]))
  ];
}


function universalResearchPlanBlock(businessTypeHint: string): InterviewBlock {
  return block(
    "universal_research_plan",
    "Дополнительное уточнение нестандартной модели",
    "Этот блок появляется только после основных разделов и не повторяет вопросы о бизнес-идее, клиентах, продажах и финансировании.",
    [
      sg(select("primaryRevenueSource", "Главная модель выручки", `Для "${businessTypeHint}" уточните, какая модель выручки главная?`, ["service_to_customers", "selling_goods", "producing_and_selling", "subscription_contracts", "project_based", "rental_assets", "mixed"], { optional: true }), "revenue_model"),
      sg(select("deliveryModel", "Как клиент получает ценность", "Клиент приходит к вам, вы выезжаете к клиенту, работаете онлайн или смешанно?", ["visit_our_location", "we_visit_client", "online_delivery", "physical_delivery", "mixed"], { optional: true }), "fulfillment"),
      sg(bool("requiresSpecialEquipment", "Особое оборудование", "Есть ли оборудование, без которого бизнес не может работать?", { optional: true }), "equipment_compatibility"),
      sg(bool("requiresLicenseOrPermit", "Отраслевое разрешение", "Есть ли специальная лицензия/разрешение кроме обычной регистрации и налогов?", { optional: true }), "permits"),
      sg(textarea("otherDetails.researchPlan", "Что еще важно проверить", "Укажите 1-3 нестандартных фактора этого бизнеса: сезонность, место, регуляторика, сырье, оборудование, безопасность, B2B-договоры.", { optional: true }), "validation")
    ]
  );
}

function iceCreamTrailerCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(text("productOrService", "Что продаете", "Что именно будет продаваться: мороженое в рожках, стаканчиках, топпинги, напитки или дополнительные десерты?"), "offer"),
      sg(textarea("sectionNotes.businessIdea", "Концепция точки", "Опишите формат трейлера, отличие от конкурентов, предполагаемую аудиторию и почему люди будут покупать именно у вас.", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomers", "Клиенты", "Кто основные покупатели мороженого?", ["walk_in", "families", "students", "office_workers", "tourists", "children_parents", "event_visitors", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы клиентов", "Откуда будут приходить клиенты?", ["walk_in", "instagram", "telegram", "maps_2gis_google_yandex", "nearby_schools_parks", "events", "recommendations", "repeat_clients", "other"], { optional: true }), "sales_channels"),
      sg(number("monthlyCapacity", "Продаж в месяц", "Сколько порций/рожков планируете продавать в месяц?", "порций/мес."), "monthly_volume"),
      sg(number("averagePrice", "Средний чек", "Какая средняя цена одной продажи с учетом рожка, топпингов и доп. товаров?", "UZS"), "average_ticket"),
      sg(number("utilizationRatePct", "Реалистичная загрузка", "Какой процент от планового объема реально достижим в первые стабильные месяцы?", "%", { optional: true }), "utilization"),
      sg(textarea("sectionNotes.salesMarketing", "Спрос и конкуренты", "Опишите локации конкурентов, цены, поток людей, сезонность и как будете привлекать покупателей.", { optional: true }), "sales_notes")
    ]),
    block("ice_cream_location", "Локация трейлера и инфраструктура", "Для трейлера мороженого главный фактор — поток людей, право стоять в точке и подключение к инфраструктуре.", dedupeQuestions([
      sg(select("trailerLocationType", "Тип локации", "Где будет стоять трейлер?", ["street_spot", "park", "mall_area", "school_university_nearby", "office_area", "tourist_area", "events", "private_land", "not_decided"]), "location_type"),
      sg(select("premisesStatus", "Право на место", "Как оформлено право пользоваться местом?", ["owned", "rent", "sublease", "municipal_permit", "private_agreement", "searching", "not_decided"]), "premises_status"),
      sg(showIfRent(number("monthlyRent", "Плата за место", "Какая ежемесячная аренда/плата за точку или площадку?", "UZS")), "premises_rent"),
      sg(textarea("locationTraffic", "Пешеходный поток", "Опишите ориентир, часы пикового потока, кто проходит мимо и есть ли рядом конкуренты."), "location"),
      sg(bool("infrastructureReady", "Электричество/вода", "Есть ли подключение к электричеству, воде/санитарной зоне, место для хранения и безопасный доступ?"), "infrastructure"),
      sg(select("locationPermitStatus", "Разрешение на точку", "Какой статус разрешения на размещение трейлера/торговой точки?", ["obtained", "in_process", "planned", "not_required", "unknown"]), "documents_awareness"),
      sg(textarea("sectionNotes.premisesInfrastructure", "Детали локации", "Укажите условия точки: договор, срок, коммунальные платежи, ограничения по времени работы, парковка/подъезд и требования арендодателя.", { optional: true }), "location_notes")
    ])),
    block("ice_cream_equipment_suppliers", "Оборудование, сырье и поставщики", "Собираем не допущения, а конкретную смету: трейлер, фризер, холодильники, генератор, POS, сырье и поставщики.", dedupeQuestions([
      sg(select("equipmentCondition", "Состояние оборудования", "Оборудование будет новым, б/у или смешанным?", ["new", "used", "mixed", "not_selected"]), "equipment_condition"),
      sg(multi("iceCreamEquipment", "Оборудование", "Что нужно для запуска трейлера?", ["trailer", "soft_serve_freezer", "chest_freezer", "display_freezer", "generator", "water_tank_sink", "pos_terminal", "cash_register", "umbrella_signage", "storage_fridge", "other"]), "equipment"),
      sg(textarea("equipmentList", "Смета оборудования", "Перечислите оборудование и примерные цены по каждой позиции: трейлер, фризер, холодильник, генератор, POS, инвентарь."), "equipment_compatibility"),
      sg(number("equipmentCapex", "Оборудование и трейлер", "Сколько стоит трейлер, фризер, холодильники, POS и ключевой инвентарь?", "UZS"), "equipment_cost"),
      sg(bool("supplierSelected", "Поставщик выбран", "Выбран ли поставщик оборудования и сырья для мороженого?"), "supplier"),
      sg(bool("supplierOfferAvailable", "КП/прайс", "Есть ли коммерческое предложение, прайс или ссылка на оборудование/сырье?"), "supplier_offer"),
      sg(select("iceCreamSupplierType", "Источник сырья", "Сырье/смеси/рожки закупаются локально, импортно или смешанно?", ["local", "import", "mixed", "unknown"]), "inputs"),
      sg(number("initialInventoryCapex", "Стартовый запас", "Сколько нужно на первый запас смеси, рожков, топпингов, упаковки и воды?", "UZS"), "inventory")
    ])),
    block("ice_cream_unit_economics", "Себестоимость и маржа", "Фиксируем экономику единицы продажи: сколько стоит одна порция и что влияет на маржу.", dedupeQuestions([
      sg(number("rawMaterialCostPerUnit", "Себестоимость порции", "Сколько стоит сырье на одну продажу: смесь, рожок/стаканчик, топпинг, салфетка/упаковка?", "UZS"), "unit_cogs"),
      sg(number("packagingCostPerUnit", "Упаковка на порцию", "Какая стоимость рожка/стаканчика/ложки/салфетки на одну продажу?", "UZS", { optional: true }), "packaging"),
      sg(number("wasteAllowancePct", "Списания", "Какой процент списаний ожидается из-за таяния, брака, остатков или санитарных требований?", "%", { optional: true }), "waste"),
      sg(number("monthlyUtilities", "Коммунальные", "Сколько в месяц ожидается на электричество, воду, генератор/топливо?", "UZS"), "utilities"),
      sg(number("monthlyMarketing", "Маркетинг", "Сколько в месяц планируется на рекламу, вывеску, соцсети и акции?", "UZS", { optional: true }), "marketing"),
      sg(number("monthlyMaintenance", "Сервис оборудования", "Сколько в месяц закладываете на обслуживание фризера, трейлера и инвентаря?", "UZS", { optional: true }), "maintenance")
    ])),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("workingSchedule", "График работы", "Какие дни и часы будет работать трейлер? Кто открывает/закрывает смену и ведет кассу?"), "work_schedule"),
      sg(bool("qualityControlPlan", "Контроль качества", "Есть ли план контроля температуры, чистоты, сроков годности и санитарной обработки?"), "quality_control"),
      sg(textarea("sectionNotes.productionCapacity", "Процесс работы", "Опишите ежедневный процесс: закупка сырья, хранение, подготовка фризера, продажи, закрытие смены, списания и учет.", { optional: true }), "operations")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны регистрация, касса, санитарные требования и разрешение на точку?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(bool("sanitaryRequirementsKnown", "Санитарные требования", "Понятны ли требования к пищевой торговле, хранению, воде, форме сотрудников и санитарной обработке?"), "sanitation"),
      sg(bool("hasAccountantOrConsultant", "Консультант/бухгалтер", "Есть ли бухгалтер, юрист или консультант по общепиту/санитарным требованиям?", { optional: true }), "advisor_support"),
      sg(select("experienceLevel", "Опыт", "Какой опыт у команды в продаже еды, мороженого или уличной торговле?", ["low", "medium", "high"]), "team_experience"),
      sg(textarea("requiredPermits", "Документы и разрешения", "Какие документы уже известны: регистрация, касса, договор места, санитарные требования, разрешение на торговлю, трудовые документы?"), "documents")
    ])
  ];
}

function analyticalLaboratorySpecific(): InterviewBlock[] {
  return [
    block("laboratory_services", "Лаборатория: виды анализов и клиенты", "Фиксируем типы тестов, клиентские сегменты и модель выезда.", [
      sg(multi("testServiceTypes", "Виды анализов/тестов", "Какие виды анализов/тестов планируется проводить?", ["water_quality_express", "water_bacteria_analysis", "water_chemical_analysis", "soil_analysis", "air_quality", "food_safety_test", "environmental_monitoring", "equipment_diagnostics", "other"]), "offer"),
      sg(multi("clientSegments", "Сегменты клиентов", "Кто основные клиенты?", ["cafes_restaurants", "hotels_hospitality", "offices_coworking", "private_homes", "production_facilities", "construction_companies", "municipalities", "other_b2b", "b2c"]), "target_customers"),
      sg(select("mobilityModel", "Модель работы", "Как организована работа?", ["fully_mobile", "mobile_with_office", "stationary_lab", "hybrid_mobile_stationary"]), "operational_model"),
      sg(text("serviceArea", "Зона охвата", "В каком городе/районе будет работать?"), "location"),
      sg(bool("accreditationAvailable", "Аккредитация", "Есть ли аккредитация лаборатории или план по её получению?"), "permits"),
      sg(textarea("sectionNotes.laboratoryServices", "Детали услуги", "Опишите методологию тестирования, время получения результата, формат заключения.", { optional: true }), "service_details")
    ]),
    block("laboratory_equipment_consumables", "Оборудование и расходники лаборатории", "Портативное оборудование, реагенты, калибровка.", [
      sg(multi("labEquipmentList", "Оборудование", "Какое оборудование используется?", ["portable_water_analyzer", "ph_meter", "turbidity_meter", "bacteria_test_kit", "spectrometer", "chromatograph", "field_sampling_kit", "calibration_standards", "other"]), "equipment_list"),
      sg(select("equipmentOwnership", "Статус оборудования", "Оборудование куплено, арендуется или планируется к закупке?", ["owned", "to_purchase", "leasing", "rental", "not_selected"]), "equipment_condition"),
      sg(bool("reagentsSupplierSelected", "Поставщик реагентов", "Выбран ли поставщик реагентов и расходников?"), "supplier"),
      sg(select("reagentSource", "Источник реагентов", "Реагенты отечественные или импортные?", ["local", "import", "mixed", "unknown"]), "currency"),
      sg(number("monthlyReagentsCostUZS", "Стоимость реагентов в месяц", "Ежемесячные затраты на реагенты и расходники.", "UZS", { optional: true }), "inputs"),
      sg(bool("equipmentCalibrationPlan", "Калибровка", "Есть ли план калибровки и поверки оборудования?", { optional: true }), "equipment_service")
    ]),
    block("laboratory_pricing_capacity", "Тарификация и пропускная способность", "Цена теста, количество тестов в месяц.", [
      sg(select("pricingModel", "Модель цены", "Как рассчитывается стоимость услуги?", ["per_test", "per_visit_package", "subscription_b2b", "per_parameter", "mixed"]), "pricing"),
      sg(number("averageTestTicket", "Средний чек теста", "Средняя стоимость одного визита/теста.", "UZS"), "average_ticket"),
      sg(number("testsPerMonth", "Тестов в месяц", "Сколько тестов/выездов планируется в месяц?", "тестов/мес."), "monthly_volume"),
      sg(bool("b2bContractsPlanned", "B2B договоры", "Планируются ли регулярные договоры с B2B клиентами?"), "sales_validation"),
      sg(number("averageContractValueUZS", "Средняя сумма B2B договора", "Средняя сумма ежемесячного B2B договора.", "UZS", { optional: true }), "contract_value"),
      sg(number("testResultDeliveryHours", "Время выдачи результата", "Через сколько часов клиент получает результат?", "часов"), "service_level")
    ]),
    block("laboratory_transport_logistics", "Транспорт и логистика выездов", "Автомобиль, маршруты, время выезда.", [
      sg(select("transportStatus", "Транспорт", "На чем осуществляются выезды?", ["own_car", "rented_car", "leased_car", "public_transport", "mixed", "not_decided"]), "transport"),
      sg(text("serviceZone", "Зона выездов", "В каких районах/городах будут выезды?"), "location"),
      sg(number("avgVisitDurationMinutes", "Длительность выезда", "Сколько минут занимает один выезд?", "минут"), "service_duration"),
      sg(number("maxVisitsPerDay", "Выездов в день", "Максимум выездов в день (один специалист)?", "выездов/день"), "capacity_basis"),
      sg(bool("clientAddressDrivenSchedule", "Планирование по адресам", "Планируется ли маршрутизация выездов по адресам клиентов?", { optional: true }), "operations")
    ]),
    block("laboratory_compliance", "Аккредитация, документы и ответственность", "Разрешения, аккредитация, форма заключения.", [
      sg(select("accreditationStatus", "Статус аккредитации", "Какой статус аккредитации?", ["accredited", "in_process", "planned", "not_required", "unknown"]), "documents_awareness"),
      sg(bool("sanitaryPermitRequired", "Санитарные разрешения", "Нужны ли санитарные разрешения для вида деятельности?"), "sanitary"),
      sg(textarea("reportDocumentFormat", "Формат заключения", "Опишите формат документа/заключения, который выдается клиенту."), "documents"),
      sg(bool("liabilityInsurance", "Страховка ответственности", "Будет ли страховка профессиональной ответственности?", { optional: true }), "liability"),
      sg(select("businessLegalForm", "Форма бизнеса", "Форма регистрации бизнеса?", ["individual_entrepreneur", "llc", "self_employed", "not_decided"]), "legal_form"),
      sg(textarea("requiredPermits", "Разрешения и сертификаты", "Какие разрешения и сертификаты нужны?"), "permits")
    ])
  ];
}

function analyticalLaboratoryCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(text("productOrService", "Услуга", "Какие тесты/анализы и заключения клиент оплачивает?"), "offer"),
      sg(textarea("sectionNotes.businessIdea", "Что уже подтверждено", "Есть ли первые клиенты, оборудование, поставщики реагентов, аккредитация, партнеры или тестовые выезды?", { optional: true }), "validation")
    ]),
    ...analyticalLaboratorySpecific(),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("staffSkills", "Квалификация специалистов", "Какая квалификация нужна лаборантам/специалистам по замерам и кто отвечает за качество результатов?"), "staff_skills"),
      sg(textarea("qualityControlPlan", "Контроль качества", "Как будет проверяться точность тестов, контрольные пробы и повторные измерения?"), "quality")
    ]),
    makeCommonShell("financing", financeQuestions(profile))
  ];
}

function petGroomingCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(multi("groomingServiceTypes", "Основные услуги груминга", "Какие услуги груминга будут основными?", ["bath_and_dry", "haircut", "nail_trimming", "ear_cleaning", "de_shedding", "breed_grooming", "hygiene_care", "other"]), "offer"),
      sg(multi("petTypes", "Животные", "Каких животных будете обслуживать?", ["dogs", "cats", "small_pets", "large_dogs", "sensitive_animals", "other"]), "target_animals"),
      sg(select("groomingOperatingFormat", "Формат работы", "Будет ли модель выездной, салонной или гибридной?", ["mobile_home_visit", "salon", "mobile_van", "hybrid", "not_decided"]), "operational_model"),
      sg(textarea("sectionNotes.businessIdea", "Что уже подтверждено", "Есть ли опыт груминга, первые клиенты, партнеры, выбранная зона, оборудование или поставщики косметики?", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("groomingTargetCustomers", "Основные клиенты", "Кто основные клиенты?", ["pet_owners", "breeders", "vet_clinic_partners", "pet_shop_partners", "repeat_clients", "other"]), "target_customers"),
      sg(multi("bookingChannels", "Запись и каналы", "Как будет организована запись и привлечение клиентов?", ["instagram", "telegram", "phone", "website", "crm", "recommendations", "vet_clinic_partners", "pet_shop_partners", "maps_2gis_google_yandex", "other"]), "sales_channels"),
      sg(number("repeatClientsPct", "Повторные клиенты", "Какой процент повторных клиентов ожидается?", "%", { optional: true }), "repeat_clients"),
      sg(number("groomingVisitsPerMonth", "Визитов в месяц", "Сколько животных/визитов в месяц планируется после запуска?", "визитов/мес."), "monthly_volume"),
      sg(number("averageGroomingTicket", "Средний чек услуги", "Какой средний чек услуги груминга?", "UZS"), "average_ticket"),
      sg(textarea("sectionNotes.salesMarketing", "Спрос и партнеры", "Опишите конкурентов, цены, рекомендации, ветеринарные клиники/зоомагазины как партнеров и план повторных визитов.", { optional: true }), "sales_notes")
    ]),
    makeCommonShell("location", [
      sg(select("groomingOperatingFormat", "Салон/выезд/фургон", "Это будет салон, выезд к клиенту или мобильный фургон?", ["mobile_home_visit", "salon", "mobile_van", "hybrid", "not_decided"]), "premises_status"),
      sg(text("groomingServiceArea", "Зона обслуживания", "Какая зона обслуживания и сколько времени занимает дорога?"), "service_area"),
      sg(textarea("groomingStoragePlan", "Хранение оборудования", "Если выезд: где хранится оборудование, косметика, полотенца и дезинфекция?"), "storage"),
      sg(textarea("travelTimePolicy", "Время дороги", "Как будет учитываться время дороги, опоздания клиента и удаленные районы?", { optional: true }), "transport_support"),
      sg(bool("infrastructureReady", "Санитарная зона", "Если есть салон: есть ли вода, вентиляция, санитарная зона и безопасное место ожидания?", { optional: true }), "infrastructure")
    ]),
    makeCommonShell("equipment_launch", [
      sg(multi("groomingEquipment", "Оборудование", "Какое оборудование нужно: стол, машинки, ножницы, фен, ванна, стерилизатор?", ["grooming_table", "clippers", "scissors", "dryer", "bath", "sterilizer", "towels", "transport_boxes", "other"]), "equipment"),
      sg(multi("groomingConsumables", "Расходники", "Какие расходники нужны постоянно?", ["shampoos", "conditioners", "disinfectants", "gloves", "towels", "ear_cleaning_products", "other"]), "consumables"),
      sg(textarea("groomingSterilizationPlan", "Стерилизация", "Как будет стерилизоваться инструмент и дезинфицироваться рабочая зона?"), "sanitation"),
      sg(bool("supplierSelected", "Поставщик выбран", "Есть ли поставщик косметики, оборудования и расходников?", { optional: true }), "supplier"),
      sg(number("equipmentCapex", "Стоимость запуска", "Сколько стоит оборудование, косметика и стартовый запас расходников?", "UZS", { optional: true }), "equipment_cost")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(number("groomersCount", "Грумеры", "Сколько грумеров нужно на старте?", "чел.", { optional: true }), "staff_count"),
      sg(textarea("groomerQualification", "Квалификация", "Какая квалификация, обучение или опыт требуется грумерам?"), "staff_skills"),
      sg(number("animalsPerGroomerPerDay", "Животных в день", "Сколько животных один грумер может обслужить в день без потери качества?", "животных/день"), "capacity"),
      sg(textarea("groomingQualityControl", "Контроль качества", "Как будет контролироваться качество стрижки, чистоты и коммуникации с клиентом?"), "quality_control"),
      sg(textarea("animalStressSafetyPlan", "Безопасность животного", "Как будет снижаться риск травм, стресса или агрессии животного?"), "safety")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Понимание документов", "Насколько понятны документы, санитарные требования и ответственность перед клиентом?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(bool("groomingClientConsent", "Согласие клиента", "Нужно ли письменное согласие клиента на услугу и правила ответственности?"), "client_consent"),
      sg(bool("animalIntakeForm", "Форма приема животного", "Будет ли форма приема животного с породой, состоянием, противопоказаниями и контактами владельца?"), "documents"),
      sg(textarea("animalConditionPhotoPolicy", "Фиксация состояния", "Как фиксируется состояние животного до услуги: фото, видео, чек-лист, комментарии владельца?"), "liability_evidence"),
      sg(textarea("groomingLiabilityPolicy", "Ответственность", "Как оформляется ответственность за травму, стресс, жалобу или отказ от услуги?"), "liability"),
      sg(bool("sanitaryRequirementsKnown", "Санитарные требования", "Какие санитарные требования по инструменту, воде, дезинфекции и отходам нужно проверить?", { optional: true }), "sanitation")
    ])
  ];
}

function toolRentalCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(multi("rentalToolCategories", "Категории инструмента", "Какие категории инструмента будут сдаваться в аренду?", ["power_tools", "construction_equipment", "welding_equipment", "concrete_mixers", "grinders", "drills_perforators", "ladders_scaffolding", "garden_tools", "generators", "other"]), "offer"),
      sg(select("rentalPricingModel", "Формат аренды", "Какой формат аренды: почасовая, дневная, недельная или смешанная?", ["per_hour", "per_day", "per_week", "monthly_subscription", "mixed"]), "pricing"),
      sg(textarea("sectionNotes.businessIdea", "Что уже подтверждено", "Есть ли поставщики инструмента, пункт выдачи, первые клиенты, договоренности с бригадами или смета закупки?", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("rentalTargetCustomers", "Основные клиенты", "Кто основной клиент: частные мастера, бригады или компании?", ["private_masters", "repair_crews", "small_construction_companies", "contractors", "homeowners", "b2b_contracts", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы продаж", "Какие каналы продаж и привлечения клиентов?", ["instagram", "telegram", "website", "maps_2gis_google_yandex", "recommendations", "b2b_sales", "partners", "repeat_clients", "other"]), "sales_channels"),
      sg(number("rentalOrdersPerMonth", "Заказов аренды в месяц", "Сколько заказов аренды в месяц планируется?", "заказов/мес."), "monthly_volume"),
      sg(number("averageRentalTicket", "Средний чек аренды", "Какой средний чек одной аренды?", "UZS"), "average_ticket"),
      sg(bool("b2bAgreements", "B2B-договоры", "Есть ли B2B-договоры или предварительные договоренности со строительными бригадами/компаниями?", { optional: true }), "b2b_contracts"),
      sg(number("repeatOrdersPct", "Повторные клиенты", "Какой процент повторных клиентов ожидается?", "%", { optional: true }), "repeat_clients")
    ]),
    makeCommonShell("location", [
      sg(select("rentalPremisesStatus", "Пункт выдачи/склад", "Нужен ли пункт выдачи или склад?", ["owned", "rent", "sublease", "storage_pickup_only", "searching", "not_decided"]), "premises_status"),
      sg(number("premisesAreaSqm", "Площадь хранения", "Какая площадь хранения нужна для парка инструмента?", "м2", { optional: true }), "premises_area"),
      sg(bool("rentalInfrastructureReady", "Зона проверки и подъезд", "Есть ли зона проверки инструмента при выдаче/возврате и удобный подъезд для клиентов/доставки?", { optional: true }), "infrastructure"),
      sg(textarea("storageSecurityPlan", "Безопасность склада", "Как будет организована безопасность склада: замки, камеры, доступ сотрудников, пожарная безопасность?"), "safety"),
      sg(select("deliveryModel", "Доставка как поддержка", "Как будет организована доставка инструмента, если клиенту нужен выезд?", ["pickup_only", "own_delivery", "taxi_delivery", "courier_partner", "mixed", "not_decided"], { optional: true }), "delivery_support")
    ]),
    makeCommonShell("equipment_launch", [
      sg(number("rentalFleetSize", "Количество единиц", "Сколько единиц инструмента будет на старте?", "ед."), "capacity_basis"),
      sg(textarea("rentalEquipmentList", "Состав парка", "Перечислите основные позиции: перфораторы, шлифмашины, сварочные аппараты, бетономешалки, генераторы и т.д."), "equipment"),
      sg(select("equipmentCondition", "Состояние парка", "Инструмент будет новым, б/у или смешанным?", ["new", "used", "mixed", "not_selected"]), "equipment_condition"),
      sg(number("equipmentCapex", "Закупочная стоимость парка", "Какова закупочная стоимость стартового парка инструмента?", "UZS", { optional: true }), "equipment_cost"),
      sg(textarea("toolMaintenancePlan", "Ремонт и обслуживание", "Как будет организован ремонт, профилактика и обслуживание инструмента?"), "equipment_service"),
      sg(number("maintenanceCostPct", "Износ и ремонт", "Какой процент выручки или стоимости парка заложить на износ, ремонт и списания?", "%", { optional: true }), "asset_utilization")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("toolTrackingSystem", "Учет аренды", "Как будет вестись учет выдачи, возврата, состояния, сроков и истории ремонта?"), "operations"),
      sg(textarea("handoverInspectionProcess", "Проверка состояния", "Кто и как проверяет состояние инструмента при выдаче и возврате?"), "quality_control"),
      sg(textarea("clientSafetyInstructions", "Инструктаж клиента", "Какие инструкции по безопасному использованию инструмента будет получать клиент?"), "safety"),
      sg(textarea("workingSchedule", "График пункта выдачи", "Какой график работы пункта выдачи и кто отвечает за прием/выдачу?", { optional: true }), "work_schedule")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Понимание документов", "Насколько понятны договоры, залог, чеки и ответственность по аренде?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(textarea("depositPolicy", "Залог", "Как работает залог: сумма, возврат, удержание при повреждении или просрочке?"), "deposit"),
      sg(bool("rentalClientContracts", "Договор аренды", "Будет ли договор аренды инструмента с клиентом?"), "documents"),
      sg(bool("handoverActRequired", "Акт приема-передачи", "Будет ли акт приема-передачи с состоянием инструмента, комплектностью и сроком возврата?"), "handover_act"),
      sg(select("rentalPaymentFlow", "Оплата", "Как оформляются оплата аренды и залог?", ["cash", "card_terminal", "bank_transfer", "online_payment", "mixed", "not_decided"]), "payment"),
      sg(textarea("damageLossPolicy", "Поломка, кража или невозврат", "Кто отвечает за поломку, кражу, потерю, просрочку или невозврат инструмента?"), "liability")
    ])
  ];
}


function autoServiceCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(select("autoServiceFormat", "Формат автосервиса", "Какой формат автосервиса вы планируете?", autoServiceFormatOptions), "offer"),
      sg(multi("serviceCategories", "Услуги", "Какие услуги будут основными?", ["diagnostics", "oil_change", "suspension", "electrical", "tire_service", "detailing", "minor_repairs", "other"]), "service_mix"),
      sg(textarea("sectionNotes.businessIdea", "Что подтверждено", "Опишите площадку, опыт мастера, первые заявки, условия бокса или партнерство с большим сервисом.", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomerSegments", "Клиенты", "Кто основные клиенты автосервиса?", ["private_car_owners", "taxi_drivers", "taxi_fleets", "corporate_fleets", "commercial_vehicle_drivers", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы", "Какие каналы привлечения клиентов?", ["walk_in", "maps_2gis_google_yandex", "instagram", "telegram", "recommendations", "partners", "b2b_sales", "repeat_visits", "host_business_traffic", "other"], { optionShowIf: { host_business_traffic: { autoServiceFormat: hostBusinessTrafficFormats } } }), "sales_channels"),
      sg(showIfHostBusinessTraffic(bool("hostServiceTrafficAgreement", "Договоренность о передаче клиентов", "Есть ли договоренность с владельцем большого сервиса о передаче клиентов вашему боксу?")), "parent_service_flow_agreement"),
      sg(showIfHostBusinessTraffic(textarea("parentServiceCustomerFlow", "Поток большого сервиса", "Есть ли договоренность, что большой автосервис или площадка будет передавать клиентов вашему боксу? На каких условиях?", { optional: true })), "parent_service_flow_details"),
      sg(showIfHostBusinessTraffic(number("hostServiceExpectedClientsPerDay", "Поток от партнера", "Сколько клиентов в день может приходить от большого сервиса?", "клиентов/день", { optional: true })), "parent_service_flow_volume"),
      sg(number("plannedVolumeMonthly", "Заказов в месяц", "Сколько заказов/автомобилей планируется обслуживать в месяц?", "заказов/мес."), "monthly_volume"),
      sg(number("dailyServiceCapacity", "Авто в день", "Если считали от дневной мощности, сколько автомобилей/заказов один бокс или команда может обслужить в день?", "авто/день", { optional: true }), "daily_volume"),
      sg(number("averageServiceTicket", "Средний чек", "Какой средний чек услуги автосервиса?", "UZS"), "average_ticket"),
      sg(multi("mainRevenueServices", "Основной доход", "Какие услуги будут давать основной доход?", ["diagnostics", "oil_change", "filters", "suspension", "brakes", "electrical", "air_conditioning", "tire_service", "detailing", "minor_repair", "parts_resale", "other"], { optional: true }), "revenue_drivers"),
      sg(textarea("demandValidation", "Подтверждение спроса", "Есть ли подтверждение спроса: предварительные клиенты, звонки, заявки, договоренности с таксопарками или автопарками?", { optional: true }), "demand_validation"),
      sg(showIfHostBusinessTraffic(select("clientPaymentFlow", "Деньги клиента", "Клиент платит вам напрямую, через большой сервис или по смешанной модели?", ["direct_to_me", "through_parent_service", "revenue_share", "mixed", "not_decided"])), "payment"),
      sg(showIfHostBusinessTraffic(bool("hostServiceWrittenAgreement", "Письменное соглашение", "Есть ли письменная договоренность с большим сервисом?", { optional: true })), "written_agreement"),
      sg(showIfMobileService(text("mobileServiceZone", "Зона обслуживания", "Какая зона обслуживания для выездного сервиса?")), "service_area"),
      sg(showIfMobileService(number("mobileVisitsPerDay", "Выездов в день", "Сколько выездов в день реально выполнить?", "выездов/день", { optional: true })), "capacity"),
      sg(showIfMobileService(textarea("travelTimeAccounting", "Время дороги", "Как учитывается время дороги между клиентами?", { optional: true })), "operations"),
      sg(showIfMobileService(bool("mobileEquipmentReady", "Транспорт и мобильное оборудование", "Есть ли транспорт и мобильное оборудование для выездной работы?", { optional: true })), "equipment")
    ]),
    makeCommonShell("location", [
      sg(select("premisesStatus", "Помещение/бокс", "Какой статус рабочего места или бокса?", ["rent", "sublease", "partnership", "owned", "searching", "not_decided"]), "premises_status"),
      sg(select("boxLeaseModel", "Модель пользования боксом", "На каких условиях используется бокс или рабочее место?", ["rent", "sublease", "revenue_share", "partnership", "verbal_agreement", "not_decided"]), "lease_model"),
      sg(textarea("boxLeaseTerms", "Условия бокса", "Опишите ставку, депозит, доступ к клиентам, коммунальные платежи, ограничения и включенную инфраструктуру."), "lease_terms"),
      sg(bool("subleaseAllowed", "Право субаренды", "Письменно подтверждено право аренды/субаренды или партнерства?", { optional: true }), "sublease_right"),
      sg(multi("includedInfrastructure", "Инфраструктура", "Что включено в площадку?", ["lift", "pit", "compressed_air", "electricity", "water", "waiting_area", "security", "other"], { optional: true }), "infrastructure")
    ]),
    makeCommonShell("equipment_launch", [
      sg(textarea("equipmentList", "Оборудование", "Какое оборудование и инструмент нужны для выбранных работ?"), "equipment"),
      sg(select("equipmentOwnership", "Статус оборудования", "Оборудование уже есть, покупается, арендуется или берется в лизинг?", ["owned", "buy", "rent", "leasing", "mixed", "not_decided"]), "equipment_condition"),
      sg(textarea("equipmentServiceSupport", "Гарантия и сервис", "Есть ли гарантия, сервис, запчасти и обучение по оборудованию в Узбекистане?", { optional: true }), "equipment_support"),
      sg(textarea("wasteOilHandling", "Отработанное масло/отходы", "Кто отвечает за сбор, хранение и передачу отработанного масла, фильтров, жидкостей, химии и ветоши: вы или площадка/большой автосервис?", { optional: true }), "waste_storage"),
      sg(textarea("wasteOilHandlingPlan", "Отработанные масла", "Если есть замена масла или жидкости, как будет организован сбор и утилизация отходов?", { optional: true }), "waste_handling")
    ]),
    makeCommonShell("suppliers_procurement", [
      sg(textarea("consumables", "Расходники и запчасти", "Какие расходники, масла, фильтры, запчасти, химия, перчатки, крепеж или мелкие детали нужны постоянно?"), "consumables"),
      sg(select("consumablesSource", "Поставщики расходников", "Поставщики расходников/запчастей локальные, импортные или смешанные?", ["local", "imported", "mixed", "not_decided"], { optional: true }), "supplier"),
      sg(bool("supplierSelected", "Поставщик выбран", "Выбран ли основной поставщик расходников, масел, фильтров, запчастей или оборудования?", { optional: true }), "supplier"),
      sg(bool("alternativeSuppliers", "Запасные поставщики", "Есть ли 2-3 альтернативных поставщика по ключевым расходникам и деталям?", { optional: true }), "supplier_backup"),
      sg(select("supplierCurrency", "Валюта поставщиков", "В какой валюте закупаются расходники, запчасти или оборудование?", ["UZS", "USD", "EUR", "CNY", "RUB", "other"], { optional: true }), "currency"),
      sg(bool("foreignCurrencyPurchases", "Валютные закупки", "Будут ли закупки в иностранной валюте или с валютной привязкой?", { optional: true }), "currency_exposure"),
      sg(number("averagePurchaseCost", "Средняя себестоимость заказа", "Какая средняя себестоимость расходников/запчастей на один заказ?", "UZS", { optional: true }), "purchase_price"),
      sg(textarea("supplierPaymentTerms", "Условия оплаты поставщикам", "Какие условия оплаты: предоплата, отсрочка, покупка под клиента, минимальный заказ, доставка и возврат брака?", { optional: true }), "supplier_terms"),
      sg(number("initialInventoryCapex", "Стартовый запас", "Какой запас расходников/запчастей нужен на первый месяц?", "UZS", { optional: true }), "inventory")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("staffSkills", "Квалификация", "Какая квалификация нужна мастеру/команде?"), "staff_skills"),
      sg(textarea("qualityControlPlan", "Контроль качества", "Как будет контролироваться качество работ, гарантия и жалобы?"), "quality_control"),
      sg(textarea("warrantyPolicy", "Гарантия", "Какую гарантию будете давать на работы и запчасти?", { optional: true }), "warranty")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны договоры с площадкой, касса, ответственность и отраслевые требования?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(textarea("requiredPermits", "Документы", "Какие документы, договоры, чеки, трудовые документы и требования площадки нужно проверить?"), "documents"),
      sg(textarea("damageLiability", "Ответственность", "Кто отвечает за повреждение автомобиля, некачественную работу, гарантию или претензию?"), "liability"),
      sg(select("experienceLevel", "Опыт", "Какой опыт у команды в автосервисе?", ["low", "medium", "high"]), "team_experience")
    ])
  ];
}

function carWashCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [...baseIdentityQuestions(), sg(select("carWashFormat", "Формат автомойки", "Какой формат автомойки: ручная, самообслуживание, автоматическая, detailing или мобильная?", ["manual_wash", "self_service_wash", "automatic_wash", "detailing", "mobile_wash", "mixed"]), "offer"), sg(multi("washServiceTypes", "Услуги мойки", "Какие услуги будут основными?", ["exterior_wash", "interior_cleaning", "engine_wash", "polishing", "detailing", "subscription", "fleet_service", "other"]), "service_mix")]),
    makeCommonShell("sales", [sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты автомойки?", ["walk_in", "office_workers", "taxi_fleets", "corporate_clients", "repeat_clients", "partners", "other"]), "target_customers"), sg(multi("customerAcquisitionChannels", "Каналы продаж", "Какие каналы привлечения клиентов?", ["maps_2gis_google_yandex", "instagram", "telegram", "recommendations", "location_traffic", "b2b_sales", "partners", "other"]), "sales_channels"), sg(number("carsPerDayStart", "Авто в день на старте", "Сколько машин в день ожидается на старте?", "авто/день"), "monthly_volume"), sg(number("averageWashTicket", "Средний чек", "Какой средний чек мойки?", "UZS"), "average_ticket"), sg(bool("b2bFleetAgreements", "B2B-автопарки", "Есть ли договоренности с такси, доставкой или корпоративными автопарками?", { optional: true }), "b2b_contracts")]),
    makeCommonShell("location", [sg(select("premisesStatus", "Площадка/помещение", "Какой статус помещения или площадки автомойки?", ["owned", "rent", "searching", "sublease", "not_decided", "other"]), "premises_status"), sg(number("washBaysCount", "Посты", "Сколько постов автомойки планируется?", "постов"), "capacity_basis"), sg(textarea("locationTraffic", "Подъезд и ожидание", "Есть ли удобный подъезд, место ожидания, парковка и видимость с дороги?"), "location"), sg(text("waterSource", "Вода", "Как будет обеспечена вода?"), "water"), sg(bool("waterDrainageReady", "Слив", "Есть ли вода, слив и фильтрация/канализация?"), "infrastructure"), sg(textarea("wastewaterHandling", "Стоки и экология", "Есть ли ограничения по стокам и как будет организована фильтрация?"), "environment")]),
    makeCommonShell("equipment_launch", [sg(multi("carWashEquipment", "Оборудование", "Какое оборудование нужно для постов автомойки?", ["pressure_washers", "vacuum_cleaners", "compressor", "water_recycling", "foam_generator", "pos", "cameras", "other"]), "equipment"), sg(multi("washChemicals", "Автохимия", "Какие расходники и автохимия нужны постоянно?", ["shampoo", "foam", "wax", "interior_chemicals", "microfiber", "ppe", "other"]), "consumables"), sg(bool("supplierSelected", "Поставщик", "Есть ли поставщики оборудования и автохимии?", { optional: true }), "supplier"), sg(number("equipmentCapex", "Оборудование CapEx", "Сколько стоит оборудование и монтаж?", "UZS", { optional: true }), "equipment_cost")]),
    makeCommonShell("operations", [sg(staff(), "staffing"), sg(number("teamSizePerShift", "Команда на смену", "Сколько сотрудников нужно на смену?", "чел.", { optional: true }), "staff_count"), sg(textarea("workingSchedule", "График", "Какой график работы и смены?"), "work_schedule"), sg(textarea("qualityControlPlan", "Контроль качества", "Как будет контролироваться качество мойки и жалобы клиентов?"), "quality_control"), sg(bool("staffTrainingSafety", "Обучение безопасности", "Будет ли обучение по оборудованию, воде, химии и электробезопасности?", { optional: true }), "safety")]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [sg(select("certificationAwareness", "Документы", "Насколько понятны документы, аренда, вода/слив, касса и требования по автохимии?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(textarea("requiredPermits", "Разрешения", "Какие требования по воде, сливу, охране труда, пожарной безопасности и договору аренды нужно проверить?"), "documents"), sg(bool("cashRegisterNeeded", "Касса/чеки", "Понятно ли, как будут оформляться чеки и B2B-акты?", { optional: true }), "payment"), sg(bool("chemicalSafetyRules", "Химия и безопасность", "Есть ли правила хранения и использования автохимии?", { optional: true }), "safety")])
  ];
}

function cleaningCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [...baseIdentityQuestions(), sg(multi("cleaningServiceTypes", "Виды клининга", "Какие услуги клининга будут основными?", ["apartment_cleaning", "house_cleaning", "office_cleaning", "commercial_cleaning", "deep_cleaning", "post_construction_cleaning", "window_cleaning", "disinfection", "other"]), "offer"), sg(select("cleaningBusinessModel", "Модель работы", "Как будет организована услуга?", ["mobile_team", "on_site_team", "b2b_contracts", "b2c_orders", "subscription_cleaning", "mixed"]), "operational_model")]),
    makeCommonShell("sales", [sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты?", ["apartments", "private_houses", "offices", "shops", "cafes_restaurants", "warehouses", "construction_companies", "property_managers", "corporate_clients", "repeat_clients", "other"]), "target_customers"), sg(multi("customerAcquisitionChannels", "Каналы", "Какие каналы привлечения клиентов?", ["instagram", "telegram", "website", "maps_2gis_google_yandex", "recommendations", "b2b_sales", "partners", "repeat_clients", "other"]), "sales_channels"), sg(number("dailyOrdersCapacity", "Заказов в день", "Сколько объектов/заказов команда может обслужить в день?", "заказов/день"), "monthly_volume"), sg(number("averageCleaningTicket", "Средний чек", "Какой средний чек одного заказа?", "UZS"), "average_ticket"), sg(select("pricingModel", "Модель цены", "Как считается цена клининга?", ["per_order", "per_sqm", "hourly", "subscription", "mixed"]), "pricing_model"), sg(select("contractModel", "Договоры", "Будут ли регулярные договоры или разовые заказы?", ["one_time_orders", "regular_contracts", "subscription", "mixed", "not_decided"]), "contract_model")]),
    makeCommonShell("location", [sg(select("premisesStatus", "Офис/склад", "Нужно ли помещение для офиса, склада инвентаря или хранения химии?", ["no_office_needed", "storage_only", "small_office", "office_and_storage", "not_decided"]), "premises_status"), sg(text("serviceArea", "Зона обслуживания", "Какая зона обслуживания клининговой команды?"), "service_area"), sg(select("transportNeeds", "Транспорт команды", "Как команда будет добираться до объектов?", ["not_needed", "own_car", "rented_vehicle", "taxi_delivery", "mixed", "not_decided"]), "transport_support"), sg(textarea("storageNeeds", "Хранение", "Где будет храниться оборудование, химия и инвентарь?"), "storage")]),
    makeCommonShell("equipment_launch", [sg(multi("equipmentList", "Оборудование", "Какое оборудование нужно?", ["professional_vacuums", "wet_vacuums", "steam_cleaner", "floor_scrubber", "ladders", "cleaning_carts", "ppe", "other"]), "equipment"), sg(multi("cleaningChemicals", "Расходники", "Какие расходники нужны постоянно?", ["cleaning_agents", "disinfectants", "gloves", "masks", "wipes", "trash_bags", "uniforms", "other"]), "consumables"), sg(bool("supplierSelected", "Поставщик", "Есть ли поставщики оборудования и химии?", { optional: true }), "supplier"), sg(textarea("chemicalStorageSafety", "Хранение химии", "Как будет организовано безопасное хранение химии?"), "safety")]),
    makeCommonShell("operations", [sg(staff(), "staffing"), sg(number("teamSizePerOrder", "Размер бригады", "Сколько человек в одной бригаде?", "чел."), "staff_count"), sg(textarea("workingSchedule", "График", "Какой график работы и распределение заказов?"), "work_schedule"), sg(textarea("qualityControlPlan", "Контроль качества", "Как будет контролироваться качество уборки?"), "quality_control"), sg(bool("staffTrainingSafety", "Обучение безопасности", "Есть ли обучение персонала по химии и безопасности?", { optional: true }), "safety")]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [sg(select("certificationAwareness", "Документы", "Насколько понятны договоры, акты, ответственность и требования по химии?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(bool("clientContracts", "Договоры с клиентами", "Будут ли договоры с клиентами?"), "documents"), sg(bool("workCompletionActs", "Акты работ", "Будут ли акты выполненных работ?", { optional: true }), "handover_act"), sg(textarea("damageLiability", "Ответственность", "Кто отвечает за повреждение имущества клиента?"), "liability"), sg(bool("chemicalSafetyRules", "Правила по химии", "Есть ли правила безопасного использования химии?"), "safety"), sg(textarea("requiredPermits", "Документы и требования", "Какие документы, договоры, чек-листы, требования по химии и охране труда нужно проверить?", { optional: true }), "permits")])
  ];
}

function laundryCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(select("laundryServiceModel", "Модель прачечной", "Какая модель будет основной?", ["self_service_laundry", "assisted_wash_dry", "wash_dry_fold", "mixed", "other"]), "offer"),
      sg(multi("laundryServiceTypes", "Услуги", "Какие услуги будут основными?", ["wash_cycle", "dry_cycle", "detergent_sales_addon", "assisted_laundry", "per_kg_service", "ironing_addon", "other"]), "service_mix")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты прачечной?", ["nearby_residents", "students", "renters", "hostels", "small_hotels", "salons", "cafes_as_clients", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы", "Как клиенты узнают о прачечной?", ["location_signage", "maps_2gis_google_yandex", "instagram", "telegram", "nearby_partners", "recommendations", "other"]), "sales_channels"),
      sg(number("laundryCyclesPerDay", "Циклов в день", "Сколько циклов стирки и сушки планируется в день после выхода на стабильную загрузку?", "циклов/день"), "monthly_volume"),
      sg(number("averageLaundryTicket", "Средний чек", "Какой средний чек клиента за стирку, сушку и дополнительные услуги?", "UZS"), "average_ticket"),
      sg(number("repeatClientsPct", "Повторные клиенты", "Какой процент клиентов будет возвращаться регулярно?", "%", { optional: true }), "repeat_clients")
    ]),
    makeCommonShell("location", [
      sg(select("premisesStatus", "Помещение", "Какой статус помещения для прачечной?", ["owned", "rent", "searching", "sublease", "not_decided", "other"]), "premises_status"),
      sg(number("premisesAreaSqm", "Площадь", "Какая площадь нужна для машин, сушки, ожидания и хранения расходников?", "м2", { optional: true }), "premises_area"),
      sg(textarea("locationTraffic", "Локация", "Опишите локацию: жилой массив, общежития, арендаторы, парковка, видимость и доступность."), "location"),
      sg(bool("waterDrainageReady", "Вода и канализация", "Есть ли вода, слив и канализация, подходящие для прачечной?"), "infrastructure"),
      sg(bool("powerSupplyReady", "Электрическая мощность", "Достаточно ли электрической мощности для стиральных и сушильных машин?"), "power_capacity"),
      sg(textarea("ventilationPlan", "Вентиляция", "Как будет организована вентиляция, влажность и тепло от сушильных машин?"), "ventilation")
    ]),
    makeCommonShell("equipment_launch", [
      sg(multi("laundryEquipment", "Оборудование", "Какое оборудование нужно на старте?", ["professional_washers", "professional_dryers", "water_filters", "payment_terminal", "coin_or_card_system", "cctv", "folding_tables", "waiting_area", "other"]), "equipment"),
      sg(number("laundryMachinesCount", "Стиральные машины", "Сколько профессиональных стиральных машин будет на старте?", "шт."), "capacity_basis"),
      sg(number("dryersCount", "Сушильные машины", "Сколько сушильных машин будет на старте?", "шт."), "capacity_basis_secondary"),
      sg(multi("laundryConsumables", "Расходники", "Какие расходники будут нужны постоянно?", ["detergent_capsules", "washing_powder", "fabric_softener", "laundry_bags", "disinfectants", "filters", "other"]), "consumables"),
      sg(textarea("equipmentServiceSupport", "Сервис оборудования", "Кто будет обслуживать машины, как быстро устраняются поломки и есть ли запасные части?"), "equipment_service")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(select("operationalModel", "Режим работы", "Как будет работать прачечная: полностью самообслуживание, администратор на месте или смешанная модель?", ["self_service", "administrator_on_site", "mixed", "not_decided"]), "operational_model"),
      sg(textarea("workingSchedule", "График", "Какой график работы, уборки помещения, пополнения расходников и закрытия смены?"), "work_schedule"),
      sg(textarea("qualityControlPlan", "Контроль качества", "Как будет контролироваться чистота, исправность машин, качество стирки и жалобы клиентов?"), "quality_control"),
      sg(textarea("paymentSettlementTerms", "Оплата", "Как будет работать безналичная оплата, терминалы, возвраты и контроль выручки?", { optional: true }), "payment")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны аренда, коммунальные подключения, санитарные правила и ответственность перед клиентом?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(textarea("requiredPermits", "Требования", "Какие требования по воде, канализации, электрике, пожарной безопасности, санитарии и кассе нужно проверить?"), "documents"),
      sg(textarea("damageLiability", "Ответственность", "Кто отвечает за повреждение, потерю, окрашивание или усадку белья клиента?"), "liability"),
      sg(bool("clientContracts", "Правила сервиса", "Будут ли публичные правила сервиса: что можно стирать, ответственность, возвраты и претензии?", { optional: true }), "service_terms")
    ])
  ];
}


function deviceRepairCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(multi("deviceTypes", "Устройства", "Какие устройства будете ремонтировать?", ["smartphones", "tablets", "laptops", "desktop_computers", "smart_watches", "gaming_consoles", "other"]), "offer"),
      sg(multi("repairServiceTypes", "Виды ремонта", "Какие виды ремонта будут основными?", ["screen_replacement", "battery_replacement", "charging_port_repair", "keyboard_replacement", "water_damage_cleaning", "software_setup", "diagnostics", "preventive_cleaning", "other"]), "service_mix"),
      sg(select("repairServiceFormat", "Формат сервиса", "Как будет работать сервис: точка приема, сервисный центр, выезд или смешанная модель?", ["service_center", "acceptance_point", "mobile_service", "courier_pickup", "mixed", "other"]), "operational_model")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты сервиса ремонта техники?", ["individuals", "offices", "small_companies", "students", "corporate_clients", "repeat_clients", "partners", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы", "Какие каналы привлечения клиентов?", ["maps_2gis_google_yandex", "instagram", "telegram", "website", "recommendations", "walk_in", "b2b_sales", "partners", "other"]), "sales_channels"),
      sg(number("repairOrdersPerMonth", "Заказов ремонта", "Сколько заказов ремонта в месяц планируется после выхода на стабильную загрузку?", "заказов/мес."), "monthly_volume"),
      sg(number("averageRepairTicket", "Средний чек ремонта", "Какой средний чек одного ремонта или диагностики?", "UZS"), "average_ticket"),
      sg(select("diagnosticsPricing", "Диагностика", "Диагностика будет платной, бесплатной или засчитываться в стоимость ремонта?", ["paid", "free", "included_if_repaired", "mixed", "not_decided"], { optional: true }), "pricing_model")
    ]),
    makeCommonShell("location", [
      sg(select("premisesStatus", "Помещение", "Какой статус помещения для сервисного центра?", ["owned", "rent", "searching", "sublease", "online_only", "not_decided", "other"]), "premises_status"),
      sg(showIfRent(number("monthlyRent", "Аренда в месяц", "Какая ежемесячная стоимость аренды/субаренды помещения? Если договор еще не подписан, укажите ожидаемый лимит аренды.", "UZS")), "premises_rent"),
      sg(textarea("locationTraffic", "Локация", "Опишите локацию: рядом рынок электроники, офисы, жилой массив, метро, ТЦ или вуз?"), "location"),
      sg(textarea("serviceArea", "Зона обслуживания", "Если будет курьерский забор или выезд мастера, какая зона обслуживания и как учитывается время дороги?", { optional: true }), "service_area"),
      sg(bool("securityStorageReady", "Безопасное хранение", "Есть ли место для безопасного хранения устройств клиентов и запчастей?"), "security"),
      sg(bool("powerSupplyReady", "Электричество", "Достаточно ли электропитания и рабочих мест для диагностики, пайки и тестирования?", { optional: true }), "infrastructure")
    ]),
    makeCommonShell("equipment_launch", [
      sg(multi("repairEquipment", "Оборудование", "Какое оборудование нужно для ремонта и диагностики?", ["soldering_station", "microscope", "multimeter", "dc_power_supply", "screen_separator", "ultrasonic_cleaner", "software_tools", "toolkits", "pos", "cctv", "other"]), "equipment"),
      sg(multi("sparePartsPlan", "Запчасти", "Какие запчасти нужны на старте?", ["screens", "batteries", "charging_ports", "keyboards", "cables", "connectors", "phone_cases", "screen_protectors", "chargers", "used_phones", "adhesives", "thermal_paste", "other"]), "consumables"),
      sg(number("initialInventoryCostUZS", "Стартовый запас", "Сколько нужно на стартовый запас запчастей, аксессуаров и расходников?", "UZS", { optional: true }), "initial_inventory"),
      sg(number("averagePurchaseCost", "Средняя закупка", "Какая средняя закупочная цена запчасти/аксессуара или прямой расход на один ремонт?", "UZS", { optional: true }), "purchase_price"),
      sg(number("averageMarkupPct", "Наценка", "Какая средняя наценка на запчасти/аксессуары или маржа по ремонту?", "%", { optional: true }), "margin"),
      sg(bool("supplierSelected", "Поставщики", "Есть ли поставщики запчастей и расходников?", { optional: true }), "supplier"),
      sg(bool("alternativeSuppliers", "Альтернативы", "Есть ли 2-3 альтернативных поставщика по ключевым запчастям?", { optional: true }), "supplier_backup"),
      sg(textarea("partsInventoryControl", "Учет запчастей", "Как будет вестись учет запчастей, серийных номеров, брака и гарантийных замен?"), "inventory_control")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("technicianQualifications", "Квалификация мастеров", "Какая квалификация нужна мастерам: пайка, диагностика плат, Apple/Android, ноутбуки, ПО?"), "staff_skills"),
      sg(number("repairsPerTechnicianPerDay", "Ремонтов на мастера", "Сколько устройств один мастер может качественно ремонтировать в день?", "заказов/день", { optional: true }), "staff_capacity"),
      sg(textarea("qualityControlPlan", "Контроль качества", "Как будет проверяться качество ремонта перед выдачей устройства клиенту?"), "quality_control"),
      sg(textarea("workingSchedule", "График", "Какой график работы точки, приема устройств, выдачи и связи с клиентом?", { optional: true }), "work_schedule")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны договор, прием устройства, гарантия, чеки и ответственность за данные клиента?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(bool("deviceIntakeForm", "Акт приема устройства", "Будет ли акт приема устройства с описанием состояния, комплектации, пароля/доступа и заявленной неисправности?"), "handover_act"),
      sg(textarea("deviceConditionPhotoFixation", "Фиксация состояния", "Как фиксируется состояние устройства до ремонта: фото, чек-лист, серийный номер, IMEI?"), "quality_control"),
      sg(textarea("repairWarrantyPolicy", "Гарантия", "Какая гарантия дается на работу и запчасти, и что не входит в гарантию?"), "warranty"),
      sg(textarea("dataLiabilityPolicy", "Данные клиента", "Кто отвечает за потерю данных, доступ к устройству, резервное копирование и конфиденциальность?"), "liability"),
      sg(textarea("requiredPermits", "Документы и чеки", "Какие документы нужны: регистрация, касса/чеки, договоры с B2B-клиентами, гарантийные условия, трудовые документы?", { optional: true }), "documents")
    ])
  ];
}


function childrenClothingRetailBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(withLocalizedCopy(multi("productCategories", "Категории товаров", "Какие категории детской одежды будут продаваться?", ["everyday_clothing", "outerwear", "shoes", "school_uniform", "baby_clothes", "accessories", "seasonal_collection", "other"]), {
        ru: { label: "Категории товаров", question: "Какие категории детской одежды будут продаваться?" },
        uz: { label: "Tovar kategoriyalari", question: "Bolalar kiyimining qaysi kategoriyalari sotiladi?" },
        en: { label: "Product categories", question: "Which children's clothing categories will be sold?" }
      }), "offer"),
      sg(withLocalizedCopy(select("operationalModel", "Формат продаж", "Какой формат магазина планируется?", ["location_based_retail", "hybrid_offline_online", "online_only", "marketplace", "not_decided"]), {
        ru: { label: "Формат продаж", question: "Какой формат магазина планируется?" },
        uz: { label: "Savdo formati", question: "Do'konning qaysi formati rejalashtirilgan?" },
        en: { label: "Sales format", question: "Which store format is planned?" }
      }), "operational_model"),
      sg(withLocalizedCopy(textarea("sectionNotes.businessIdea", "Подтверждение идеи", "Что уже подтверждено: район, поставщики, тестовые продажи, ассортимент, цены конкурентов, Instagram/Telegram интерес?", { optional: true }), {
        ru: { label: "Подтверждение идеи", question: "Что уже подтверждено: район, поставщики, тестовые продажи, ассортимент, цены конкурентов, Instagram/Telegram интерес?" },
        uz: { label: "G'oyani tasdiqlash", question: "Nimalar tasdiqlangan: tuman, yetkazib beruvchilar, test savdolar, assortiment, raqobatchilar narxlari, Instagram/Telegram qiziqishi?" },
        en: { label: "Idea validation", question: "What has already been validated: district, suppliers, test sales, assortment, competitor prices, Instagram/Telegram interest?" }
      }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(withLocalizedCopy(multi("targetCustomerSegments", "Основные покупатели", "Кто основные покупатели?", ["parents", "families_with_children", "pregnant_women", "gift_buyers", "neighborhood_residents", "online_customers", "other"]), {
        ru: { label: "Основные покупатели", question: "Кто основные покупатели?" },
        uz: { label: "Asosiy xaridorlar", question: "Asosiy xaridorlar kimlar?" },
        en: { label: "Primary customers", question: "Who are the primary customers?" }
      }), "target_customers"),
      sg(withLocalizedCopy(multi("salesChannels", "Каналы продаж", "Через какие каналы будут идти продажи?", ["walk_in_store", "instagram", "telegram", "website", "marketplace", "2gis_google_yandex_maps", "referrals", "repeat_customers", "partners", "other"]), {
        ru: { label: "Каналы продаж", question: "Через какие каналы будут идти продажи?" },
        uz: { label: "Savdo kanallari", question: "Savdolar qaysi kanallar orqali amalga oshadi?" },
        en: { label: "Sales channels", question: "Which channels will generate sales?" }
      }), "sales_channels"),
      sg(withLocalizedCopy(number("traffic", "Поток покупателей", "Сколько людей в день проходит мимо точки или заходит в магазин? Если точка не выбрана, укажите ожидаемый диапазон.", "чел./день", { optional: true }), {
        ru: { label: "Поток покупателей", question: "Сколько людей в день проходит мимо точки или заходит в магазин? Если точка не выбрана, укажите ожидаемый диапазон.", unit: "чел./день" },
        uz: { label: "Xaridorlar oqimi", question: "Kuniga nechta odam nuqta yonidan o'tadi yoki do'konga kiradi? Nuqta tanlanmagan bo'lsa, kutilayotgan diapazonni kiriting.", unit: "kishi/kun" },
        en: { label: "Customer traffic", question: "How many people per day pass by the location or enter the store? If the location is not selected, enter the expected range.", unit: "people/day" }
      }), "location_traffic"),
      sg(withLocalizedCopy(number("conversion", "Конверсия", "Какой процент посетителей или заявок ожидаемо станет покупкой?", "%", { optional: true }), {
        ru: { label: "Конверсия", question: "Какой процент посетителей или заявок ожидаемо станет покупкой?", unit: "%" },
        uz: { label: "Konversiya", question: "Tashrifchilar yoki so'rovlarning necha foizi xaridga aylanadi?", unit: "%" },
        en: { label: "Conversion", question: "What percentage of visitors or leads is expected to become purchases?", unit: "%" }
      }), "conversion"),
      sg(withLocalizedCopy(number("monthlyCapacity", "Продаж в месяц", "Сколько чеков или единиц товара реалистично продавать в месяц?", "продаж/мес."), {
        ru: { label: "Продаж в месяц", question: "Сколько чеков или единиц товара реалистично продавать в месяц?", unit: "продаж/мес." },
        uz: { label: "Oyiga sotuvlar", question: "Oyiga nechta chek yoki tovar birligini real sotish mumkin?", unit: "sotuv/oy" },
        en: { label: "Monthly sales", question: "How many receipts or product units can realistically be sold per month?", unit: "sales/month" }
      }), "monthly_volume"),
      sg(withLocalizedCopy(number("averageTicket", "Средний чек", "Какой ожидаемый средний чек покупки детской одежды?", "UZS"), {
        ru: { label: "Средний чек", question: "Какой ожидаемый средний чек покупки детской одежды?", unit: "UZS" },
        uz: { label: "O'rtacha chek", question: "Bolalar kiyimi xaridi uchun kutilayotgan o'rtacha chek qancha?", unit: "UZS" },
        en: { label: "Average ticket", question: "What is the expected average ticket for a children's clothing purchase?", unit: "UZS" }
      }), "average_ticket"),
      sg(withLocalizedCopy(textarea("sectionNotes.salesMarketing", "Спрос и конкуренты", "Опишите 5-8 конкурентов, цены, заявки из Instagram/Telegram, повторные покупки и сезонность.", { optional: true }), {
        ru: { label: "Спрос и конкуренты", question: "Опишите 5-8 конкурентов, цены, заявки из Instagram/Telegram, повторные покупки и сезонность." },
        uz: { label: "Talab va raqobatchilar", question: "5-8 ta raqobatchi, narxlar, Instagram/Telegram so'rovlari, takroriy xaridlar va mavsumiylikni tasvirlang." },
        en: { label: "Demand and competitors", question: "Describe 5-8 competitors, prices, Instagram/Telegram leads, repeat purchases and seasonality." }
      }), "sales_notes")
    ]),
    makeCommonShell("location", [
      sg(withLocalizedCopy(select("premisesStatus", "Помещение", "Какой статус помещения: ТЦ, аренда рядом с жилым массивом, онлайн без точки или еще поиск?", ["mall_point", "street_retail_rent", "owned", "searching", "online_only", "not_decided", "other"]), {
        ru: { label: "Помещение", question: "Какой статус помещения: ТЦ, аренда рядом с жилым массивом, онлайн без точки или еще поиск?" },
        uz: { label: "Joy", question: "Joy holati qanday: savdo markazi, turar-joy yaqinidagi ijara, nuqtasiz onlayn yoki hali qidiruvdami?" },
        en: { label: "Premises", question: "What is the premises status: mall point, rent near a residential area, online without a location, or still searching?" }
      }), "premises_status"),
      sg(withLocalizedCopy(showIfRent(number("monthlyRent", "Аренда в месяц", "Какая ежемесячная аренда или лимит аренды?", "UZS", { optional: true })), {
        ru: { label: "Аренда в месяц", question: "Какая ежемесячная аренда или лимит аренды?", unit: "UZS" },
        uz: { label: "Oylik ijara", question: "Oylik ijara yoki ijara limiti qancha?", unit: "UZS" },
        en: { label: "Monthly rent", question: "What is the monthly rent or rent limit?", unit: "UZS" }
      }), "premises_rent"),
      sg(withLocalizedCopy(select("locationCostStatus", "Статус стоимости локации", "Стоимость локации подтверждена договором/КП или это пока гипотеза?", ["confirmed_contract", "commercial_offer", "assumption", "not_known"], { optional: true }), {
        ru: { label: "Статус стоимости локации", question: "Стоимость локации подтверждена договором/КП или это пока гипотеза?" },
        uz: { label: "Lokatsiya xarajati holati", question: "Lokatsiya xarajati shartnoma yoki tijorat taklifi bilan tasdiqlanganmi yoki bu hali farazmi?" },
        en: { label: "Location cost status", question: "Is the location cost confirmed by contract/commercial offer, or is it still an assumption?" }
      }), "premises_rent_status"),
      sg(withLocalizedCopy(number("premisesAreaSqm", "Площадь", "Какая площадь магазина/островка/склада нужна?", "м2", { optional: true }), {
        ru: { label: "Площадь", question: "Какая площадь магазина/островка/склада нужна?", unit: "м2" },
        uz: { label: "Maydon", question: "Do'kon, orolcha yoki ombor uchun qanday maydon kerak?", unit: "m²" },
        en: { label: "Area", question: "What area is needed for the store, mall island or storage?", unit: "sqm" }
      }), "premises_area"),
      sg(withLocalizedCopy(bool("infrastructureReady", "Инфраструктура", "Готовы ли витрина, склад, интернет, POS/терминал, примерочная и доступ покупателей?", { optional: true }), {
        ru: { label: "Инфраструктура", question: "Готовы ли витрина, склад, интернет, POS/терминал, примерочная и доступ покупателей?" },
        uz: { label: "Infratuzilma", question: "Vitrina, ombor, internet, POS terminal, kiyib ko'rish xonasi va xaridorlar kirishi tayyormi?" },
        en: { label: "Infrastructure", question: "Are display fixtures, storage, internet, POS terminal, fitting room and customer access ready?" }
      }), "infrastructure"),
      sg(withLocalizedCopy(textarea("sectionNotes.premisesInfrastructure", "Локация", "Опишите район, видимость, соседние магазины, семьи с детьми, школы/сады рядом, режим работы и ограничения ТЦ.", { optional: true }), {
        ru: { label: "Локация", question: "Опишите район, видимость, соседние магазины, семьи с детьми, школы/сады рядом, режим работы и ограничения ТЦ." },
        uz: { label: "Lokatsiya", question: "Tuman, ko'rinish, qo'shni do'konlar, bolali oilalar, yaqin maktablar/bog'chalar, ish vaqti va savdo markazi cheklovlarini tasvirlang." },
        en: { label: "Location", question: "Describe the district, visibility, neighboring stores, families with children, nearby schools/kindergartens, opening hours and mall restrictions." }
      }), "location_notes")
    ]),
    block("inventory_suppliers", "Товар, поставщики и остатки", "Проверяем ассортимент, закупку, наценку, оборачиваемость, сезонность, поставщиков, документы и возвраты.", dedupeQuestions([
      sg(withLocalizedCopy(multi("productCategories", "Категории товаров", "Какие категории товаров будут продаваться?", ["everyday_clothing", "outerwear", "shoes", "school_uniform", "baby_clothes", "accessories", "seasonal_collection", "other"]), {
        ru: { label: "Категории товаров", question: "Какие категории товаров будут продаваться?" },
        uz: { label: "Tovar kategoriyalari", question: "Qaysi tovar kategoriyalari sotiladi?" },
        en: { label: "Product categories", question: "Which product categories will be sold?" }
      }), "offer"),
      sg(withLocalizedCopy(number("skuCount", "Количество SKU", "Сколько примерно SKU/моделей на старте?", "SKU"), {
        ru: { label: "Количество товарных позиций", question: "Сколько примерно товарных позиций или моделей будет на старте?", unit: "шт." },
        uz: { label: "Tovar pozitsiyalari soni", question: "Boshlanishda taxminan nechta tovar pozitsiyasi yoki model bo'ladi?", unit: "dona" },
        en: { label: "SKU count", question: "Approximately how many SKUs or models will be available at launch?", unit: "SKU" }
      }), "sku_count"),
      sg(withLocalizedCopy(number("initialInventoryCostUZS", "Первая закупка товара", "Сколько стоит первая закупка товара?", "UZS"), {
        ru: { label: "Первая закупка товара", question: "Сколько стоит первая закупка товара?", unit: "UZS" },
        uz: { label: "Birinchi tovar xaridi", question: "Birinchi tovar xaridi qancha turadi?", unit: "UZS" },
        en: { label: "Initial inventory purchase", question: "How much does the initial inventory purchase cost?", unit: "UZS" }
      }), "initial_inventory"),
      sg(withLocalizedCopy(number("averagePurchaseCost", "Средняя закупочная цена", "Какая средняя закупочная цена одной продажи/единицы?", "UZS"), {
        ru: { label: "Средняя закупочная цена", question: "Какая средняя закупочная цена одной продажи или единицы?", unit: "UZS" },
        uz: { label: "O'rtacha xarid narxi", question: "Bitta sotuv yoki birlik uchun o'rtacha xarid narxi qancha?", unit: "UZS" },
        en: { label: "Average purchase cost", question: "What is the average purchase cost per sale or unit?", unit: "UZS" }
      }), "purchase_price"),
      sg(withLocalizedCopy(number("averageMarkupPct", "Средняя наценка", "Какая средняя наценка к закупочной цене?", "%"), {
        ru: { label: "Средняя наценка", question: "Какая средняя наценка к закупочной цене?", unit: "%" },
        uz: { label: "O'rtacha ustama", question: "Xarid narxiga o'rtacha ustama qancha?", unit: "%" },
        en: { label: "Average markup", question: "What is the average markup over purchase cost?", unit: "%" }
      }), "margin"),
      sg(withLocalizedCopy(number("inventoryTurnoverDays", "Оборачиваемость", "За сколько дней в среднем должен продаваться товарный запас?", "дней", { optional: true }), {
        ru: { label: "Оборачиваемость", question: "За сколько дней в среднем должен продаваться товарный запас?", unit: "дней" },
        uz: { label: "Aylanish", question: "Tovar zaxirasi o'rtacha necha kunda sotilishi kerak?", unit: "kun" },
        en: { label: "Inventory turnover", question: "In how many days should the inventory stock sell on average?", unit: "days" }
      }), "inventory_turnover"),
      sg(withLocalizedCopy(bool("seasonalCollections", "Сезонные коллекции", "Будут ли сезонные коллекции и риск остатков после сезона?", { optional: true }), {
        ru: { label: "Сезонные коллекции", question: "Будут ли сезонные коллекции и риск остатков после сезона?" },
        uz: { label: "Mavsumiy kolleksiyalar", question: "Mavsumiy kolleksiyalar va mavsumdan keyin qoldiq xavfi bo'ladimi?" },
        en: { label: "Seasonal collections", question: "Will there be seasonal collections and a risk of leftovers after the season?" }
      }), "seasonality"),
      sg(withLocalizedCopy(bool("supplierSelected", "Поставщик выбран", "Есть ли выбранный поставщик товара?"), {
        ru: { label: "Поставщик выбран", question: "Есть ли выбранный поставщик товара?" },
        uz: { label: "Yetkazib beruvchi tanlangan", question: "Tovar yetkazib beruvchisi tanlanganmi?" },
        en: { label: "Supplier selected", question: "Has a product supplier been selected?" }
      }), "supplier"),
      sg(withLocalizedCopy(text("supplierLocation", "Где поставщик", "Где находится поставщик: Узбекистан, Турция, Китай, другое?", { optional: true }), {
        ru: { label: "Где поставщик", question: "Где находится поставщик: Узбекистан, Турция, Китай, другое?" },
        uz: { label: "Yetkazib beruvchi joyi", question: "Yetkazib beruvchi qayerda joylashgan: O'zbekiston, Turkiya, Xitoy yoki boshqa davlat?" },
        en: { label: "Supplier location", question: "Where is the supplier located: Uzbekistan, Turkey, China or elsewhere?" }
      }), "supplier_location"),
      sg(withLocalizedCopy(text("supplierPaymentTerms", "Условия оплаты", "Какие условия оплаты поставщика: предоплата, отсрочка, обмен размерного ряда, доставка?"), {
        ru: { label: "Условия оплаты", question: "Какие условия оплаты поставщика: предоплата, отсрочка, обмен размерного ряда, доставка?" },
        uz: { label: "To'lov shartlari", question: "Yetkazib beruvchining to'lov shartlari qanday: oldindan to'lov, kechiktirilgan to'lov, o'lcham qatorini almashtirish, yetkazib berish?" },
        en: { label: "Payment terms", question: "What are the supplier payment terms: prepayment, deferred payment, size-range exchange, delivery?" }
      }), "supplier_terms"),
      sg(withLocalizedCopy(textarea("returnsExchangePolicy", "Возвраты и обмен", "Как будут оформляться обмены размеров, возвраты, повторная продажа и списания?"), {
        ru: { label: "Возвраты и обмен", question: "Как будут оформляться обмены размеров, возвраты, повторная продажа и списания?" },
        uz: { label: "Qaytarish va almashtirish", question: "O'lcham almashtirish, qaytarish, qayta sotish va hisobdan chiqarish qanday rasmiylashtiriladi?" },
        en: { label: "Returns and exchanges", question: "How will size exchanges, returns, resale and write-offs be handled?" }
      }), "returns_exchange"),
      sg(withLocalizedCopy(select("storageModel", "Хранение", "Как будут храниться остатки и размерный ряд?", ["store_only", "store_plus_home_storage", "warehouse", "supplier_on_demand", "not_decided"], { optional: true }), {
        ru: { label: "Хранение", question: "Как будут храниться остатки и размерный ряд?" },
        uz: { label: "Saqlash", question: "Qoldiqlar va o'lcham qatori qanday saqlanadi?" },
        en: { label: "Storage", question: "How will leftovers and the size range be stored?" }
      }), "storage")
    ])),
    makeCommonShell("equipment_launch", [
      sg(select("equipmentCondition", "Оборудование", "Стеллажи, витрины, примерочная, POS/касса и терминал будут новыми, б/у или не выбраны?", ["new", "used", "mixed", "not_selected", "not_needed", "other"]), "equipment_condition"),
      sg(textarea("equipmentList", "Оборудование и инвентарь", "Перечислите стеллажи, рейлы, вешалки, витрину, примерочную, POS/кассу, терминал, систему учета, упаковку."), "equipment"),
      sg(number("equipmentCapex", "Оборудование CapEx", "Сколько стоит оборудование, мебель, POS/касса и запуск?", "UZS", { optional: true }), "equipment_cost"),
      sg(bool("supplierOfferAvailable", "КП/смета", "Есть ли КП, смета или ссылки на цены по оборудованию/мебели?", { optional: true }), "supplier_offer"),
      sg(textarea("sectionNotes.equipment", "Детали запуска", "Опишите поставщиков, сроки, гарантию, учет товара, кассу, терминал, упаковку и подготовку витрины.", { optional: true }), "launch_notes")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("workingSchedule", "График работы", "Какой график работы магазина и кто отвечает за Instagram/Telegram, учет остатков, возвраты и выкладку?", { optional: true }), "work_schedule"),
      sg(bool("qualityControlPlan", "Контроль остатков", "Есть ли план учета остатков по размерам, возвратов, обменов и списаний?", { optional: true }), "quality_control"),
      sg(textarea("sectionNotes.productionCapacity", "Операционный процесс", "Опишите приемку товара, выкладку, продажи, доставку, обмены, инвентаризацию и работу с размерным рядом.", { optional: true }), "operations")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны регистрация, налоговый режим, касса/терминал, документы поставщика и маркировка?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(textarea("requiredPermits", "Документы поставщика и маркировка", "Есть ли у поставщика накладные, договоры поставки, документы о происхождении товара, сертификаты/декларации и маркировка, если применимо?"), "documents"),
      sg(textarea("returnsExchangePolicy", "Правила возврата/обмена", "Какие правила обмена размеров, возврата и фиксации возврата в учете будут использоваться?", { optional: true }), "returns_exchange"),
      sg(bool("cashRegisterNeeded", "Касса и чеки", "Планируется ли онлайн-касса/терминал и выдача чеков по офлайн и онлайн-продажам?", { optional: true }), "cash_register"),
      sg(bool("hasAccountantOrConsultant", "Бухгалтер/юрист", "Есть ли бухгалтер, юрист или профильный консультант?", { optional: true }), "advisor_support"),
      sg(select("experienceLevel", "Опыт", "Какой опыт у команды в retail, одежде, продажах или онлайн-каналах?", ["low", "medium", "high"]), "team_experience"),
      sg(textarea("sectionNotes.complianceExperience", "Compliance-комментарий", "Что нужно проверить до запуска: регистрация, аренда, касса, поставщики, документы на товар, возвраты, сотрудники?", { optional: true }), "compliance_notes")
    ])
  ];
}

function ecommerceAdaptiveCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  return [
    makeCommonShell("business_idea", [
      ...baseIdentityQuestions(),
      sg(text("productOrService", "Товар и категория", "Какие товары будете продавать и какая основная категория онлайн-магазина?"), "offer"),
      sg(textarea("sectionNotes.businessIdea", "Подтверждение идеи", "Что уже подтверждено: поставщики, тестовые продажи, цены конкурентов, первые заказы или аудитория?", { optional: true }), "validation")
    ]),
    makeCommonShell("sales", [
      sg(multi("targetCustomers", "Основные покупатели", "Кто основные покупатели?", ["women", "men", "young_women", "parents", "gift_buyers", "beauty_enthusiasts", "office_workers", "online_customers", "repeat_clients", "other"]), "target_customers"),
      sg(multi("customerAcquisitionChannels", "Каналы продаж", "Через какие каналы будут приходить заказы?", ["instagram", "telegram", "website", "uzum", "wildberries", "marketplace", "recommendations", "repeat_clients", "other"]), "sales_channels"),
      sg(number("monthlyOrders", "Заказы в месяц", "Сколько заказов в месяц ожидаете?", "заказов/мес."), "monthly_volume"),
      sg(number("averageTicket", "Средний чек", "Какой средний чек одного заказа?", "UZS"), "average_ticket"),
      sg(number("cac", "Стоимость привлечения клиента", "Сколько в среднем стоит получить один заказ через рекламу/продвижение?", "UZS"), "customer_acquisition_cost"),
      sg(number("returnsPct", "Возвраты", "Какой процент возвратов или отказов нужно заложить?", "%"), "returns"),
      sg(number("adBudget", "Рекламный бюджет", "Какой месячный бюджет на рекламу и продвижение?", "UZS", { optional: true }), "marketing_budget"),
      sg(textarea("sectionNotes.salesMarketing", "Маркетинг и спрос", "Опишите конкурентов, цены, аудиторию, тестовые заявки и как будете измерять стоимость привлечения.", { optional: true }), "sales_notes")
    ]),
    makeCommonShell("location", [
      sg(select("premisesStatus", "Формат работы", "Где будет работать онлайн-бизнес и где будут храниться товары?", ["online_only", "home_storage", "storage_only", "office_and_storage", "small_office", "rent", "owned", "not_decided", "other"]), "premises_status"),
      sg(showIfRent(number("monthlyRent", "Аренда в месяц", "Какая ежемесячная сумма аренды офиса/склада/помещения?", "UZS", { optional: true })), "premises_rent"),
      sg(showIfRent(number("premisesAreaSqm", "Площадь", "Какая площадь офиса/склада/помещения?", "м2", { optional: true })), "premises_area"),
      sg(textarea("storageModel", "Хранение товара", "Как будет организовано хранение: дома, склад, 3PL, отдельный офис/склад, учет остатков?"), "storage_model"),
      sg(bool("infrastructureReady", "Инфраструктура", "Готовы ли интернет, место хранения, упаковочная зона, безопасность товара и доступ к курьерам?", { optional: true }), "infrastructure"),
      sg(textarea("sectionNotes.premisesInfrastructure", "Детали хранения и логистики", "Опишите склад/хранение, упаковку, доставку, ограничения, возвраты и контроль остатков.", { optional: true }), "location_notes")
    ]),
    makeCommonShell("equipment_launch", [
      sg(multi("salesPlatform", "Платформы продаж", "Где будут продаваться товары?", ["instagram", "telegram", "website", "uzum", "wildberries", "marketplace", "other"]), "sales_platform"),
      sg(multi("productCategories", "Категории товаров", "Какие основные категории товаров будут продаваться?", ["cosmetics", "skin_care", "makeup", "perfume", "hair_care", "accessories", "other"]), "product_categories"),
      sg(number("skuCount", "Количество SKU", "Сколько SKU/позиций планируется на старте?", "SKU", { optional: true }), "sku_count"),
      sg(number("initialInventoryCostUZS", "Первая закупка", "Сколько стоит первая закупка товара?", "UZS"), "initial_inventory"),
      sg(number("averagePurchaseCost", "Закупочная цена", "Какова средняя закупочная/себестоимость одной единицы товара?", "UZS"), "purchase_price"),
      sg(textarea("purchasePricesDetail", "Закупочные цены по категориям", "Если категорий несколько, укажите закупочную цену по основным категориям: сыворотка — 45 000 сум, крем — 30 000 сум.", { optional: true }), "purchase_price_detail"),
      sg(number("averageMarkupPct", "Средняя наценка", "Какая средняя наценка на товар?", "%", { optional: true }), "margin"),
      sg(number("packagingCostPerUnit", "Упаковка на заказ", "Сколько стоит упаковка на один заказ?", "UZS"), "packaging"),
      sg(number("directLogisticsCostPerUnit", "Доставка на заказ", "Какая прямая стоимость доставки или логистики на один заказ?", "UZS"), "delivery_cost"),
      sg(number("marketplaceCommissionPerUnit", "Комиссия маркетплейса/эквайринга", "Какая комиссия маркетплейса или эквайринга на один заказ?", "UZS", { optional: true }), "marketplace_commission"),
      sg(select("fulfillment", "Модель фулфилмента", "Как будет организовано хранение, упаковка и отправка?", ["home_storage", "own_storage", "third_party_logistics", "supplier_direct", "mixed", "other"]), "fulfillment"),
      sg(textarea("returnsExchangePolicy", "Возвраты и обмен", "Как будете обрабатывать возвраты, обмены, повреждения при доставке и повторную продажу товара?"), "returns_policy"),
      sg(bool("supplierSelected", "Поставщик выбран", "Выбран ли поставщик товара?"), "supplier"),
      sg(bool("supplierOfferAvailable", "Прайс/КП поставщика", "Есть ли прайс-лист, КП или подтвержденные закупочные цены?", { optional: true }), "supplier_offer")
    ]),
    makeCommonShell("operations", [
      sg(staff(), "staffing"),
      sg(textarea("orderProcessingPlan", "Обработка заказов", "Как будет устроен процесс: прием заказа, подтверждение оплаты, сборка, упаковка, отправка, возврат?"), "order_process"),
      sg(bool("qualityControlPlan", "Контроль качества", "Есть ли проверка товара, сроков годности, комплектности и состояния перед отправкой?", { optional: true }), "quality_control")
    ]),
    makeCommonShell("financing", financeQuestions(profile)),
    makeCommonShell("documents_experience", [
      sg(select("certificationAwareness", "Документы", "Насколько понятны документы для онлайн-торговли: регистрация, чеки, сертификаты/декларации, маркировка и возвраты?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"),
      sg(textarea("requiredPermits", "Документы поставщика и товара", "Какие документы нужны: договор/накладные поставщика, сертификаты или декларации соответствия, маркировка, правила возврата, чеки и оферта?"), "documents"),
      sg(bool("hasAccountantOrConsultant", "Бухгалтер/юрист", "Есть ли бухгалтер, юрист или консультант по онлайн-торговле и налогам?", { optional: true }), "advisor_support"),
      sg(select("experienceLevel", "Опыт", "Какой опыт у команды в онлайн-продажах, закупках, рекламе или выбранной категории товара?", ["low", "medium", "high"]), "team_experience")
    ])
  ];
}

function categoryAdaptiveCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  if (profile.category === "ecommerce") return ecommerceAdaptiveCommonBlocks(profile);
  if (profile.subcategory === "children_clothing_store") return childrenClothingRetailBlocks(profile);
  if (profile.subcategory === "ice_cream_mobile_trailer" || profile.subcategory === "ice_cream_kiosk") return iceCreamTrailerCommonBlocks(profile);
  if (profile.subcategory === "analytical_laboratory") return analyticalLaboratoryCommonBlocks(profile);
  if (profile.category === "generic") return [...genericAdaptiveCommonBlocks(profile), universalResearchPlanBlock(profile._classificationHint || profile.subcategory || profile.category)];
  if (profile.subcategory === "pet_grooming") return petGroomingCommonBlocks(profile);
  if (profile.subcategory === "tool_equipment_rental") return toolRentalCommonBlocks(profile);
  if (profile.subcategory === "auto_service") return autoServiceCommonBlocks(profile);
  if (profile.subcategory === "car_wash") return carWashCommonBlocks(profile);
  if (profile.subcategory === "cleaning_service") return cleaningCommonBlocks(profile);
  if (profile.subcategory === "self_service_laundry") return laundryCommonBlocks(profile);
  if (profile.subcategory === "device_repair") return deviceRepairCommonBlocks(profile);
  if (profile.subcategory === "solar_installation") return solarInstallationCommonBlocks(profile);
  if (profile.subcategory === "self_storage") return selfStorageCommonBlocks(profile);
  if (profile.category === "food_service") return foodServiceCommonBlocks(profile);
  if (profile.category === "education") return educationCommonBlocks(profile);
  if (profile.category === "manufacturing") return manufacturingCommonBlocks(profile);
  if (profile.category === "import_export") return importCommonBlocks(profile);
  return genericAdaptiveCommonBlocks(profile);
}

function foodServiceCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(select("format", "Формат заведения", "Какой формат: кафе, кофейня, dark kitchen, пекарня или другое?", ["cafe", "coffee_shop", "restaurant", "fast_food", "dark_kitchen", "bakery", "kiosk", "other"]), "offer"), sg(multi("menuCategories", "Меню", "Какие основные категории меню?", ["coffee", "drinks", "bakery", "hot_food", "desserts", "fast_food", "breakfast", "other"]), "product_mix")]);
  blocks[1].questions = dedupeQuestions([sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты кафе?", ["walk_in", "office_workers", "students", "families", "delivery", "repeat_clients", "other"]), "target_customers"), sg(multi("deliveryChannels", "Доставка", "Будет ли доставка как дополнительный канал?", ["own_delivery", "aggregators", "pickup", "none", "other"], { optional: true }), "delivery_support"), sg(number("dailyCovers", "Заказы/посетители в день", "Сколько заказов или посетителей в день планируется?", "заказов/день"), "monthly_volume"), sg(number("averageTicket", "Средний чек", "Какой средний чек?", "UZS"), "average_ticket")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Помещение", "Какой статус помещения кафе?", ["owned", "rent", "searching", "sublease", "not_decided", "other"]), "premises_status"), sg(number("seatingCapacity", "Посадочные места", "Сколько посадочных мест планируется?", "мест"), "capacity_basis"), sg(showIfRent(number("monthlyRent", "Аренда", "Какая ежемесячная аренда?", "UZS", { optional: true })), "premises_rent"), sg(number("leaseTermMonths", "Срок договора", "На какой срок планируется договор аренды?", "мес.", { optional: true }), "premises_lease"), sg(bool("infrastructureReady", "Кухонная инфраструктура", "Готовы ли вода, вентиляция, электричество, канализация и зона хранения?", { optional: true }), "infrastructure")]);
  blocks[3].questions = dedupeQuestions([sg(textarea("kitchenEquipment", "Кухонное оборудование", "Какое кухонное оборудование нужно?"), "equipment"), sg(textarea("equipmentList", "Оборудование", "Перечислите ключевое оборудование, мебель, POS или цифровые инструменты для запуска.", { optional: true }), "equipment_compatibility"), sg(number("foodCostPct", "Себестоимость продуктов", "Какой процент выручки составляет себестоимость продуктов и напитков?", "%", { optional: true }), "inputs"), sg(bool("supplierSelected", "Поставщики", "Есть ли поставщики продуктов и напитков?", { optional: true }), "supplier")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Санитарные требования", "Насколько понятны санитарные требования, касса и документы food service?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(textarea("sanitaryPermits", "Санитарные разрешения", "Какие санитарные требования и разрешения нужно проверить?", { optional: true }), "sanitation"), sg(textarea("requiredPermits", "Документы", "Какие документы нужны до открытия: регистрация, аренда, касса, трудовые документы?", { optional: true }), "documents")]);
  return blocks;
}

function educationCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(select("format", "Формат обучения", "Какой формат обучения: онлайн, офлайн или гибрид?", ["offline", "online", "hybrid", "language_school", "other"]), "offer"), sg(text("program", "Программа", "Какая программа или курсы будут основными?"), "program")]);
  blocks[1].questions = dedupeQuestions([sg(text("ageGroup", "Аудитория", "Какая возрастная группа и уровень учеников?"), "target_customers"), sg(multi("customerAcquisitionChannels", "Каналы", "Какие каналы привлечения учеников?", ["instagram", "telegram", "website", "recommendations", "partners", "other"]), "sales_channels"), sg(number("studentsCount", "Ученики", "Сколько учеников планируется в месяц?", "учеников"), "monthly_volume"), sg(number("averageTicket", "Цена курса", "Какая средняя цена курса/месяца?", "UZS"), "average_ticket"), sg(number("retention", "Retention", "Какой процент учеников продолжит обучение?", "%", { optional: true }), "repeat_clients")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Помещение/онлайн", "Нужна ли аудитория или обучение полностью онлайн?", ["online_only", "rent", "owned", "searching", "hybrid", "not_decided"]), "premises_status"), sg(textarea("schedule", "Расписание", "Какое расписание, группы и часовые слоты?", { optional: true }), "work_schedule")]);
  blocks[3].questions = dedupeQuestions([sg(textarea("equipmentList", "Платформа и материалы", "Какая онлайн-платформа, CRM, материалы и техника нужны?"), "equipment"), sg(number("itPosWebsiteCapex", "IT/платформа", "Сколько потребуется на платформу, сайт, CRM или рекламные инструменты?", "UZS", { optional: true }), "software")]);
  blocks[5].questions = dedupeQuestions([sg(textarea("teachers", "Преподаватели", "Кто будет преподавать и какая квалификация нужна?"), "staffing"), sg(textarea("qualityControlPlan", "Качество обучения", "Как будет контролироваться качество уроков, прогресс и удержание учеников?"), "quality_control")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Лицензирование", "Насколько понятны требования к образовательной деятельности?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(textarea("requiredPermits", "Документы", "Нужны ли лицензия, договор оферты, правила возвратов, договоры с преподавателями?", { optional: true }), "documents"), sg(select("experienceLevel", "Опыт", "Какой опыт у команды в обучении английскому?", ["low", "medium", "high"]), "team_experience")]);
  return blocks;
}

function manufacturingCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(text("productOrService", "Продукция", profile.subcategory === "furniture" ? "Какую мебель будете производить: на заказ, серийно или смешанно?" : "Что именно будет производиться и какая единица продажи?"), "offer"), sg(textarea("productionStages", "Процесс", "Какие основные этапы производства?"), "production_process")]);
  blocks[1].questions = dedupeQuestions([sg(multi("targetCustomers", "Клиенты", "Кто покупает продукцию: частные клиенты, дизайнеры, B2B, магазины?", ["direct_b2b", "retail", "contractors", "repeat_clients", "recommendations", "other"]), "target_customers"), sg(number("monthlyOutputCapacity", "Выпуск в месяц", "Какой плановый выпуск в месяц?", "изделий/мес."), "monthly_volume"), sg(number("averagePrice", "Средняя цена", "Какая средняя цена изделия/заказа?", "UZS"), "average_ticket"), sg(bool("hasBuyerAgreements", "Заказы", "Есть ли предварительные заказы или договоренности?", { optional: true }), "demand_validation")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Цех/мастерская", "Какой статус помещения под мастерскую?", ["owned", "rent", "searching", "sublease", "not_decided", "other"]), "premises_status"), sg(number("premisesAreaSqm", "Площадь", "Какая площадь нужна для производства, хранения сырья и готовой продукции?", "м2", { optional: true }), "premises_area"), sg(textarea("storageNeeds", "Хранение", "Какие требования к хранению сырья и готовой продукции?"), "storage"), sg(textarea("energyNeeds", "Энергия/вентиляция", "Какие требования к электричеству, вентиляции, воде или шуму?", { optional: true }), "infrastructure")]);
  blocks[3].questions = dedupeQuestions([sg(textarea("equipmentList", "Оборудование", "Какое производственное оборудование и инструмент нужны?"), "equipment"), sg(textarea("rawMaterials", "Сырье", "Какое сырье и комплектующие нужны?"), "inputs"), sg(bool("supplierSelected", "Поставщики", "Есть ли поставщики сырья и оборудования?", { optional: true }), "supplier"), sg(number("equipmentCapex", "Оборудование CapEx", "Сколько стоит оборудование и монтаж?", "UZS", { optional: true }), "equipment_cost")]);
  blocks[5].questions = dedupeQuestions([sg(staff(), "staffing"), sg(number("defectRatePct", "Брак/потери", "Какой процент брака или потерь нужно заложить?", "%", { optional: true }), "quality_control"), sg(textarea("wasteByproducts", "Отходы", "Какие отходы или побочные продукты возникают?", { optional: true }), "environment")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Сертификация", "Насколько понятны сертификация, маркировка и требования к продукции?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(textarea("requiredPermits", "Документы", "Какие документы, договоры, сертификаты, требования к цеху и охране труда нужно проверить?"), "documents"), sg(select("experienceLevel", "Опыт", "Какой опыт у команды в производстве?", ["low", "medium", "high"]), "team_experience")]);
  return blocks;
}

function importCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(text("productOrService", "Что импортируется", "Какое оборудование/товары импортируются и для кого они продаются?"), "offer"), sg(text("importCountry", "Страна поставки", "Из какой страны планируется импорт?"), "import_details")]);
  blocks[1].questions = dedupeQuestions([sg(multi("targetCustomers", "Клиенты", "Кому будет продаваться импортируемое оборудование?", ["direct_b2b", "retail", "contractors", "partners", "repeat_clients", "other"]), "target_customers"), sg(number("monthlyCapacity", "Продаж в месяц", "Сколько единиц/заказов планируется продавать в месяц?", "ед./мес."), "monthly_volume"), sg(number("averagePrice", "Средняя цена", "Какая средняя цена продажи?", "UZS"), "average_ticket"), sg(bool("hasBuyerAgreements", "Предзаказы", "Есть ли предварительные клиенты, заявки или договоренности?", { optional: true }), "demand_validation")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Склад/шоурум", "Нужен ли склад, шоурум или пункт выдачи?", ["storage_only", "small_office", "office_and_storage", "rent", "not_decided"]), "premises_status"), sg(textarea("storageNeeds", "Хранение", "Какие требования к хранению импортируемого оборудования?"), "storage"), sg(text("deliveryTime", "Срок поставки", "Какой срок поставки от предоплаты до склада?"), "import_logistics")]);
  blocks[4].questions = dedupeQuestions([sg(text("supplier", "Поставщик", "Кто поставщик или как будет выбран поставщик?"), "supplier"), sg(select("supplierCurrency", "Валюта поставщика", "В какой валюте будут закупки/контракт?", ["USD", "EUR", "CNY", "RUB", "UZS", "other"]), "currency"), sg(bool("alternativeSuppliers", "Альтернативы", "Есть ли 2-3 альтернативных поставщика?", { optional: true }), "supplier_alternatives"), sg(number("prepaymentPct", "Предоплата", "Какой процент предоплаты поставщику?", "%", { optional: true }), "payment_terms")]);
  blocks[5].questions = dedupeQuestions([sg(staff(), "staffing"), sg(textarea("qualityControlPlan", "Проверка качества", "Как будет проверяться качество оборудования при приемке и гарантийных случаях?"), "quality_control")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Таможня и сертификаты", "Насколько понятны таможня, сертификация, валюта и контракт?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(text("incoterms", "Incoterms", "Какие условия Incoterms планируются, если известны?"), "import_details"), sg(text("customsBroker", "Таможенный брокер", "Есть ли таможенный брокер или консультант?"), "customs"), sg(textarea("certificates", "Сертификаты", "Какие сертификаты, декларации или разрешения могут понадобиться?"), "documents"), sg(number("customsDuties", "Пошлины", "Какие пошлины/таможенные платежи нужно заложить, если известно?", "%", { optional: true }), "customs_cost")]);
  return blocks;
}

function solarInstallationCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(multi("solarSystemTypes", "Типы систем", "Какие системы будете устанавливать: домовые, коммерческие, гибридные, с аккумуляторами?", ["residential_solar", "commercial_solar", "hybrid_solar", "battery_storage", "maintenance_service", "other"]), "offer"), sg(textarea("sectionNotes.businessIdea", "Ценность", "Что уже подтверждено: поставщик панелей, монтажная команда, спрос, партнеры или КП?", { optional: true }), "validation")]);
  blocks[1].questions = dedupeQuestions([sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты установки солнечных панелей?", ["homeowners", "small_businesses", "factories", "farms", "b2b_contracts", "partners", "other"]), "target_customers"), sg(multi("customerAcquisitionChannels", "Каналы", "Какие каналы продаж?", ["instagram", "telegram", "website", "b2b_sales", "recommendations", "partners", "other"]), "sales_channels"), sg(number("solarProjectsPerMonth", "Проектов в месяц", "Сколько монтажных проектов планируется в месяц?", "проектов/мес."), "monthly_volume"), sg(number("averageSolarProjectTicket", "Средний чек проекта", "Какой средний чек одного проекта установки?", "UZS"), "average_ticket")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Офис/склад", "Нужен ли офис или склад для панелей, инверторов и инструмента?", ["no_office_needed", "storage_only", "small_office", "office_and_storage", "not_decided"]), "premises_status"), sg(text("serviceArea", "Зона монтажа", "В каких районах/городах команда будет выполнять монтаж?"), "service_area"), sg(select("deliveryModel", "Доставка оборудования", "Как панели и инверторы будут доставляться на объект?", ["own_delivery", "supplier_delivery", "courier_partner", "mixed", "not_decided"]), "delivery_support")]);
  blocks[3].questions = dedupeQuestions([sg(textarea("solarInstallationEquipment", "Монтажное оборудование", "Какое оборудование, инструмент, СИЗ и измерительные приборы нужны для монтажа?"), "equipment"), sg(textarea("solarSupplierPlan", "Поставщики панелей", "Кто поставляет панели, инверторы, крепления и гарантийные комплектующие?"), "supplier"), sg(number("equipmentCapex", "Инструмент CapEx", "Сколько стоит монтажный инструмент, СИЗ и стартовый комплект?", "UZS", { optional: true }), "equipment_cost")]);
  blocks[5].questions = dedupeQuestions([sg(staff(), "staffing"), sg(textarea("staffSkills", "Квалификация", "Какая квалификация нужна монтажникам и электрикам?"), "staff_skills"), sg(textarea("electricalSafetyPlan", "Электробезопасность", "Как будет контролироваться электробезопасность, высотные работы и качество монтажа?"), "safety"), sg(textarea("warrantyPolicy", "Гарантия", "Какая гарантия на монтаж и оборудование?"), "quality_control")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Документы", "Насколько понятны договоры, гарантия, электробезопасность и разрешения?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(textarea("requiredPermits", "Разрешения", "Какие разрешения, сертификаты оборудования и требования подключения нужно проверить?"), "documents"), sg(textarea("damageLiability", "Ответственность", "Кто отвечает за повреждение крыши, оборудования, электрику или гарантийные случаи?"), "liability")]);
  return blocks;
}

function selfStorageCommonBlocks(profile: BusinessProfile): InterviewBlock[] {
  const blocks = genericAdaptiveCommonBlocks(profile);
  blocks[0].questions = dedupeQuestions([...baseIdentityQuestions(), sg(multi("storageUnitTypes", "Форматы хранения", "Какие форматы хранения будут: боксы, ячейки, паллеты, сезонное хранение?", ["small_units", "medium_units", "large_units", "pallet_storage", "seasonal_storage", "business_storage", "other"]), "offer"), sg(textarea("sectionNotes.businessIdea", "Модель", "Кто платит основную сумму и за какой срок хранения?", { optional: true }), "validation")]);
  blocks[1].questions = dedupeQuestions([sg(multi("targetCustomers", "Клиенты", "Кто основные клиенты мини-склада?", ["homeowners", "students", "small_businesses", "ecommerce_sellers", "seasonal_clients", "b2b_contracts", "other"]), "target_customers"), sg(number("storageUnitsCount", "Единиц хранения", "Сколько ячеек/боксов/мест хранения будет на старте?", "ед."), "capacity_basis"), sg(number("averageStorageTicket", "Средний чек хранения", "Какой средний чек за единицу хранения в месяц?", "UZS"), "average_ticket"), sg(number("utilizationRatePct", "Загрузка", "Какая целевая загрузка площадей?", "%", { optional: true }), "asset_utilization")]);
  blocks[2].questions = dedupeQuestions([sg(select("premisesStatus", "Склад", "Какой статус помещения/склада?", ["owned", "rent", "searching", "sublease", "not_decided", "other"]), "premises_status"), sg(number("premisesAreaSqm", "Площадь", "Какая площадь склада и полезная площадь хранения?", "м2"), "premises_area"), sg(textarea("storageSecurityPlan", "Безопасность", "Как будет организована безопасность: камеры, доступ, охрана, пожарная сигнализация?"), "safety"), sg(textarea("accessControlPlan", "Доступ клиентов", "Как клиенты получают доступ к вещам и как фиксируется вход/выход?"), "operations")]);
  blocks[3].questions = dedupeQuestions([sg(textarea("equipmentList", "Оснащение", "Какие стеллажи, перегородки, камеры, замки, учетная система и пожарное оборудование нужны?"), "equipment"), sg(number("premisesSetupCapex", "Подготовка помещения", "Сколько потребуется на перегородки, ремонт, безопасность и запуск склада?", "UZS", { optional: true }), "equipment_cost")]);
  blocks[5].questions = dedupeQuestions([sg(staff(), "staffing"), sg(textarea("workingSchedule", "График доступа", "Какой график доступа клиентов и кто контролирует выдачу/доступ?"), "work_schedule"), sg(textarea("qualityControlPlan", "Контроль", "Как будет контролироваться чистота, сохранность и заполненность боксов?"), "quality_control")]);
  blocks[7].questions = dedupeQuestions([sg(select("certificationAwareness", "Документы", "Насколько понятны договор хранения, ответственность, пожарная безопасность и страховка?", ["aware", "partly_aware", "not_aware"]), "documents_awareness"), sg(bool("clientContracts", "Договор хранения", "Будет ли договор хранения/аренды ячейки с клиентом?"), "documents"), sg(textarea("damageLiability", "Ответственность", "Кто отвечает за потерю, повреждение, пожар, влажность или невывоз вещей?"), "liability"), sg(bool("chemicalSafetyRules", "Запрещенные предметы", "Будут ли правила запрещенных предметов и контроля безопасности?", { optional: true }), "safety")]);
  return blocks;
}


function adaptivePackBlock(questions: InterviewQuestion[]): InterviewBlock[] {
  if (!questions.length) return [];
  return [block("adaptive_question_pack", "Адаптивные вопросы", "Дополнительные вопросы, выбранные по возможностям и операционной модели бизнеса.", dedupeQuestions(questions))];
}

function aq(question: InterviewQuestion, blockId: string, capabilityTags: string[]): InterviewQuestion {
  return { ...question, blockId, capabilityTags: ["adaptive_question_pack", ...capabilityTags], required: question.required ?? !question.optional };
}

function adaptiveValueByPath(data: StructuredProjectData, key: string): unknown {
  if (!key.includes(".")) return (data as Record<string, unknown>)[key];
  const [root, child] = key.split(".");
  const rootValue = (data as Record<string, unknown>)[root];
  return rootValue && typeof rootValue === "object" ? (rootValue as Record<string, unknown>)[child] : undefined;
}

function hasAdaptiveAnswer(data: StructuredProjectData, key: string): boolean {
  const value = adaptiveValueByPath(data, key);
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0 && value !== "__later__";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "object" && "roles" in value) {
    const roles = (value as { roles?: unknown[] }).roles;
    return Array.isArray(roles) && roles.length > 0;
  }
  return true;
}

const adaptiveAnswerAliases: Record<string, string[]> = {
  ...answerAliases,
  serviceTerms: ["clientContracts", "warrantyPolicy", "damageLiability", "repairWarrantyPolicy", "rentalClientContracts", "rentalDamageLiability", "laundryServiceTerms", "returnsExchangePolicy"],
  repeatCustomersPlan: ["repeatClientsPct", "repeatOrdersPct", "customerAcquisitionChannels", "bookingChannels"],
  qualityControlPlan: ["serviceQualityControl", "groomingQualityControl", "repairWarrantyPolicy", "laundryServiceTerms"],
  equipmentList: ["laundryEquipment", "carWashEquipment", "cleaningChemicals", "cleaningServiceTypes", "kitchenEquipment", "groomingEquipment", "repairEquipment", "solarInstallationEquipment", "rentalEquipmentList", "labEquipmentList", "sectionNotes.equipment"],
  equipmentServiceSupport: ["kitchenEquipmentMaintenance", "toolMaintenancePlan", "maintenancePlan", "laundryMaintenancePlan", "sectionNotes.equipment"],
  supplierSelected: ["supplier", "solarSupplierPlan", "ingredientSupplyPlan", "reagentsSupplierSelected", "laundrySupplierPlan", "sectionNotes.rawMaterials", "sectionNotes.inventory"],
  rawMaterials: ["ingredientSupplyPlan", "laundryConsumables", "cleaningChemicals", "washChemicals", "groomingConsumables", "repairSpareParts"],
  sectionNotes: ["sectionNotes.businessIdea", "sectionNotes.salesMarketing", "sectionNotes.productionCapacity", "sectionNotes.equipment", "sectionNotes.complianceExperience"],
  "sectionNotes.equipment": ["laundryEquipment", "carWashEquipment", "equipmentList", "kitchenEquipment", "groomingEquipment", "repairEquipment", "solarInstallationEquipment", "rentalEquipmentList", "labEquipmentList"],
  "sectionNotes.productionCapacity": ["laundryCyclesPerDay", "monthlyCapacity", "dailyOrdersCapacity", "carsPerDayStart", "rentalOrdersPerMonth", "repairOrdersPerMonth", "bakeryProductionSchedule"],
  "sectionNotes.complianceExperience": ["requiredPermits", "certificationAwareness", "clientContracts", "damageLiability", "sanitaryProductionFlow"]
};

function expandAdaptiveKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.flatMap((key) => [key, ...(adaptiveAnswerAliases[key] ?? [])])));
}

function hasAnyAdaptiveAnswer(data: StructuredProjectData, keys: string[]): boolean {
  return expandAdaptiveKeys(keys).some((key) => hasAdaptiveAnswer(data, key));
}

function adaptiveText(data: StructuredProjectData): string {
  return [
    data.businessType,
    data.businessIdea,
    data.productOrService,
    data.sectionNotes?.businessIdea,
    data.sectionNotes?.salesMarketing,
    data.sectionNotes?.productionCapacity,
    data.sectionNotes?.equipment,
    data.sectionNotes?.complianceExperience
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function addIfMissing(
  target: InterviewQuestion[],
  data: StructuredProjectData,
  keys: string[],
  question: InterviewQuestion,
  blockId: string,
  capabilityTags: string[],
  memory?: AnswerMemory
) {
  const alreadyCovered = memory ? isQuestionAlreadyAnswered(question.key, memory, adaptiveAnswerAliases) : false;
  if (!alreadyCovered && !hasAnyAdaptiveAnswer(data, keys)) target.push(aq(question, blockId, capabilityTags));
}

function gapRankForQuestion(question: InterviewQuestion, gaps: MissingInput[]) {
  const criticalKeys = new Set(gaps.filter((gap) => gap.severity === "critical").map((gap) => gap.key));
  const importantKeys = new Set(gaps.filter((gap) => gap.severity === "important").map((gap) => gap.key));
  const key = question.key;
  const aliases = [key, ...(adaptiveAnswerAliases[key] ?? [])];
  if (aliases.some((alias) => criticalKeys.has(alias))) return 0;
  if (aliases.some((alias) => importantKeys.has(alias))) return 1;
  const tags = question.capabilityTags ?? [];
  if (tags.some((tag) => /hasChildSafetyRisk|child_safety|safety/i.test(tag))) return 0;
  if (tags.some((tag) => /average|ticket|capacity|volume|finance|working_capital/i.test(tag))) return 0;
  if (tags.some((tag) => /quality|equipment|supplier|service|production|sanitary|contract|staff|pricing/i.test(tag))) return 1;
  if (tags.some((tag) => /risk|liability|bank|document/i.test(tag))) return 2;
  return 3;
}

function finalizeAdaptiveQuestions(questions: InterviewQuestion[], memory: AnswerMemory, gaps: MissingInput[]): InterviewQuestion[] {
  const actionableGaps = gaps.filter((gap) => gap.severity === "critical" || gap.severity === "important");
  if (!actionableGaps.length) return [];

  const seenSemantics = new Set<string>();
  return dedupeQuestions(questions)
    .filter((question) => !isQuestionAlreadyAnswered(question.key, memory, adaptiveAnswerAliases))
    .sort((left, right) => gapRankForQuestion(left, gaps) - gapRankForQuestion(right, gaps))
    .filter((question) => {
      const semantic = questionSemanticGroups[question.key] ?? question.key;
      if (seenSemantics.has(semantic)) return false;
      seenSemantics.add(semantic);
      return true;
    })
    .slice(0, 7);
}

export function generateAdaptiveQuestionPack(input: {
  profile: BusinessProfile;
  locale: "ru" | "uz" | "en";
  projectContext: StructuredProjectData;
  sourceCategories: string[];
}): InterviewQuestion[] {
  const { profile, projectContext } = input;
  const memory = buildAnswerMemory(projectContext);
  const gaps = detectMissingAnalysisInputs(profile, memory);
  const questions: InterviewQuestion[] = [];
  const hostLocation = profile.capabilities?.dependsOnHostBusinessTraffic || profile.operationalModel === "inside_partner_location";
  const mobileService = profile.operationalModel === "mobile_service" || profile.usesMobileService;
  const rentalModel = profile.rentsAssets || profile.capabilities?.rentalOrUsageBasedRevenue;
  const serviceModel = profile.providesServices && !profile.sellsGoods && !profile.producesGoods;
  const foodServiceModel = profile.category === "food_service";
  const foodContext = adaptiveText(projectContext);
  const bakeryModel = foodServiceModel && (
    profile.subcategory === "bakery" || /пекар|хлеб|самс|выпеч|булоч|круассан|bakery|bread/.test(foodContext)
  );
  const coffeeFoodModel = foodServiceModel && !bakeryModel && (profile.subcategory === "coffee_shop" || /кофе|кофейн|coffee|qahva/.test(foodContext));
  const childSafety = profile.capabilities?.hasChildSafetyRisk || (profile.hasSafetyRisk && rentalModel && hostLocation);
  const subcategory = profile.subcategory ?? "";
  const dedicatedServiceSubcategories = new Set(["self_service_laundry", "car_wash", "cleaning_service", "auto_service", "pet_grooming", "device_repair", "tool_equipment_rental", "solar_installation", "analytical_laboratory", "self_storage"]);
  const dedicatedEquipmentSubcategories = new Set(["self_service_laundry", "car_wash", "cleaning_service", "auto_service", "pet_grooming", "device_repair", "tool_equipment_rental", "solar_installation", "analytical_laboratory", "self_storage"]);

  if (hostLocation) {
    addIfMissing(questions, projectContext, ["mallTraffic", "locationTraffic", "sectionNotes.salesMarketing"],
      number("mallTraffic", "Поток партнерской локации", "Какой ожидаемый поток людей в ТЦ/партнерской локации по будням и выходным?", "чел./день"),
      "partner_location", ["dependsOnHostBusinessTraffic", "inside_partner_location"], memory);
    addIfMissing(questions, projectContext, ["mallContract", "clientContracts", "sectionNotes.complianceExperience"],
      textarea("mallContract", "Договор с локацией", "Какие условия договора с ТЦ/арендодателем: срок, аренда или процент, зона работы, вывеска и ограничения?"),
      "partner_location", ["dependsOnHostBusinessTraffic", "contract"], memory);
    addIfMissing(questions, projectContext, ["partnerLocationAreaSqm", "premisesAreaSqm", "sectionNotes.premisesInfrastructure"],
      number("partnerLocationAreaSqm", "Площадь точки", "Какая площадь точки, островка или рабочей зоны в партнерской локации?", "м2", { optional: true }),
      "partner_location", ["inside_partner_location"], memory);
    addIfMissing(questions, projectContext, ["partnerRevenueSharePct", "pricingModel", "monthlyRent"],
      number("partnerRevenueSharePct", "Процент партнеру", "Если есть revenue share, какой процент выручки получает партнер или ТЦ?", "%", { optional: true }),
      "partner_location", ["inside_partner_location", "pricing"], memory);
  }

  if (mobileService) {
    addIfMissing(questions, projectContext, ["serviceArea", "serviceZone", "sectionNotes.premisesInfrastructure"],
      text("serviceArea", "Зона обслуживания", "В каких районах или радиусе будет работать выездной сервис?"),
      "mobile_service_operations", ["mobile_service"], memory);
    addIfMissing(questions, projectContext, ["mobileVisitsPerDay", "dailyServiceCapacity", "monthlyCapacity", "sectionNotes.productionCapacity"],
      number("mobileVisitsPerDay", "Выездов в день", "Сколько выездов в день реально сможет выполнить команда с учетом дороги?", "выездов/день"),
      "mobile_service_operations", ["mobile_service", "capacity"], memory);
    addIfMissing(questions, projectContext, ["travelTimeMinutes", "transportNeeds"],
      number("travelTimeMinutes", "Время дороги", "Сколько минут в среднем занимает дорога на один заказ?", "мин.", { optional: true }),
      "mobile_service_operations", ["mobile_service", "logistics"], memory);
    addIfMissing(questions, projectContext, ["transportNeeds", "teamTransportModel"],
      textarea("transportNeeds", "Транспорт", "Какой транспорт нужен для оборудования, расходников и сотрудников?"),
      "mobile_service_operations", ["mobile_service", "transport"], memory);
    addIfMissing(questions, projectContext, ["damageLiability", "serviceTerms", "warrantyPolicy"],
      textarea("damageLiability", "Ответственность у клиента", "Кто отвечает за имущество клиента, повреждения, претензии и порядок приемки работ?"),
      "mobile_service_operations", ["mobile_service", "liability"], memory);
  }

  if (rentalModel) {
    addIfMissing(questions, projectContext, ["rentalFleetSize", "storageUnitsCount"],
      number("rentalFleetSize", "Парк активов", "Сколько единиц оборудования, машинок, боксов или других активов будет в прокате/использовании?", "ед."),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "asset_capacity"], memory);
    addIfMissing(questions, projectContext, ["rentalSessionMinutes", "rentalPricingModel"],
      number("rentalSessionMinutes", "Время использования", "Сколько минут или часов длится одна сессия аренды/использования?", "мин.", { optional: true }),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "pricing"], memory);
    addIfMissing(questions, projectContext, ["averageRentalTicket", "averageStorageTicket", "averageTicket"],
      number("averageRentalTicket", "Средний чек аренды", "Какой средний чек за одну сессию, день или месяц аренды?", "UZS"),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "average_ticket"], memory);
    addIfMissing(questions, projectContext, ["utilizationRatePct"],
      number("utilizationRatePct", "Загрузка активов", "Какая целевая загрузка активов или площадей?", "%", { optional: true }),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "utilization"], memory);
    addIfMissing(questions, projectContext, ["maintenancePlan", "toolMaintenancePlan", "equipmentServiceSupport"],
      textarea("maintenancePlan", "Износ и ремонт", "Как будет организован ремонт, обслуживание, списание и замена активов?"),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "maintenance"], memory);
    addIfMissing(questions, projectContext, ["damageLossPolicy", "damageLiability", "rentalDamageLiability"],
      textarea("damageLossPolicy", "Ущерб и возврат", "Как клиент отвечает за повреждение, потерю, невозврат или простой актива?"),
      "rental_asset_operations", ["rentalOrUsageBasedRevenue", "liability"], memory);
  }

  if (childSafety) {
    addIfMissing(questions, projectContext, ["ridingZoneAreaSqm", "partnerLocationAreaSqm", "premisesAreaSqm"],
      number("ridingZoneAreaSqm", "Зона катания", "Какая площадь безопасной зоны катания/игры и как она отделена от потока людей?", "м2"),
      "safety_liability", ["hasChildSafetyRisk", "safety"], memory);
    addIfMissing(questions, projectContext, ["childSafetyRules", "clientSafetyInstructions"],
      textarea("childSafetyRules", "Безопасность детей", "Какие правила возраста, скорости, сопровождения родителей, инструктажа и остановки сессии?"),
      "safety_liability", ["hasChildSafetyRisk", "safety"], memory);
    addIfMissing(questions, projectContext, ["supervisorStaffPlan", "staffPlan"],
      textarea("supervisorStaffPlan", "Сотрудник-наблюдатель", "Кто постоянно контролирует детей, очередь, посадку/высадку и конфликтные ситуации?"),
      "safety_liability", ["hasChildSafetyRisk", "staff"], memory);
    addIfMissing(questions, projectContext, ["chargingPlan", "equipmentServiceSupport", "sectionNotes.equipment"],
      textarea("chargingPlan", "Зарядка и хранение", "Где и когда заряжаются машинки/активы, как контролируется пожарная и электрическая безопасность?"),
      "safety_liability", ["hasChildSafetyRisk", "equipment"], memory);
  }

  if (foodServiceModel) {
    if (bakeryModel) {
      addIfMissing(questions, projectContext, ["bakeryProductionSchedule", "productionStages", "sectionNotes.productionCapacity"],
        textarea("bakeryProductionSchedule", "График выпечки", "Какие позиции выпекаются утром, днем и вечером, и какой плановый объем по хлебу, самсе, выпечке и кофе в обычный день?"),
        "food_service_adaptive", ["food_service", "bakery", "capacity"]);
      addIfMissing(questions, projectContext, ["ingredientSupplyPlan", "rawMaterials", "supplierPaymentTerms", "sectionNotes.equipment"],
        textarea("ingredientSupplyPlan", "Сырье и поставщики", "Где будете закупать муку, масло, сахар, молоко, кофе, упаковку и кто будет запасным поставщиком при росте цен или перебоях?"),
        "food_service_adaptive", ["food_service", "bakery", "suppliers", "working_capital"]);
      addIfMissing(questions, projectContext, ["dailyWastePct", "wasteSpoilagePct", "foodWastePct"],
        number("dailyWastePct", "Списания", "Какой процент выпечки и сырья может списываться из-за непроданного остатка, брака или просрочки?", "%", { optional: true }),
        "food_service_adaptive", ["food_service", "bakery", "waste", "margin"]);
      addIfMissing(questions, projectContext, ["sanitaryProductionFlow", "sanitaryPermits", "sectionNotes.complianceExperience"],
        textarea("sanitaryProductionFlow", "Санитария производства", "Как будут разделены зоны сырья, выпечки, хранения, продажи и мойки, и кто контролирует санитарный журнал?"),
        "food_service_adaptive", ["food_service", "bakery", "sanitary"]);
      addIfMissing(questions, projectContext, ["kitchenEquipmentMaintenance", "equipmentServiceSupport", "sectionNotes.equipment"],
        textarea("kitchenEquipmentMaintenance", "Сервис печи и кофемашины", "Кто обслуживает печь, тестомес, холодильники и кофемашину, где запчасти и какой запасной план при простое оборудования?"),
        "food_service_adaptive", ["food_service", "bakery", "equipment", "maintenance"]);
    } else {
      addIfMissing(questions, projectContext, ["peakHoursPlan", "sectionNotes.productionCapacity"],
        textarea("peakHoursPlan", "Пиковые часы", coffeeFoodModel ? "В какие часы ожидается основной поток кофе и десертов, и как команда будет справляться с очередью?" : "В какие часы ожидается основной поток гостей/заказов, и как кухня будет справляться с пиковыми нагрузками?"),
        "food_service_adaptive", ["food_service", "capacity", "customer_flow"]);
      addIfMissing(questions, projectContext, ["foodWastePct", "dailyWastePct"],
        number("foodWastePct", "Списания", "Какой процент продуктов или готовых блюд закладываете на списания, брак и непроданные остатки?", "%", { optional: true }),
        "food_service_adaptive", ["food_service", "waste", "margin"]);
      addIfMissing(questions, projectContext, ["sanitaryProductionFlow", "sanitaryPermits", "sectionNotes.complianceExperience"],
        textarea("sanitaryProductionFlow", "Санитарный процесс", "Как организованы хранение продуктов, кухня, уборка, журналы и контроль санитарных требований?"),
        "food_service_adaptive", ["food_service", "sanitary"]);
    }
  }

  if (subcategory === "self_service_laundry") {
    addIfMissing(questions, projectContext, ["laundryTariffPolicy", "averageLaundryTicket", "b2bTariffPolicy"],
      textarea("laundryTariffPolicy", "Тарифы прачечной", "Какие тарифы будут для стирки, сушки, глажки, услуг за килограмм и B2B-клиентов: гостиниц, салонов, кафе или клиник?"),
      "laundry_adaptive", ["self_service_laundry", "pricing", "b2b"]);
    addIfMissing(questions, projectContext, ["laundryServiceTerms", "serviceTerms", "clientContracts"],
      textarea("laundryServiceTerms", "Правила приема и выдачи", "Какие сроки выполнения, правила приема белья, выдачи заказа, возвратов и претензий будут указаны клиенту?"),
      "laundry_adaptive", ["self_service_laundry", "service_terms"]);
    addIfMissing(questions, projectContext, ["damageLiability", "laundryDamagePolicy"],
      textarea("damageLiability", "Ответственность за белье", "Кто отвечает за потерю, окрашивание, усадку, повреждение или задержку белья, и как это фиксируется при приеме заказа?"),
      "laundry_adaptive", ["self_service_laundry", "liability"]);
    addIfMissing(questions, projectContext, ["laundrySupplierPlan", "laundryConsumables", "supplierSelected"],
      textarea("laundrySupplierPlan", "Поставщики расходников", "Кто поставляет порошок, капсулы, кондиционер, пакеты, фильтры и дезинфекцию, и есть ли запасной поставщик?"),
      "laundry_adaptive", ["self_service_laundry", "suppliers", "working_capital"]);
    addIfMissing(questions, projectContext, ["equipmentServiceSupport", "laundryMaintenancePlan"],
      textarea("equipmentServiceSupport", "Сервис машин", "Кто обслуживает стиральные и сушильные машины, где запчасти и сколько часов/дней допустим простой?"),
      "laundry_adaptive", ["self_service_laundry", "equipment", "maintenance"]);
  }

  if (subcategory === "print_copy_service") {
    addIfMissing(questions, projectContext, ["printCopyServiceMix", "productOrService", "sectionNotes.productionCapacity"],
      textarea("printCopyServiceMix", "Структура услуг", "Какие услуги дадут основную выручку: печать, ксерокопия, сканирование, ламинирование, переплет, фото на документы или канцтовары?"),
      "print_copy_adaptive", ["print_copy_service", "service_mix", "unit_economics"], memory);
    addIfMissing(questions, projectContext, ["nearbyUniversitiesOffices", "locationTraffic", "sectionNotes.salesMarketing"],
      textarea("nearbyUniversitiesOffices", "Трафик точки", "Какие университеты, офисы, госучреждения или жилые кварталы рядом и как вы подтвердите дневной поток клиентов?"),
      "print_copy_adaptive", ["print_copy_service", "traffic", "location"], memory);
    addIfMissing(questions, projectContext, ["paperTonerCost", "rawMaterialCostPerUnit", "sectionNotes.equipment"],
      textarea("paperTonerCost", "Бумага и тонер", "Какая себестоимость бумаги, тонера, картриджей и ламинационных пленок на типовой заказ и кто запасной поставщик?"),
      "print_copy_adaptive", ["print_copy_service", "consumables", "margin"], memory);
    addIfMissing(questions, projectContext, ["equipmentServiceSupport", "equipmentCondition", "sectionNotes.equipment"],
      textarea("equipmentServiceSupport", "Простой техники", "Кто обслуживает принтеры, МФУ, резак, ламинатор и переплетчик, и какой допустимый простой оборудования?"),
      "print_copy_adaptive", ["print_copy_service", "equipment", "maintenance"], memory);
    addIfMissing(questions, projectContext, ["corporateOrders", "clientContracts", "sectionNotes.salesMarketing"],
      textarea("corporateOrders", "Корпоративные заказы", "Планируются ли договоры с офисами, учебными центрами, нотариусами или компаниями на регулярную печать и сканирование?"),
      "print_copy_adaptive", ["print_copy_service", "b2b", "repeat_clients"], memory);
  }

  if (serviceModel && !dedicatedServiceSubcategories.has(subcategory)) {
    addIfMissing(questions, projectContext, ["serviceTerms"],
      textarea("serviceTerms", "Условия услуги", "Какие сроки выполнения, приемка/выдача, гарантия и правила претензий будут указаны клиенту?"),
      "service_quality", ["providesServices", "quality"]);
    addIfMissing(questions, projectContext, ["qualityControlPlan", "sectionNotes.productionCapacity"],
      textarea("qualityControlPlan", "Контроль качества", "Как будет проверяться качество работы до передачи результата клиенту?"),
      "service_quality", ["providesServices", "quality"]);
    addIfMissing(questions, projectContext, ["repeatCustomersPlan"],
      textarea("repeatCustomersPlan", "Повторные клиенты", "Как планируете возвращать клиентов: напоминания, рекомендации, абонементы, гарантия или партнеры?"),
      "service_quality", ["providesServices", "repeat_customers"]);
  }

  if ((profile.hasEquipment || profile.capabilities?.needsEquipment) && !foodServiceModel && !dedicatedEquipmentSubcategories.has(subcategory)) {
    addIfMissing(questions, projectContext, ["equipmentList", "sectionNotes.equipment"],
      textarea("equipmentList", "Оборудование", "Перечислите ключевое оборудование, активы, инструменты и их назначение."),
      "equipment_capabilities", ["needsEquipment"]);
    addIfMissing(questions, projectContext, ["equipmentServiceSupport", "maintenancePlan", "sectionNotes.equipment"],
      textarea("equipmentServiceSupport", "Сервис оборудования", "Кто обслуживает оборудование, где запчасти и как быстро устраняется простой?"),
      "equipment_capabilities", ["needsEquipment", "maintenance"]);
  }

  const excluded = new Set(profile.excludedInterviewBlocks ?? []);
  return finalizeAdaptiveQuestions(questions, memory, gaps).filter((question) => !excluded.has(question.blockId ?? "") && !excluded.has(question.key));
}


type LocalizedQuestionCopy = Record<"ru" | "uz" | "en", { label: string; question: string }>;
type QuestionWithLocalizedCopy = InterviewQuestion & { localizedCopy?: LocalizedQuestionCopy };

function getSampleLabels(profile: BusinessProfile): Record<"ru" | "uz" | "en", string> | undefined {
  const labels = (profile.aiClassification as { labels?: Record<string, unknown> } | undefined)?.labels;
  if (!labels) return undefined;
  const ru = typeof labels.ru === "string" ? labels.ru : undefined;
  const uz = typeof labels.uz === "string" ? labels.uz : undefined;
  const en = typeof labels.en === "string" ? labels.en : undefined;
  if (!ru || !uz || !en) return undefined;
  return { ru, uz, en };
}

function localizedSampleQuestion(key: string, semanticGroup: string, copy: LocalizedQuestionCopy): InterviewQuestion {
  return {
    key,
    label: copy.ru.label,
    question: copy.ru.question,
    type: "textarea",
    optional: true,
    semanticGroup,
    localizedCopy: copy
  } as QuestionWithLocalizedCopy;
}

function sampleQuestionCopies(labels: Record<"ru" | "uz" | "en", string>) {
  return {
    business_idea: localizedSampleQuestion("sampleBusinessFit", "sample_business_fit", {
      ru: { label: "Отраслевой формат", question: `Для «${labels.ru}»: что именно продается или оказывается, кто основной клиент, какая единица продажи и чем формат отличается от конкурентов?` },
      uz: { label: "Soha formati", question: `«${labels.uz}» uchun aynan nima sotiladi yoki ko'rsatiladi, asosiy mijoz kim, sotuv birligi nima va format raqobatchilardan nimasi bilan farq qiladi?` },
      en: { label: "Industry format", question: `For “${labels.en}”: what exactly is sold or delivered, who is the primary customer, what is the sales unit, and how is the format different from competitors?` }
    }),
    location: localizedSampleQuestion("sampleLocationInfrastructure", "sample_location_infrastructure", {
      ru: { label: "Локация и инфраструктура", question: `Какая локация или зона обслуживания критична для «${labels.ru}»: площадь, трафик, подъезд, склад, инженерные условия, парковка или выездной радиус?` },
      uz: { label: "Lokatsiya va infratuzilma", question: `«${labels.uz}» uchun qaysi lokatsiya yoki xizmat zonasi muhim: maydon, oqim, kirish yo'li, ombor, muhandislik sharoitlari, avtoturargoh yoki chiqish radiusi?` },
      en: { label: "Location and infrastructure", question: `Which location or service area is critical for “${labels.en}”: area, traffic, access, storage, utilities, parking, or on-site service radius?` }
    }),
    equipment_launch: localizedSampleQuestion("sampleEquipmentLaunch", "sample_equipment_launch", {
      ru: { label: "Оборудование и запуск", question: `Что нужно для запуска «${labels.ru}»: оборудование, инструменты, мебель, IT/POS, монтаж, обучение, гарантия, первоначальный запас и резерв запуска?` },
      uz: { label: "Uskunalar va start", question: `«${labels.uz}»ni ishga tushirish uchun nimalar kerak: uskuna, asboblar, mebel, IT/POS, montaj, o'qitish, kafolat, boshlang'ich zaxira va start rezervi?` },
      en: { label: "Equipment and launch", question: `What is required to launch “${labels.en}”: equipment, tools, furniture, IT/POS, installation, training, warranty, initial stock, and launch reserve?` }
    }),
    operations: localizedSampleQuestion("sampleOperationsQuality", "sample_operations_quality", {
      ru: { label: "Процесс и качество", question: `Как будет работать ежедневная операционная модель «${labels.ru}»: мощность, график, роли сотрудников, зарплаты, контроль качества, гарантия и обработка претензий?` },
      uz: { label: "Jarayon va sifat", question: `«${labels.uz}»ning kunlik operatsion modeli qanday ishlaydi: quvvat, jadval, xodim rollari, ish haqi, sifat nazorati, kafolat va shikoyatlar?` },
      en: { label: "Operations and quality", question: `How will the daily operating model for “${labels.en}” work: capacity, schedule, staff roles, payroll, quality control, warranty, and complaint handling?` }
    }),
    suppliers_procurement: localizedSampleQuestion("sampleProcurementUnitEconomics", "sample_procurement_unit_economics", {
      ru: { label: "Закупки и себестоимость", question: `Какие товары, сырье, расходники или комплектующие регулярно нужны для «${labels.ru}», какова закупочная цена, условия оплаты, сроки поставки, запасные поставщики и риск списаний?` },
      uz: { label: "Xaridlar va tannarx", question: `«${labels.uz}» uchun qaysi tovarlar, xomashyo, sarf materiallari yoki butlovchilar doimiy kerak, xarid narxi, to'lov shartlari, yetkazish muddati, zaxira yetkazib beruvchilar va hisobdan chiqarish riski qanday?` },
      en: { label: "Procurement and unit cost", question: `Which goods, raw materials, consumables, or components are regularly needed for “${labels.en}”, and what are the purchase price, payment terms, delivery times, backup suppliers, and write-off risks?` }
    }),
    sales: localizedSampleQuestion("sampleMarketValidation", "sample_market_validation", {
      ru: { label: "Продажи и проверка спроса", question: `Как вы подтвердите спрос именно на «${labels.ru}»: тестовые продажи, заявки, B2B-договоры, цены конкурентов, поток локации, предзаказы или повторные клиенты?` },
      uz: { label: "Sotuv va talabni tekshirish", question: `Aynan «${labels.uz}» bo'yicha talabni qanday tasdiqlaysiz: test savdo, arizalar, B2B shartnomalar, raqobatchilar narxi, lokatsiya oqimi, oldindan buyurtmalar yoki takroriy mijozlar?` },
      en: { label: "Sales and demand validation", question: `How will you validate demand specifically for “${labels.en}”: test sales, leads, B2B contracts, competitor prices, location traffic, preorders, or repeat customers?` }
    }),
    financing: localizedSampleQuestion("sampleFinancingReadiness", "sample_financing_readiness", {
      ru: { label: "Финансирование запуска", question: `Какая структура финансирования нужна для «${labels.ru}»: собственные средства, кредит, лизинг, грант, оборотный капитал, залог, льготный период и запас ликвидности?` },
      uz: { label: "Start moliyalashtirish", question: `«${labels.uz}» uchun qanday moliyalashtirish tuzilmasi kerak: o'z mablag'i, kredit, lizing, grant, aylanma kapital, garov, imtiyozli davr va likvidlik zaxirasi?` },
      en: { label: "Launch financing", question: `What financing structure is needed for “${labels.en}”: own funds, loan, leasing, grant, working capital, collateral, grace period, and liquidity buffer?` }
    }),
    documents_experience: localizedSampleQuestion("sampleDocumentsCompliance", "sample_documents_compliance", {
      ru: { label: "Документы и требования", question: `Какие документы, договоры, касса, разрешения, санитарные, пожарные, трудовые или отраслевые требования нужно проверить для «${labels.ru}» до запуска, и какой опыт есть у команды?` },
      uz: { label: "Hujjatlar va talablar", question: `«${labels.uz}» uchun ishga tushirishdan oldin qaysi hujjatlar, shartnomalar, kassa, ruxsatnomalar, sanitariya, yong'in, mehnat yoki soha talablarini tekshirish kerak va jamoa tajribasi qanday?` },
      en: { label: "Documents and requirements", question: `Which documents, contracts, cash register, permits, sanitary, fire safety, labor or industry requirements must be checked for “${labels.en}” before launch, and what experience does the team have?` }
    })
  };
}

function addSampleQuestionOverlays(blocks: InterviewBlock[], profile: BusinessProfile): InterviewBlock[] {
  const sampleId = typeof profile.aiClassification?.sampleId === "string" ? profile.aiClassification.sampleId : undefined;
  const questions = sampleSpecificQuestionsForProfile(sampleId);
  if (questions.length === 0) return blocks;
  const byBlock = new Map<string, InterviewQuestion[]>();
  for (const question of questions) {
    if (!question.blockId) continue;
    byBlock.set(question.blockId, [...(byBlock.get(question.blockId) ?? []), question]);
  }
  const existingIds = new Set(blocks.map((item) => item.id));
  const merged = blocks.map((item) => {
    const additions = byBlock.get(item.id) ?? [];
    if (additions.length === 0) return item;
    return { ...item, questions: dedupeQuestions([...item.questions, ...additions]) };
  });
  for (const [blockId, additions] of byBlock.entries()) {
    if (!existingIds.has(blockId)) {
      merged.push(block(blockId, blockId, blockId, additions));
    }
  }
  return merged;
}

function optionalSectorBlocks(profile: BusinessProfile): InterviewBlock[] {
  if (profile.category === "import_export") {
    return [block("customs_currency_deep_dive", "Таможня, валюта и поставка", "Дополнительный блок только для внешнеторговой модели, чтобы глубже проверить вопросы, которые не дублируют common blocks.", [
      sg(textarea("customsClearancePlan", "План таможенного оформления", "Какие шаги таможенного оформления нужно пройти: код ТН ВЭД, брокер, сертификаты, сроки и ответственные?", { optional: true }), "customs_clearance_plan"),
      sg(textarea("currencyRiskPolicy", "Валютный риск", "Как будет снижаться риск изменения курса: валюта цены, предоплата, резерв, пересмотр цен?", { optional: true }), "currency_risk_policy"),
      sg(textarea("supplierPaymentSchedule", "График платежей поставщику", "Как распределены аванс, оплата перед отгрузкой, остаток и платежи за доставку/сертификацию?", { optional: true }), "payment_schedule")
    ])];
  }
  return [];
}

function validateVisibleRequiredInputs(blocks: InterviewBlock[], requiredInputs: string[]): string[] {
  const visibleQuestions = new Map(blocks.flatMap((item) => item.questions.map((question) => [question.key, question] as const)));
  return requiredInputs.filter((key) => {
    const question = visibleQuestions.get(key);
    return Boolean(question && !question.optional);
  });
}


const questionSemanticGroups: Record<string, string> = {
  productOrService: "offer",
  serviceType: "offer",
  serviceCategories: "offer",
  productCategories: "offer",
  menuCategories: "offer",
  washServiceTypes: "offer",
  cleaningServiceTypes: "offer",
  rentalToolCategories: "offer",
  rentalEquipmentList: "equipment_list",
  testServiceTypes: "offer",
  clientSegments: "target_customers",
  mobilityModel: "operational_model",
  labEquipmentList: "equipment_list",
  reagentsSupplierSelected: "supplier",
  monthlyReagentsCostUZS: "inputs",
  averageTestTicket: "average_ticket",
  testsPerMonth: "capacity",
  b2bContractsPlanned: "sales_validation",
  accreditationStatus: "documents_awareness",
  reportDocumentFormat: "documents",

  targetCustomers: "target_customers",
  targetCustomerSegments: "target_customers",
  salesChannels: "sales_channels",
  rentalTargetCustomers: "target_customers",
  customerAcquisitionChannels: "sales_channels",
  marketplaces: "sales_channels",
  deliveryChannels: "sales_channels",
  hasBuyerAgreements: "sales_validation",
  b2bAgreements: "sales_validation",
  b2bFleetAgreements: "sales_validation",
  clientContracts: "sales_validation",
  b2bContracts: "sales_validation",
  handoverActRequired: "sales_validation",
  rentalClientContracts: "sales_validation",

  monthlyCapacity: "capacity",
  dailyServiceCapacity: "capacity",
  dailyOrdersCapacity: "capacity",
  dailyCovers: "capacity",
  monthlyOutputCapacity: "capacity",
  monthlyOrders: "capacity",
  studentsCount: "capacity",
  patients: "capacity",
  carsPerDayStart: "capacity",
  carsPerDayStable: "capacity",
  firstMonthCarsPerDay: "capacity",
  stableCarsPerDay: "capacity",
  rentalOrdersPerMonth: "capacity",
  rentalFleetSize: "capacity_basis",
  washBaysCount: "capacity_basis",
  workingDaysPerMonth: "capacity_basis",
  workingHoursPerDay: "capacity_basis",
  averageServiceDurationMinutes: "capacity_basis",

  averagePrice: "average_ticket",
  averageServiceTicket: "average_ticket",
  averageCleaningTicket: "average_ticket",
  averageWashTicket: "average_ticket",
  averageTicket: "average_ticket",
  tariff: "average_ticket",
  averageRentalTicket: "average_ticket",
  coursePrice: "average_ticket",
  pricingModel: "pricing",
  rentalPricingModel: "pricing",
  depositPolicy: "pricing",
  rentalPaymentFlow: "payment",

  premisesStatus: "premises_status",
  rentalPremisesStatus: "premises_status",
  premisesAreaSqm: "premises_area",
  monthlyRent: "premises_rent",
  leaseTermMonths: "premises_lease",
  infrastructureReady: "infrastructure",
  rentalInfrastructureReady: "infrastructure",
  includedInfrastructure: "infrastructure",
  waterSource: "infrastructure",
  waterDrainageReady: "infrastructure",
  wastewaterHandling: "infrastructure",
  powerSupplyReady: "infrastructure",
  locationTraffic: "location",
  serviceArea: "location",
  serviceZone: "location",
  routes: "location",
  deliveryModel: "fulfillment",

  equipmentCondition: "equipment_condition",
  equipmentList: "equipment_list",
  kitchenEquipment: "equipment_list",
  carWashEquipment: "equipment_list",
  medicalEquipment: "equipment_list",
  supplierSelected: "supplier",
  supplierOfferAvailable: "supplier_offer",
  supplier: "supplier",
  alternativeSuppliers: "supplier",
  equipmentCapex: "equipment_cost",
  equipmentServiceSupport: "equipment_service",
  toolMaintenancePlan: "equipment_service",
  maintenanceCostPct: "equipment_service",

  staffPlan: "staff",
  doctors: "staff",
  teachers: "staff",
  drivers: "staff",
  staffSkills: "staff",
  teamSizePerShift: "staff",
  teamSizePerOrder: "staff",
  workingSchedule: "work_schedule",
  schedule: "work_schedule",
  qualityControlPlan: "quality",
  serviceQualityControl: "quality",
  warrantyPolicy: "quality",

  certificationAwareness: "documents_awareness",
  businessLegalForm: "legal_form",
  requiredPermits: "permits",
  rentalRequiredDocuments: "permits",
  sanitaryRequirementsKnown: "sanitary",
  sanitaryPermits: "sanitary",
  licensedActivity: "permits",
  chemicalSafetyRules: "safety",
  damageLiability: "liability",
  damageLossPolicy: "liability",
  rentalDamageLiability: "liability",
  experienceLevel: "team_experience",
  hasAccountantOrConsultant: "advisor_support",

  rawMaterials: "inputs",
  purchasePrices: "inputs",
  averagePurchaseCost: "purchase_price",
  averageMarkupPct: "margin",
  initialInventoryCostUZS: "initial_inventory",
  inventoryTurnoverDays: "inventory",
  supplierPaymentTerms: "supplier_terms",
  supplierLocation: "supplier_location",
  returnsExchangePolicy: "returns_exchange",
  storageModel: "storage",
  consumables: "inputs",
  washChemicals: "inputs",
  cleaningChemicals: "inputs",
  inventoryTurnover: "inventory",
  storageNeeds: "storage",
  delivery: "fulfillment",
  toolTrackingSystem: "operations",
  handoverInspectionProcess: "quality",
  clientSafetyInstructions: "safety",
  fulfillment: "fulfillment",

  supplierCurrency: "currency",
  foreignCurrencyPurchases: "currency",
  importCountry: "import_details",
  incoterms: "import_details",
  customsBroker: "import_details",
  certificates: "permits",
  deliveryTime: "import_logistics"
};

const alwaysKeepCommonKeys = new Set([
  "businessType",
  "businessIdea",
  "region",
  "district",
  "sectionNotes.businessIdea",
  "ownContributionAmount",
  "ownContributionCurrency",
  "creditNeeded",
  "requestedLoanAmount",
  "requestedLoanCurrency",
  "loanTermMonths",
  "loanAnnualRatePct",
  "loanRepaymentType",
  "loanPurpose",
  "collateralAvailable",
  "collateralType",
  "needsLeasing",
  "workingCapitalBufferMonths",
  "sectionNotes.finance",
  "chemicalSafetyRules",
  "testServiceTypes",
  "clientSegments",
  "averageTestTicket",
  "testsPerMonth",
  "labEquipmentList",
  "reagentsSupplierSelected",
  "equipmentCalibrationPlan"
]);

function questionGroup(question: InterviewQuestion): string | undefined {
  return question.semanticGroup ?? questionSemanticGroups[question.key];
}

function removeDuplicateQuestionsByBusinessProfile(blocks: InterviewBlock[], specificBlocks: InterviewBlock[]): InterviewBlock[] {
  if (specificBlocks.length === 0) return blocks;

  const specificKeys = new Set<string>();
  const specificGroups = new Set<string>();
  for (const item of specificBlocks) {
    for (const question of item.questions) {
      specificKeys.add(question.key);
      const group = questionGroup(question);
      if (group) specificGroups.add(group);
    }
  }

  return blocks
    .map((item) => {
      const questions = item.questions.filter((question) => {
        if (alwaysKeepCommonKeys.has(question.key)) return true;
        if (specificKeys.has(question.key)) return false;
        const group = questionGroup(question);
        return !group || !specificGroups.has(group);
      });
      return { ...item, questions };
    })
    .filter((item) => item.questions.length > 0);
}

function commonBlocksForProfile(profile: BusinessProfile, specificBlocks: InterviewBlock[]): InterviewBlock[] {
  const blocks = removeDuplicateQuestionsByBusinessProfile(commonBlocks(profile), specificBlocks);
  const fullDedicatedSubcategories = new Set(["auto_service", "car_wash", "cleaning_service", "tool_equipment_rental"]);
  if (profile.subcategory && fullDedicatedSubcategories.has(profile.subcategory)) {
    return blocks.filter((item) => item.id === "business_idea" || item.id === "financing" || item.id === "finance");
  }
  return blocks.filter((item) => {
    if (item.id === "business_idea" || item.id === "financing" || item.id === "finance") return true;
    return item.questions.some((question) => !question.optional && !question.key.startsWith("sectionNotes."));
  });
}

function requiredInputsFor(profile: BusinessProfile, availableQuestionKeys?: Set<string>): string[] {
  const common = [
    "businessType",
    "businessIdea",
    "region",
    "ownContributionAmount",
    "ownContributionCurrency",
    "creditNeeded"
  ];
  const profileRequired = profile.requiredDataForAnalysis ?? [];
  const operationalRequired: string[] = [];

  if (profile.hasCustomerFlowDependency || profile.hasWalkInTraffic || profile.hasPremises || profile.usesMobileService) {
    operationalRequired.push("premisesStatus");
  }
  if (profile.hasPremises || profile.hasWalkInTraffic || profile.hasCustomerFlowDependency) {
    operationalRequired.push("monthlyRent", "infrastructureReady");
  }
  if (profile.hasEquipment) {
    operationalRequired.push("equipmentCondition", "equipmentList", "equipmentCapex", "supplierSelected");
  }
  if (profile.category === "ecommerce") {
    operationalRequired.push("salesPlatform", "monthlyOrders", "averageTicket", "cac", "returnsPct", "packagingCostPerUnit", "directLogisticsCostPerUnit", "initialInventoryCostUZS", "averagePurchaseCost", "returnsExchangePolicy");
  } else if (profile.subcategory === "children_clothing_store") {
    operationalRequired.push("initialInventoryCostUZS", "averagePurchaseCost", "averageMarkupPct", "inventoryTurnoverDays", "supplierPaymentTerms", "returnsExchangePolicy");
  } else if (profile.category === "retail") {
    operationalRequired.push("skuCount", "initialInventoryCostUZS", "averagePurchaseCost", "averageMarkupPct", "inventoryTurnoverDays", "returnsExchangePolicy");
  } else if (profile.hasInventory || profile.sellsGoods || profile.producesGoods) {
    operationalRequired.push("rawMaterialCostPerUnit");
  }
  if (profile.hasStaff) operationalRequired.push("staffPlan");

  const compliance = ["certificationAwareness"];
  if (profile.hasSanitaryRequirements) compliance.push("sanitaryRequirementsKnown");
  if (profile.hasCurrencyExposure) compliance.push("foreignCurrencyPurchases");

  const required = Array.from(new Set([...common, ...profileRequired, ...operationalRequired, ...compliance]));
  if (!availableQuestionKeys) return required;
  return required.filter((key) => availableQuestionKeys.has(key));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "generic";
}

export function buildDynamicInterviewTemplate(data: Partial<StructuredProjectData> = {}): DynamicBusinessTemplate {
  const profile = (data.businessProfile && "keyRevenueDrivers" in data.businessProfile)
    ? data.businessProfile as unknown as BusinessProfile
    : classifyBusiness({
      businessType: data.businessType,
      businessIdea: data.businessIdea,
      region: data.region,
      language: data.userLanguage,
      answers: data
    });
  const adaptiveQuestionPack = generateAdaptiveQuestionPack({
    profile,
    locale: data.userLanguage === "uz" || data.userLanguage === "en" ? data.userLanguage : "ru",
    projectContext: data as StructuredProjectData,
    sourceCategories: profile.sourceCategories?.length ? profile.sourceCategories : profile.recommendedSourceCategories
  });
  const sampleAwareBlocks = addSampleQuestionOverlays(categoryAdaptiveCommonBlocks(profile), profile);
  const rawBlocks = canonicalizeInterviewBlocks(dedupeInterviewQuestions([
    ...sampleAwareBlocks,
    ...adaptivePackBlock(adaptiveQuestionPack),
    ...optionalSectorBlocks(profile)
  ]));
  const blocks = ensureConditionalMonthlyRentQuestions(applyQuestionSpecificityGuardrails(rawBlocks, profile));
  const availableQuestionKeys = new Set(blocks.flatMap((item) => item.questions.map((question) => question.key)));
  const categoryKey = profile.category === "beauty_wellness" ? "services" : profile.category === "transport" ? "logistics" : profile.category;
  const assumptions = assumptionsByCategory[categoryKey] ?? assumptionsByCategory.generic;
  return {
    code: `${profile.category}_${profile.subcategory ?? slug(data.businessType ?? "generic")}`,
    name: data.businessType || profile.subcategory || "Универсальный бизнес",
    description: `AI-driven dynamic template for ${profile.category}${profile.subcategory ? ` / ${profile.subcategory}` : ""}`,
    businessType: data.businessType || "Универсальный бизнес",
    requiredInputs: validateVisibleRequiredInputs(blocks, requiredInputsFor(profile, availableQuestionKeys)),
    assumptions,
    mainEquipment: profile.hasEquipment ? profile.keyCostDrivers.filter((item) => /equipment|vehicle|tools|kitchen|мебель|оборуд/i.test(item)).concat(["Оборудование по смете"]) : ["Не требуется или уточняется"],
    mainRawMaterials: profile.hasInventory || profile.producesGoods || profile.sellsGoods ? ["Товары/сырье/расходники по категории", ...profile.keyCostDrivers.filter((item) => /food|raw|inventory|consumables|supplier|purchase/i.test(item))] : ["Расходники по услуге"],
    mainRisks: profile.keyRisks,
    interviewBlocks: blocks,
    riskRules: {
      marketDemand: "Риск повышается, если нет подтверждения спроса, каналов продаж или клиентского потока.",
      suppliers: "Риск повышается при одном поставщике, импортной зависимости или валютных закупках.",
      workingCapital: "Риск повышается при большом запасе, предоплате, отсрочках оплаты и сезонности.",
      equipment: "Риск повышается при неподтвержденном КП, сервисе, монтаже и сроках поставки.",
      compliance: "Риск повышается при regulated activity, санитарных, экологических или лицензируемых требованиях.",
      bankability: "Риск повышается при слабой доказательной базе, отсутствии залога, КП и финансовой модели."
    },
    scoringRules: {
      detailedSalesNotesBonus: 5,
      detailedEquipmentNotesBonus: 5,
      detailedSupplierNotesBonus: 5,
      concreteFiguresBonus: 8,
      unknownAnswersPenalty: -10
    }
  };
}

export function getBusinessProfileForData(data: Partial<StructuredProjectData> = {}) {
  if (data.businessProfile && "keyRevenueDrivers" in data.businessProfile) {
    return data.businessProfile as unknown as BusinessProfile;
  }
  return classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, language: data.userLanguage, answers: data });
}
