import type { RiskCategory, RiskItem, RiskLevel, StructuredProjectData } from "../types/project";
import { classifyBusiness } from "../business/businessClassifier.ts";
import { hasTextDetails } from "../utils/safeText.ts";

const levelRank: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
const categoryLabels: Record<RiskCategory, string> = {
  market: "Рынок",
  financial: "Финансы",
  operational: "Операции",
  legal: "Право",
  compliance: "Соответствие требованиям",
  infrastructure: "Инфраструктура",
  bankability: "Финансируемость",
  environmental: "Экология",
  currency: "Валюта",
  supplier: "Поставщики",
  staff: "Персонал",
  technology: "Технологии",
  seasonality: "Сезонность"
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 7) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function stableRiskId(input: Pick<RiskItem, "code" | "category" | "probability" | "impact" | "title">): string {
  const base = `${input.code || input.title || "risk"}-${input.category}-${input.probability}-${input.impact}`;
  return base.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "");
}


function readableCollateralType(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "актив";
  const normalized = text.toLowerCase();
  const map: Record<string, string> = {
    real_estate: "недвижимость",
    vehicle: "автомобиль",
    car: "автомобиль",
    equipment: "оборудование",
    inventory: "товарный запас",
    deposit: "денежное обеспечение",
    guarantee: "гарантия"
  };
  return map[normalized] ?? text.replace(/_/g, " ");
}

function risk(input: Omit<RiskItem, "level" | "score">): RiskItem {
  const score = input.probability * input.impact;
  return {
    evidence: [],
    missingData: [],
    nextStep: input.mitigation,
    id: input.id ?? stableRiskId(input),
    ...input,
    score,
    level: levelFromScore(score)
  };
}

function ensureUniqueRiskIds(risks: RiskItem[]): RiskItem[] {
  const seen = new Map<string, number>();
  return risks.map((item, index) => {
    const base = item.id ?? (stableRiskId(item) || `risk-${index}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? { ...item, id: base } : { ...item, id: `${base}-${count + 1}` };
  });
}

function hasDetailed(text: unknown): boolean {
  return hasTextDetails(text, 40);
}

function isToyBusiness(project: StructuredProjectData): boolean {
  return /игруш|toy|o'yinchoq|oyinchoq/i.test(`${project.businessType ?? ""} ${project.productOrService ?? ""}`);
}

function classifiedBusinessProfile(project: StructuredProjectData) {
  return project.businessProfile ?? classifyBusiness({
    businessType: project.businessType,
    businessIdea: project.businessIdea,
    region: project.region,
    language: project.userLanguage,
    answers: project
  });
}

function classifiedSubcategory(project: StructuredProjectData): string | undefined {
  return classifiedBusinessProfile(project).subcategory;
}

function isOnlineOnlyProject(project: StructuredProjectData): boolean {
  const profile = classifiedBusinessProfile(project);
  return String(project.premisesStatus ?? "") === "online_only" || profile.operationalModel === "online_only" || (profile.category === "ecommerce" && [undefined, "online_only", "home_storage"].includes(project.premisesStatus));
}

function channelList(project: StructuredProjectData): string[] {
  const channels = project.customerAcquisitionChannels ?? project.salesChannels ?? [];
  if (Array.isArray(channels) && channels.length) return channels.map(String);
  const platforms = Array.isArray(project.salesPlatform) ? project.salesPlatform.map(String) : project.salesPlatform ? [String(project.salesPlatform)] : [];
  const marketplaces = Array.isArray(project.marketplaces) ? project.marketplaces.map(String) : [];
  return [...platforms, ...marketplaces];
}

function isAutoService(project: StructuredProjectData): boolean {
  return classifiedSubcategory(project) === "auto_service";
}

function isCarWash(project: StructuredProjectData): boolean {
  return classifiedSubcategory(project) === "car_wash";
}

function isToolRental(project: StructuredProjectData): boolean {
  return classifiedSubcategory(project) === "tool_equipment_rental";
}

function isIceCreamTrailer(project: StructuredProjectData): boolean {
  const subcategory = classifiedSubcategory(project);
  return subcategory === "ice_cream_mobile_trailer" || subcategory === "ice_cream_kiosk";
}

export function evaluateCertificationRisk(project: StructuredProjectData): RiskItem {
  const toyBusiness = isToyBusiness(project);
  const isYoungAge = toyBusiness && project.ageGroup === "age_0_3";
  const hasPlan = project.certificationAwareness === "aware" || project.hasAccountantOrConsultant || hasDetailed(project.sectionNotes?.complianceExperience);
  const probability: 1 | 2 | 3 = hasPlan ? 1 : project.certificationAwareness === "partly_aware" ? 2 : 3;
  const impact: 1 | 2 | 3 = isYoungAge || project.certificationAwareness !== "aware" ? 3 : 2;
  return risk({
    code: "certification_risk",
    title: toyBusiness ? "Безопасность продукции и маркировка" : "Документы и разрешения",
    category: "legal",
    probability,
    impact,
    description: toyBusiness
      ? "Игрушки и детские товары требуют подтверждения безопасности, корректной маркировки и документов до продаж."
      : "Для запуска бизнеса могут потребоваться регистрация, договоры, разрешения, санитарные или отраслевые документы.",
    reason: hasPlan
      ? "План документов или консультант указан, но подтверждающие материалы нужно проверить."
      : isYoungAge
        ? "Игрушки для детей 0-3 лет требуют особенно внимательной проверки, а план документов не подтвержден."
        : "Пока нет полного понимания обязательных документов и разрешений.",
    mitigation: toyBusiness
      ? "Проверить требования к игрушкам, получить консультацию, заложить бюджет и сроки сертификации до закупки материалов и упаковки."
      : "Проверить отраслевые требования, получить консультацию, заложить бюджет и сроки оформления до запуска.",
    owner: "Предприниматель / консультант",
    timing: "До запуска продаж"
  });
}

export function evaluateFxRisk(project: StructuredProjectData): RiskItem {
  const foreignCurrencyPurchases = project.foreignCurrencyPurchases === true;
  const supplierCurrency = project.supplierCurrency;
  const importedSharePct = Number((project as unknown as { importedSharePct?: number; importedPartsSharePct?: number }).importedPartsSharePct ?? (project as unknown as { importedSharePct?: number }).importedSharePct ?? 0);
  const profile = project.businessProfile as { importsGoodsOrInputs?: boolean; hasCurrencyExposure?: boolean } | undefined;
  const imported = project.rawMaterialSource === "import" || profile?.importsGoodsOrInputs === true;
  const mixed = project.rawMaterialSource === "mixed" || (importedSharePct > 0 && importedSharePct < 70);
  const supplierCurrencyLabel = supplierCurrency === "mixed" ? "смешанная" : supplierCurrency === "unknown" ? "не указана" : String(supplierCurrency ?? "");
  const nonUzsSupplier = Boolean(supplierCurrency && supplierCurrency !== "UZS" && supplierCurrency !== "unknown");
  const importedEquipment = Boolean(project.equipmentCondition && project.equipmentCondition !== "not_selected" && project.serviceSupportUzbekistan === false);
  const highFx = imported || foreignCurrencyPurchases || nonUzsSupplier || importedSharePct >= 70 || importedEquipment;
  const mediumFx = mixed || profile?.hasCurrencyExposure === true;
  const probability: 1 | 2 | 3 = highFx ? 3 : mediumFx ? 2 : 1;
  const impact: 1 | 2 | 3 = highFx ? 3 : mediumFx ? 2 : 1;
  return risk({
    code: "fx_risk",
    title: "Валютный риск",
    category: "currency",
    probability,
    impact,
    description: "Сырье, оборудование, товары, расходники, кредит или лизинг с валютной привязкой могут зависеть от курса валют, а выручка обычно формируется в UZS.",
    reason: highFx
      ? "Есть импортные/валютные закупки, импортное оборудование или валюта поставщика не UZS; валютный риск не может быть low."
      : mediumFx
        ? "Есть смешанная модель поставок или возможная валютная экспозиция; риск минимум medium до проверки поставщиков."
        : "Признаков импортных и валютных закупок пока не указано.",
    evidence: [
      imported ? "Импортные поставки/сырье" : "Импортные поставки не подтверждены",
      nonUzsSupplier ? `Валюта поставщика: ${supplierCurrencyLabel}` : "Валюта поставщика UZS или не указана"
    ],
    missingData: highFx ? ["Фактическая валюта договоров", "Доля импортных закупок", "FX-буфер в цене"] : ["Подтвердить валюту основных поставщиков"],
    mitigation: "Сравнить локальных и импортных поставщиков, предусмотреть валютный запас в цене, зафиксировать условия договора и иметь 2-3 альтернативных поставщика.",
    owner: "Финансы / закупки",
    timing: "До закупки сырья, товара или оборудования"
  });
}

export function evaluateWorkingCapitalRisk(project: StructuredProjectData): RiskItem {
  const paymentTerm = project.clientPaymentTerm;
  const longPayment = paymentTerm === "days_30" || paymentTerm === "days_60_plus";
  const ownUZS = Number(project.ownContributionUZS ?? project.ownContribution ?? project.ownContributionAmount ?? 0);
  const estimatedFixedCosts = 45_000_000;
  const monthsCovered = ownUZS / estimatedFixedCosts;
  const probability: 1 | 2 | 3 = longPayment && monthsCovered < 2 ? 3 : monthsCovered >= 3 ? 1 : 2;
  const impact: 1 | 2 | 3 = project.rawMaterialSource === "import" || !project.contingencyReserveAvailable ? 3 : 2;
  return risk({
    code: "working_capital_risk",
    title: "Оборотный капитал",
    category: "financial",
    probability,
    impact,
    description: "Бизнесу нужны деньги на закупки, аренду, зарплату и период до оплаты от клиентов.",
    reason: longPayment
      ? "Клиенты могут платить через 30+ дней, поэтому требуется резерв на закупки, зарплату и аренду."
      : monthsCovered >= 3
        ? "Собственные средства предварительно покрывают не менее 3 месяцев фиксированных расходов."
        : "Резерв оборотного капитала выглядит ограниченным.",
    mitigation: "Отдельно рассчитать закупки, график оплат клиентов и минимум 3 месяца фиксированных расходов.",
    owner: "Финансы",
    timing: "До подачи заявки"
  });
}

export function evaluateEquipmentRisk(project: StructuredProjectData): RiskItem {
  const profile = classifiedBusinessProfile(project);
  if (profile.category === "ecommerce") {
    const hasStorage = hasDetailed(project.storageModel) || Boolean(project.fulfillment);
    const hasLogisticsCost = Number(project.directLogisticsCostPerUnit ?? 0) > 0;
    const probability: 1 | 2 | 3 = hasStorage && hasLogisticsCost ? 1 : hasStorage ? 2 : 3;
    return risk({
      code: "equipment_risk",
      title: "Склад и фулфилмент",
      category: "operational",
      probability,
      impact: 2,
      description: "Для онлайн-магазина основной операционный риск связан не с производственным оборудованием, а с хранением товара, упаковкой, доставкой и обработкой возвратов.",
      reason: hasStorage ? "Модель хранения описана, но нужны тарифы доставки, упаковки, возвраты и учет остатков." : "Модель хранения, упаковки и отправки заказов пока не описана.",
      missingData: ["Модель хранения", "Стоимость упаковки", "Тариф доставки", "Правила возвратов", "Учет остатков"],
      mitigation: "Зафиксировать место хранения, регламент упаковки, тарифы курьеров/маркетплейса, правила возвратов и минимальный запас товара по категориям.",
      owner: "Операции / фулфилмент",
      timing: "До первой закупки и запуска рекламы"
    });
  }
  const noService = project.serviceSupportUzbekistan === false || project.supplierSelected === false;
  const probability: 1 | 2 | 3 = project.equipmentCondition === "used" || noService ? 3 : project.supplierSelected ? 1 : 2;
  const impact: 1 | 2 | 3 = project.monthlyCapacity && project.monthlyCapacity > 40000 ? 3 : 2;
  return risk({
    code: "equipment_risk",
    title: "Оборудование и сервис",
    category: "operational",
    probability,
    impact,
    description: "Срыв поставки, монтаж или простой оборудования снижает продажи, выпуск или качество услуги.",
    reason: project.equipmentCondition === "used" ? "Планируется б/у оборудование, сервис и запасные части нужно подтвердить." : noService ? "Поставщик или сервисная поддержка не подтверждены." : "Новое оборудование и поставщик указаны, но КП и гарантию нужно проверить.",
    mitigation: "Получить КП, гарантию, условия сервиса, список запасных частей или альтернатив и план обучения персонала.",
    owner: "Производство",
    timing: "До аванса поставщику"
  });
}

export function evaluateInfrastructureRisk(project: StructuredProjectData): RiskItem {
  const probability: 1 | 2 | 3 = project.premisesStatus === "searching" || project.premisesStatus === "land_required" ? 3 : project.infrastructureReady ? 1 : 2;
  const impact: 1 | 2 | 3 = project.infrastructureReady ? 2 : 3;
  return risk({
    code: "infrastructure_risk",
    title: "Помещение и инфраструктура",
    category: "infrastructure",
    probability,
    impact,
    description: "Площадка или локация влияет на запуск, поток клиентов, коммунальные условия, склад и доступ к транспорту.",
    reason: project.infrastructureReady ? "Помещение и инфраструктура заявлены, но параметры нужно проверить документально." : "Нет подтверждения готовности помещения, электричества или вентиляции.",
    mitigation: "Проверить коммунальные условия, склад, договор аренды/собственности, трафик и ограничения по деятельности.",
    owner: "Операции",
    timing: "До монтажа оборудования"
  });
}

export function evaluateSalesChannelRisk(project: StructuredProjectData): RiskItem {
  const channels = channelList(project);
  const probability: 1 | 2 | 3 = channels.length >= 3 && project.hasBuyerAgreements ? 1 : channels.length >= 2 ? 2 : 3;
  const impact: 1 | 2 | 3 = project.averagePrice ? 2 : 3;
  return risk({
    code: "sales_channel_concentration",
    title: "Продажи и концентрация каналов",
    category: "market",
    probability,
    impact,
    description: "Зависимость от одного канала продаж повышает риск недозагрузки мощности и кассовых разрывов.",
    reason: channels.length >= 3 && project.hasBuyerAgreements ? "Указано несколько каналов и есть предварительные договоренности." : `Указано каналов продаж: ${channels.length || 0}. Подтвержденный спрос нужно усилить.`,
    mitigation: "Собрать прайс-листы конкурентов, предварительные заказы/заявки и план продаж минимум по 3 каналам.",
    owner: "Продажи",
    timing: "До запуска производства"
  });
}

export function evaluateCollateralRisk(project: StructuredProjectData): RiskItem {
  if (project.creditNeeded === "no") {
    return {
      code: "collateral_risk",
      title: "Залог",
      category: "bankability",
      probability: 1,
      impact: 1,
      level: "low",
      score: 1,
      description: "Не применяется: пользователь не планирует кредитное финансирование.",
      reason: "Кредит не выбран, поэтому отсутствие залога не штрафует проект.",
      mitigation: "Оценивать достаточность собственных средств и/или лизинга оборудования.",
      owner: "Финансы",
      timing: "При изменении структуры финансирования"
    };
  }
  const hasCollateral = project.collateralAvailable === true;
  const value = Number(project.collateralEstimatedValue ?? 0);
  const loan = Number(project.requestedLoanUZS ?? project.requestedLoanAmount ?? 0);
  const probability: 1 | 2 | 3 = hasCollateral ? (value >= loan * 0.8 ? 1 : 2) : 3;
  const impact: 1 | 2 | 3 = project.creditNeeded === "yes" ? 3 : 2;
  return risk({
    code: "collateral_risk",
    title: "Залог и структура кредита",
    category: "bankability",
    probability,
    impact,
    description: "При кредитном финансировании банк оценивает залог, денежные потоки и документы.",
    reason: hasCollateral ? "Залог указан, но оценку и приемлемость нужно подтвердить." : "Кредит нужен, но залог не указан или не подтвержден.",
    mitigation: "Рассмотреть лизинг оборудования, увеличение собственных средств, гарантию, поручительство или альтернативные источники финансирования.",
    owner: "Финансы / банк",
    timing: "До подачи заявки"
  });
}

export function evaluateBankabilityRisk(project: StructuredProjectData): RiskItem {
  const detailedFinance = hasDetailed(project.sectionNotes?.finance);
  const probability: 1 | 2 | 3 = project.hasBuyerAgreements && detailedFinance ? 1 : project.hasBuyerAgreements ? 2 : 3;
  const impact: 1 | 2 | 3 = project.creditNeeded === "no" ? 2 : 3;
  return risk({
    code: "bankability_risk",
    title: "Готовность к финансированию",
    category: "bankability",
    probability,
    impact,
    description: "Для банка или лизинговой компании нужны продажи, финансовая модель, документы и понятный источник погашения.",
    reason: project.hasBuyerAgreements ? "Есть заявленные договоренности, их нужно подтвердить документами." : "Предварительные договоренности с покупателями пока не подтверждены.",
    mitigation: "Собрать КП поставщиков, подтверждение тестовых продаж/предзаказов, документы по помещению или фулфилменту, налоговые документы и управленческую финансовую модель.",
    owner: "Предприниматель / консультант",
    timing: "До подачи заявки"
  });
}

function evaluateMarketDemandRisk(project: StructuredProjectData): RiskItem {
  const hasDemandNotes = hasDetailed(project.sectionNotes?.salesMarketing);
  const hasChannels = channelList(project).length >= 2;
  return risk({
    code: "market_demand",
    title: "Рыночный спрос",
    category: "market",
    probability: hasDemandNotes && hasChannels ? 1 : hasChannels ? 2 : 3,
    impact: project.averagePrice || project.stableMonthlyRevenue ? 2 : 3,
    description: "Без подтвержденного спроса бизнес может не выйти на плановую выручку.",
    reason: hasDemandNotes && hasChannels ? "Каналы и спрос описаны, но их нужно подтвердить документами или тестовыми продажами." : "Подтверждение спроса и каналов продаж пока недостаточно конкретное.",
    mitigation: "Проверить цены конкурентов, собрать предварительные заказы, заявки из Instagram/Telegram/маркетплейса или результаты тестовых продаж.",
    owner: "Продажи",
    timing: "До запуска"
  });
}

function evaluateCustomerAcquisitionRisk(project: StructuredProjectData): RiskItem {
  const hasChannelPlan = channelList(project).length > 0 || Boolean(project.salesPlatform) || Boolean(project.marketplaces);
  const hasBudget = Boolean(project.adBudget || project.marketingBudget || project.cac);
  return risk({
    code: "customer_acquisition_risk",
    title: "Привлечение клиентов",
    category: "market",
    probability: hasChannelPlan && hasBudget ? 1 : hasChannelPlan ? 2 : 3,
    impact: project.averagePrice || project.averageServiceTicket ? 2 : 3,
    description: "Недостаточный клиентский поток снижает загрузку мощности и выручку.",
    reason: hasChannelPlan ? "Каналы продаж указаны, но стоимость привлечения клиента, бюджет и конверсия требуют проверки." : "Каналы привлечения и клиентский поток не подтверждены.",
    missingData: ["Стоимость привлечения клиента", "Канал продаж", "Конверсия", "План тестовых продаж"],
    mitigation: "Провести проверку рынка, собрать 20-30 интервью/заявок и подтвердить стоимость привлечения по каналам.",
    owner: "Продажи / маркетинг",
    timing: "До запуска рекламы"
  });
}

function evaluatePricingMarginRisk(project: StructuredProjectData): RiskItem {
  const hasMargin = Boolean(project.grossMarginPct || project.marginPct || project.foodCostPct || project.averagePrice || project.averageServiceTicket);
  return risk({
    code: "pricing_margin_risk",
    title: "Цена и маржа",
    category: "financial",
    probability: hasMargin ? 2 : 3,
    impact: project.creditNeeded === "yes" ? 3 : 2,
    description: "Слабая маржа или непроверенная цена может сделать проект неустойчивым к росту затрат.",
    reason: hasMargin ? "Есть часть данных по цене/марже, но себестоимость и чувствительность нужно пересчитать." : "Цена, себестоимость или маржа не подтверждены.",
    missingData: ["Средний чек/цена", "COGS", "Маржа", "Сценарий снижения продаж"],
    mitigation: "Собрать прайс конкурентов, КП поставщиков и пересчитать экономику единицы продажи по базовому, стрессовому и оптимистичному сценарию.",
    owner: "Финансы",
    timing: "До утверждения цены"
  });
}

function evaluateSupplierRisk(project: StructuredProjectData): RiskItem {
  const selected = project.supplierSelected === true || Boolean(project.supplier);
  const alternatives = project.alternativeSuppliers === true;
  return risk({
    code: "supplier_concentration_risk",
    title: "Поставщики",
    category: "supplier",
    probability: selected && alternatives ? 1 : selected ? 2 : 3,
    impact: project.rawMaterialSource === "import" || project.supplierCurrency !== "UZS" ? 3 : 2,
    description: "Зависимость от одного поставщика повышает риск срыва закупок, роста цены и нехватки запасов.",
    reason: selected ? "Поставщик указан, но альтернативы и условия нужно подтвердить." : "Основной поставщик не подтвержден.",
    missingData: ["КП поставщика", "Альтернативы", "Сроки поставки", "Валюта"],
    mitigation: "Получить 2-3 КП, сравнить сроки, валюту, предоплату и гарантию поставки.",
    owner: "Закупки",
    timing: "До аванса"
  });
}

function evaluateInventoryRisk(project: StructuredProjectData): RiskItem {
  const hasInventory = project.businessProfile?.hasInventory || project.productCategories || project.rawMaterials || project.menuCategories;
  return risk({
    code: "inventory_risk",
    title: "Запасы и оборачиваемость",
    category: "operational",
    probability: hasInventory ? 2 : 1,
    impact: hasInventory && (project.rawMaterialSource === "import" || project.productCategories) ? 3 : 2,
    description: "Запасы требуют оборотного капитала, места хранения и контроля списаний/устаревания.",
    reason: hasInventory ? "Модель предполагает материалы, товары или расходники." : "Для чистой услуги существенные товарные остатки не подтверждены.",
    missingData: hasInventory ? ["Минимальный запас", "Срок хранения", "Оборачиваемость", "Склад"] : [],
    mitigation: "Рассчитать минимальный запас, срок хранения, списания и потребность в оборотном капитале.",
    owner: "Операции / закупки",
    timing: "До первой закупки"
  });
}

function evaluateStaffSkillsRisk(project: StructuredProjectData): RiskItem {
  const hasStaffPlan = Boolean(project.staffPlan || project.staffSkills || project.doctors || project.teachers || project.drivers);
  return risk({
    code: "staff_skills_risk",
    title: "Персонал и квалификация",
    category: "staff",
    probability: hasStaffPlan ? 2 : 3,
    impact: project.businessProfile?.hasRegulatedActivity || project.businessProfile?.hasLicensingOrPermits ? 3 : 2,
    description: "Квалификация и доступность персонала влияют на качество, мощность и compliance.",
    reason: hasStaffPlan ? "План персонала есть, но зарплаты, квалификация и график требуют проверки." : "План персонала не детализирован.",
    missingData: ["Роли", "Количество", "Зарплаты", "Квалификация", "График"],
    mitigation: "Подготовить штатное расписание, требования к квалификации, фонд оплаты труда и план замещения.",
    owner: "Операции / HR",
    timing: "До найма"
  });
}

function evaluateComplianceRisk(project: StructuredProjectData): RiskItem {
  const profile = project.businessProfile;
  const regulated = Boolean(profile?.hasRegulatedActivity || profile?.hasLicensingOrPermits || profile?.hasSanitaryRequirements);
  return risk({
    code: "compliance_licensing_risk",
    title: "Compliance и разрешения",
    category: "compliance",
    probability: project.hasAccountantOrConsultant ? 2 : regulated ? 3 : 2,
    impact: regulated ? 3 : 2,
    description: "Отраслевые документы, разрешения, санитарные и safety-требования могут быть условием запуска.",
    reason: regulated ? "Категория бизнеса имеет признаки регулируемой деятельности или санитарных требований." : "Общие регистрационные и налоговые требования все равно нужно проверить.",
    missingData: ["Точный вид деятельности", "Помещение", "Официальные требования", "Ответственный за документы"],
    mitigation: "Проверить требования через license.gov.uz, lex.uz, профильный госорган и зафиксировать статус каждого документа.",
    owner: "Предприниматель / юрист",
    timing: "До запуска"
  });
}

function evaluateSeasonalityRisk(project: StructuredProjectData): RiskItem {
  const seasonal = Boolean(project.hasSeasonality || project.businessProfile?.hasSeasonality || project.seasonality || project.climateRisks);
  return risk({
    code: "seasonality_risk",
    title: "Сезонность",
    category: "seasonality",
    probability: seasonal ? 3 : 1,
    impact: seasonal ? 2 : 1,
    description: "Сезонность может создавать месяцы с низкой выручкой и повышенной потребностью в резерве.",
    reason: seasonal ? "В категории или ответах есть признаки сезонности." : "Сильная сезонность не подтверждена.",
    missingData: seasonal ? ["Помесячный прогноз продаж", "Сезонный запас", "Резерв денежных средств"] : [],
    mitigation: "Построить помесячный денежный поток, резерв и план продаж вне сезона.",
    owner: "Финансы / продажи",
    timing: "До финансового плана"
  });
}

function evaluateDataQualityRisk(project: StructuredProjectData): RiskItem {
  const missingCore = [project.businessType, project.businessIdea, project.region].filter((value) => !value).length;
  return risk({
    code: "data_quality_risk",
    title: "Качество исходных данных",
    category: "operational",
    probability: missingCore > 0 ? 3 : 2,
    impact: 2,
    description: "Неточные исходные данные снижают надежность финансовой модели и выводов отчета.",
    reason: missingCore > 0 ? "Не все стартовые данные заполнены." : "Стартовые данные есть, но коммерческие показатели нужно подтвердить источниками.",
    missingData: ["Подтвержденные цены", "КП", "Договор аренды", "Источник спроса"],
    mitigation: "Разделить факты, предположения, расчеты и статистику с источниками; непроверенные цифры оставить как допущения.",
    owner: "Предприниматель",
    timing: "До подачи отчета инвестору/банку"
  });
}



function evaluateCarWashLocationRisk(project: StructuredProjectData): RiskItem {
  const hasTraffic = hasDetailed(project.locationTraffic) || Boolean(project.premisesStatus);
  const bays = Number(project.washBaysCount ?? 0);
  return risk({
    code: "car_wash_location_traffic_risk",
    title: "Автомойка: локация и автомобильный поток",
    category: "market",
    probability: hasTraffic && bays > 0 ? 2 : 3,
    impact: 3,
    description: "Для автомойки локация, подъезд, видимость с дороги, парковка и поток автомобилей напрямую определяют загрузку постов.",
    reason: hasTraffic ? "Локация описана, но ее нужно подтвердить наблюдением трафика, конкурентами на карте и условиями подъезда." : "Локация и источник автомобильного потока пока недостаточно подтверждены.",
    missingData: ["Подсчет трафика", "Конкуренты рядом", "Подъезд и парковка", "Видимость вывески", "Пики спроса"],
    mitigation: "Проверить локацию в разные часы, собрать цены конкурентов в радиусе 1-3 км, оценить парковку/очередь и договориться о вывеске.",
    owner: "Продажи / операции",
    timing: "До подписания аренды"
  });
}

function evaluateCarWashWaterWastewaterRisk(project: StructuredProjectData): RiskItem {
  const ready = project.waterDrainageReady === true && hasDetailed(project.wastewaterHandling);
  return risk({
    code: "car_wash_water_wastewater_risk",
    title: "Автомойка: вода, слив и сточные воды",
    category: "environmental",
    probability: ready ? 2 : 3,
    impact: 3,
    description: "Автомойка зависит от стабильной воды, допустимого слива, фильтрации и безопасного обращения с химией.",
    reason: ready ? "Вода и слив описаны, но требования нужно подтвердить договором и профильной проверкой." : "Источник воды, слив или порядок сточных вод не подтверждены достаточно конкретно.",
    missingData: ["Источник воды", "Слив/канализация", "Фильтры/оборотная вода", "Ответственность в договоре", "Требования по автохимии"],
    mitigation: "До монтажа оборудования письменно закрепить воду, слив, фильтрацию, лимиты, коммунальные платежи и ответственность за нарушения.",
    owner: "Операции / арендодатель",
    timing: "До ремонта и монтажа"
  });
}

function evaluateCarWashEquipmentChemicalsRisk(project: StructuredProjectData): RiskItem {
  const hasEquipment = Array.isArray(project.carWashEquipment) ? project.carWashEquipment.length > 0 : hasDetailed(project.equipmentList);
  const supplier = project.supplierSelected === true || project.supplierOfferAvailable === true;
  return risk({
    code: "car_wash_equipment_chemicals_risk",
    title: "Автомойка: оборудование, сервис и автохимия",
    category: "operational",
    probability: hasEquipment && supplier ? 2 : 3,
    impact: 3,
    description: "Аппараты высокого давления, насосы, фильтры, пылесосы и автохимия влияют на качество, скорость и простои.",
    reason: hasEquipment ? "Перечень оборудования указан, но поставщика, гарантию, сервис и запасные расходники нужно подтвердить." : "Оборудование и автохимия пока не детализированы.",
    missingData: ["КП оборудования", "Гарантия и сервис", "Расход автохимии", "Альтернативные поставщики", "План обслуживания"],
    mitigation: "Получить 2-3 КП, проверить сервис в Узбекистане, запланировать запас расходников и регламент обслуживания оборудования.",
    owner: "Операции / закупки",
    timing: "До оплаты оборудования"
  });
}

function evaluateCarWashB2BRisk(project: StructuredProjectData): RiskItem {
  const b2b = project.b2bFleetAgreements === true || project.hasBuyerAgreements === true || (project.targetCustomers ?? []).some((item) => /fleet|corporate|taxi|delivery/i.test(String(item)));
  return risk({
    code: "car_wash_b2b_contract_risk",
    title: "Автомойка: B2B-договоры и повторные клиенты",
    category: "financial",
    probability: b2b ? 2 : 3,
    impact: 2,
    description: "Автопарки, такси, доставка и корпоративные клиенты могут дать стабильную загрузку, но часто требуют отсрочку оплаты и понятные акты.",
    reason: b2b ? "B2B-направление заявлено, но условия оплаты, объемы и документы нужно подтвердить." : "Повторный поток и корпоративные клиенты пока не подтверждены.",
    missingData: ["Список B2B-клиентов", "Минимальный объем", "Отсрочка оплаты", "Договор/акт", "Скидки и маржа"],
    mitigation: "Собрать 5-10 потенциальных корпоративных клиентов, предложить пакеты, проверить отсрочку оплаты и заложить ее в оборотный капитал.",
    owner: "Продажи / финансы",
    timing: "До запуска продаж"
  });
}

function evaluateAutoServiceLeaseRisk(project: StructuredProjectData): RiskItem {
  const hasWrittenTerms = hasDetailed(project.boxLeaseTerms);
  const leaseMonths = Number(project.leaseTermMonths ?? 0);
  const renewal = project.leaseRenewalOption === true;
  const sublease = project.subleaseAllowed === true;
  const weakLease = !hasWrittenTerms || leaseMonths < 12 || project.boxLeaseModel === "verbal_agreement" || sublease === false;
  return risk({
    code: "auto_service_box_lease_risk",
    title: "Автосервис: риск аренды/субаренды бокса",
    category: "infrastructure",
    probability: weakLease ? 3 : leaseMonths >= 24 && renewal ? 1 : 2,
    impact: 3,
    description: "Для одного бокса внутри большого автосервиса ключевой риск связан с правом пользоваться боксом и общей инфраструктурой достаточно долго для окупаемости оборудования.",
    reason: weakLease ? "Условия бокса, срок договора или право субаренды не подтверждены достаточно надежно." : "Договорные условия описаны, но их нужно закрепить письменно и сверить со сроком окупаемости/финансирования.",
    evidence: [
      `Срок договора: ${leaseMonths || "не указан"} мес.`,
      `Модель пользования: ${project.boxLeaseModel ?? "не указана"}`,
      renewal ? "Право продления указано" : "Право продления не подтверждено"
    ],
    missingData: ["Письменный договор", "Право субаренды", "Срок и продление", "Условия расторжения", "Компенсация улучшений"],
    mitigation: "Заключить письменный договор аренды/субаренды, закрепить срок минимум на период окупаемости или финансирования, право продления, инфраструктуру, комиссию, доступ к клиентам и условия расторжения.",
    owner: "Предприниматель / юрист",
    timing: "До покупки оборудования и подачи заявки на финансирование"
  });
}

function evaluateAutoServiceInfrastructureRisk(project: StructuredProjectData): RiskItem {
  const missingCritical = [project.liftIncluded, project.compressorIncluded, project.ventilationReady, project.waterDrainageReady].filter((value) => value === false).length;
  const hasInfrastructureText = hasDetailed(project.includedInfrastructure);
  return risk({
    code: "auto_service_infrastructure_risk",
    title: "Автосервис: инфраструктура бокса",
    category: "infrastructure",
    probability: missingCritical >= 2 || !hasInfrastructureText ? 3 : missingCritical === 1 ? 2 : 1,
    impact: 3,
    description: "Подъемник, электричество, компрессор, вода/слив, вентиляция, парковка, хранение расходников и зона ожидания напрямую влияют на возможность оказывать услуги.",
    reason: missingCritical >= 2 ? "Есть неподтвержденные или отсутствующие критичные элементы инфраструктуры." : hasInfrastructureText ? "Инфраструктура описана, но ее нужно проверить по договору и фактическому доступу." : "Перечень включенной инфраструктуры не детализирован.",
    missingData: ["Подъемник", "Компрессор/воздух", "Электричество", "Вентиляция", "Вода/слив", "Парковка", "Склад расходников"],
    mitigation: "Сделать акт/приложение к договору с перечнем включенной инфраструктуры, ограничениями по работам и ответственностью за поломки/коммунальные платежи.",
    owner: "Операции / арендодатель",
    timing: "До подписания договора и монтажа оборудования"
  });
}

function evaluateAutoServiceWasteRisk(project: StructuredProjectData): RiskItem {
  const plan = project.wasteOilHandlingPlan;
  const confirmed = plan === "confirmed_contract" || plan === "handled_by_parent_service";
  return risk({
    code: "auto_service_waste_oil_risk",
    title: "Автосервис: отработанное масло и отходы",
    category: "environmental",
    probability: confirmed ? 1 : 3,
    impact: 3,
    description: "Замена масла, фильтров и технических жидкостей создает экологический и compliance-риск, если не закреплен порядок сбора, хранения и передачи отходов.",
    reason: confirmed ? "Порядок обращения с отходами заявлен как подтвержденный или закрепленный за большим сервисом." : "План по отработанному маслу и отходам требует документального подтверждения.",
    evidence: [`Статус плана: ${plan ?? "не указан"}`],
    missingData: ["Кто отвечает за масло и фильтры", "Место хранения", "Договор/процесс передачи отходов", "Ответственность в договоре бокса"],
    mitigation: "Закрепить в договоре, кто отвечает за масла, фильтры, жидкости, химию и ветошь; при необходимости заключить договор с оператором и организовать безопасное хранение.",
    owner: "Операции / compliance",
    timing: "До начала услуг по замене масла и жидкостей"
  });
}

function evaluateAutoServicePaymentFlowRisk(project: StructuredProjectData): RiskItem {
  const flow = project.clientPaymentFlow;
  const throughParent = flow === "parent_service_cashier" || flow === "shared_admin" || flow === "mixed";
  const hasSettlement = hasDetailed(project.paymentSettlementTerms);
  return risk({
    code: "auto_service_payment_flow_risk",
    title: "Автосервис: прием оплаты и перечисление доли",
    category: "financial",
    probability: throughParent && !hasSettlement ? 3 : throughParent ? 2 : flow ? 1 : 3,
    impact: 2,
    description: "Если оплату принимает большой автосервис или общий администратор, важно закрепить комиссию, сроки перечисления и подтверждающие документы.",
    reason: throughParent && !hasSettlement ? "Оплата зависит от площадки, но сроки и порядок перечисления доли не описаны." : "Модель оплаты указана, но ее нужно закрепить документально.",
    evidence: [`Поток оплаты: ${flow ?? "не указан"}`, project.parentServiceCommissionPct != null ? `Комиссия площадки: ${project.parentServiceCommissionPct}%` : "Комиссия не указана"],
    missingData: ["Кто принимает оплату", "Комиссия", "Срок перечисления", "Акт/отчет", "Касса/налоги"],
    mitigation: "В договоре с площадкой прописать, кто принимает деньги, комиссию, сроки перечисления, отчетность, кассовую дисциплину и ответственность за задержки.",
    owner: "Финансы / арендодатель",
    timing: "До приема первых клиентов"
  });
}


function evaluateToolRentalDamageLossRisk(project: StructuredProjectData): RiskItem {
  const hasPolicy = hasDetailed(project.damageLossPolicy) || hasDetailed(project.rentalDamageLiability);
  const hasDeposit = Boolean(project.depositPolicy && project.depositPolicy !== "not_decided" && project.depositPolicy !== "no_deposit");
  return risk({
    code: "tool_rental_damage_loss_risk",
    title: "Аренда инструмента: поломка, кража и невозврат",
    category: "operational",
    probability: hasPolicy && hasDeposit ? 2 : 3,
    impact: 3,
    description: "В прокате инструмента ключевой риск — повреждение, кража, просрочка возврата и спор о состоянии оборудования.",
    reason: hasPolicy ? "Политика поломки/невозврата описана, но ее нужно закрепить в договоре, залоге и акте приема-передачи." : "Политика залога, невозврата и повреждений пока не подтверждена.",
    missingData: ["Размер залога", "Акт выдачи/возврата", "Фотофиксация состояния", "Штраф за просрочку", "Ответственность клиента"],
    mitigation: "Ввести договор аренды, акт приема-передачи, фото состояния, понятный залог, тариф просрочки и порядок удержания при повреждении.",
    owner: "Операции / юрист",
    timing: "До первой выдачи инструмента"
  });
}

function evaluateToolRentalUtilizationRisk(project: StructuredProjectData): RiskItem {
  const orders = Number(project.rentalOrdersPerMonth ?? project.monthlyCapacity ?? 0);
  const fleet = Number(project.rentalFleetSize ?? 0);
  return risk({
    code: "tool_rental_utilization_risk",
    title: "Аренда инструмента: загрузка парка",
    category: "market",
    probability: orders > 0 && fleet > 0 ? 2 : 3,
    impact: 3,
    description: "Доход проката зависит не только от количества инструментов, а от их загрузки, повторных аренд и сезонности ремонта/строительства.",
    reason: orders > 0 ? "План заказов указан, но его нужно подтвердить заявками, ценами конкурентов и тестовым спросом." : "План заказов и загрузка парка пока недостаточно подтверждены.",
    missingData: ["Заказы в месяц", "Количество единиц парка", "Прайс конкурентов", "Сезонность", "Повторные клиенты"],
    mitigation: "Проверить спрос через объявления, Telegram/Instagram, карты и обзвон бригад; считать загрузку по каждой дорогой категории инструмента отдельно.",
    owner: "Продажи / операции",
    timing: "До закупки полного парка"
  });
}

function evaluateToolRentalMaintenanceRisk(project: StructuredProjectData): RiskItem {
  const hasPlan = hasDetailed(project.toolMaintenancePlan);
  return risk({
    code: "tool_rental_maintenance_risk",
    title: "Аренда инструмента: ремонт, износ и простой",
    category: "operational",
    probability: hasPlan ? 2 : 3,
    impact: 2,
    description: "Инструмент в аренде быстрее изнашивается; простой из-за ремонта снижает выручку и портит клиентский опыт.",
    reason: hasPlan ? "План обслуживания указан, но нужны бюджет, сервисные мастера и запасные единицы." : "План обслуживания, ремонта и списаний не описан.",
    missingData: ["Регламент проверки", "Сервис/мастер", "Запчасти", "Резервный инструмент", "Бюджет ремонта"],
    mitigation: "Заложить регулярную диагностику, ремонтный бюджет, сервисных мастеров, запас расходников и график списания/обновления парка.",
    owner: "Операции",
    timing: "С первого месяца работы"
  });
}

function evaluateToolRentalContractsRisk(project: StructuredProjectData): RiskItem {
  const contract = project.rentalClientContracts === true || project.clientContracts === true;
  const act = project.handoverActRequired === true;
  return risk({
    code: "tool_rental_contracts_deposit_risk",
    title: "Аренда инструмента: договор, залог и акт",
    category: "legal",
    probability: contract && act ? 2 : 3,
    impact: 3,
    description: "Без договора, залога и акта приема-передачи сложно взыскать ущерб, доказать состояние инструмента и управлять просрочками.",
    reason: contract && act ? "Договор и акт заявлены, но формы нужно проверить юристом и привязать к кассе/оплатам." : "Договор аренды, акт или залог пока не подтверждены.",
    missingData: ["Форма договора", "Акт приема-передачи", "Правила залога", "Штрафы за просрочку", "Данные клиента"],
    mitigation: "Подготовить договор, акт, правила залога, чек-лист выдачи/возврата и порядок удержаний; проверить с юристом и бухгалтером.",
    owner: "Юрист / бухгалтер",
    timing: "До первой аренды"
  });
}

function evaluateIceCreamLocationPermitRisk(project: StructuredProjectData): RiskItem {
  const hasLocation = hasDetailed(project.locationTraffic) || Boolean(project.trailerLocationType);
  const permit = project.locationPermitStatus;
  const confirmedPermit = permit === "obtained" || permit === "private_agreement";
  return risk({
    code: "ice_cream_location_permit_risk",
    title: "Мороженое: локация и право стоянки трейлера",
    category: "infrastructure",
    probability: confirmedPermit && hasLocation ? 1 : hasLocation ? 2 : 3,
    impact: 3,
    description: "Для трейлера мороженого место стоянки, пешеходный поток, видимость и право торговать на точке напрямую определяют выручку.",
    reason: confirmedPermit ? "Статус места указан, но договор/разрешение и фактический поток нужно подтвердить." : "Право размещения трейлера или выбранная точка не подтверждены достаточно надежно.",
    missingData: ["Договор/разрешение на место", "Пешеходный поток по часам", "Конкуренты рядом", "Электричество/генератор", "Ограничения по торговле"],
    mitigation: "До покупки трейлера закрепить точку договором или разрешением, проверить поток в будни/выходные и подтвердить доступ к электричеству, воде или генератору.",
    owner: "Предприниматель / юрист",
    timing: "До оплаты трейлера и оборудования"
  });
}

function evaluateIceCreamColdChainRisk(project: StructuredProjectData): RiskItem {
  const equipment = project.iceCreamEquipment;
  const equipmentCount = Array.isArray(equipment) ? equipment.length : equipment ? 1 : 0;
  const supplierSelected = project.supplierSelected === true;
  return risk({
    code: "ice_cream_cold_chain_risk",
    title: "Мороженое: холодовая цепь и простой фризера",
    category: "operational",
    probability: equipmentCount >= 2 && supplierSelected ? 2 : 3,
    impact: 3,
    description: "Фризер, морозильники, генератор и хранение сырья критичны: сбой холода ведет к списаниям, остановке продаж и санитарному риску.",
    reason: equipmentCount >= 2 ? "Оборудование указано, но нужно подтвердить сервис, гарантию, резервный холод и расходники." : "Критичное холодовое оборудование и резервный план не детализированы.",
    missingData: ["Фризер", "Морозильник", "Генератор/электричество", "Сервис и гарантия", "План списаний"],
    mitigation: "Получить КП на фризер и морозильники, проверить сервис в Узбекистане, заложить генератор/резерв питания и регламент контроля температуры.",
    owner: "Операции / закупки",
    timing: "До запуска продаж"
  });
}

function evaluateIceCreamSeasonalityTrafficRisk(project: StructuredProjectData): RiskItem {
  const volume = Number(project.monthlyCapacity ?? 0);
  const hasChannels = (project.targetCustomers ?? []).length >= 2;
  return risk({
    code: "ice_cream_seasonality_traffic_risk",
    title: "Мороженое: сезонность и трафик",
    category: "seasonality",
    probability: volume > 0 && hasChannels ? 2 : 3,
    impact: 2,
    description: "Продажи мороженого зависят от погоды, сезона, школьных каникул, выходных и фактического потока возле трейлера.",
    reason: volume > 0 ? "План продаж указан, но нужно разделить его по сезонам и дням недели." : "План продаж не подтвержден расчетом трафика и сезонности.",
    missingData: ["Помесячный прогноз", "Продажи в жаркий/холодный сезон", "Поток по часам", "План вне сезона"],
    mitigation: "Построить помесячный денежный поток, отдельно считать будни/выходные и подготовить план на низкий сезон: горячие напитки, десерты, мероприятия или перенос точки.",
    owner: "Продажи / финансы",
    timing: "До утверждения финансовой модели"
  });
}


function isChildrenClothingProject(project: StructuredProjectData): boolean {
  const profile = classifiedBusinessProfile(project);
  const text = `${project.businessType ?? ""} ${project.businessIdea ?? ""} ${profile.subcategory ?? ""}`;
  return profile.subcategory === "children_clothing_store" || /детск.*одежд|одежд.*детск|children.*clothing|kids.*clothing|bolalar.*kiyim/i.test(text);
}

const money = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} UZS`;
const pctText = (value: number) => `${Math.round(value * 10) / 10}%`;

function childrenClothingMetrics(project: StructuredProjectData) {
  const record = project as Record<string, any>;
  const traffic = Number(record.visitorsPerDay ?? record.dailyTraffic ?? record.traffic ?? record.customersPerDay ?? 0);
  const conversionRaw = Number(record.conversionPct ?? record.conversionRate ?? record.conversion ?? 0);
  const conversion = conversionRaw > 0 && conversionRaw <= 1 ? conversionRaw * 100 : conversionRaw;
  const workingDays = Number(record.workingDaysPerMonth ?? record.workingDays ?? record.operatingDaysPerMonth ?? 26) || 26;
  const financial = record.financialResult as Record<string, any> | undefined;
  const monthlySales = Number(financial?.revenue?.monthlySales ?? financial?.revenue?.monthlyCapacity ?? record.monthlySales ?? record.salesPerMonth ?? record.monthlyCapacity ?? (traffic > 0 && conversion > 0 ? Math.round(traffic * conversion / 100 * workingDays) : 0));
  const averageTicket = Number(financial?.revenue?.averagePrice ?? record.averageTicket ?? record.averageCheck ?? record.averagePrice ?? 0);
  const averagePurchaseCost = Number(record.averagePurchaseCost ?? record.purchasePrice ?? record.unitCost ?? financial?.cogs?.unitCOGS ?? 0);
  const rent = Number(financial?.opex?.monthlyRent ?? record.monthlyRent ?? record.rentAmount ?? 0);
  const payrollFromRoles = Array.isArray(record.staffPlan?.roles)
    ? record.staffPlan.roles.reduce((sum: number, role: Record<string, unknown>) => sum + Number(role.count ?? 0) * Number(role.monthlySalaryAmount ?? role.monthlySalaryUZS ?? role.monthlySalary ?? 0), 0)
    : 0;
  const payroll = Number(financial?.opex?.monthlyPayroll ?? record.monthlyPayroll ?? record.payrollMonthly ?? record.salaryAmount ?? 0) || payrollFromRoles;
  const equipment = Number(financial?.capex?.equipmentCost ?? record.equipmentCapex ?? record.equipmentCost ?? record.startupAssetsCost ?? 0);
  const initialInventory = Number(financial?.capex?.initialInventoryCost ?? record.initialInventoryCostUZS ?? record.initialInventoryCapex ?? record.firstPurchaseAmount ?? record.firstPurchaseCost ?? 0);
  const own = Number(financial?.financing?.ownContributionUZS ?? record.ownContributionUZS ?? record.ownContributionAmount ?? record.ownContribution ?? 0);
  const loan = Number(financial?.financing?.requestedLoanUZS ?? record.requestedLoanUZS ?? record.requestedLoanAmount ?? 0);
  const loanPayment = Number(financial?.financing?.debtServiceForDscr ?? financial?.financing?.totalMonthlyDebtService ?? record.estimatedMonthlyLoanPayment ?? 0);
  const monthlyRevenue = Number(financial?.revenue?.monthlyRevenue ?? monthlySales * averageTicket);
  const cogs = Number(financial?.cogs?.monthlyCOGS ?? monthlySales * averagePurchaseCost);
  const grossProfit = Number(financial?.profitability?.monthlyGrossProfit ?? monthlyRevenue - cogs);
  const ebitda = Number(financial?.profitability?.monthlyEBITDA ?? grossProfit - rent - payroll);
  const ebitdaMargin = Number(financial?.profitability?.ebitdaMarginPct ?? (monthlyRevenue > 0 ? ebitda / monthlyRevenue * 100 : 0));
  const dscr = financial?.financing?.dscr !== undefined && financial?.financing?.dscr !== null ? Number(financial.financing.dscr) : loanPayment > 0 ? ebitda / loanPayment : undefined;
  const totalNeedProxy = Number(financial?.financing?.totalInvestmentNeed ?? equipment + initialInventory + Math.max(0, (rent + payroll) * 3));
  const fundingGap = Math.max(0, Number(financial?.financing?.financingGap ?? totalNeedProxy - own - loan));
  return { traffic, conversion, workingDays, monthlySales, averageTicket, averagePurchaseCost, rent, payroll, equipment, initialInventory, own, loan, loanPayment, monthlyRevenue, cogs, grossProfit, ebitda, ebitdaMargin, dscr, fundingGap };
}
function childrenClothingRiskItems(project: StructuredProjectData): RiskItem[] {
  const m = childrenClothingMetrics(project);
  const location = [project.region, project.district].filter(Boolean).join(" / ") || "выбранной торговой зоне";
  const supplierRegion = String((project as Record<string, unknown>).supplierCountry ?? project.rawMaterialSource ?? "Турция/Китай или локальные поставщики");
  const loanTerm = Number(project.loanTermMonths ?? 0);
  return [
    risk({
      code: "children_clothing_dscr_risk",
      title: "Недостаточный DSCR и слабое покрытие долга",
      category: "bankability",
      probability: 3,
      impact: 3,
      description: "При кредитном финансировании банк в первую очередь проверит источник погашения и запас EBITDA относительно ежемесячного платежа.",
      reason: `Плановая выручка ${money(m.monthlyRevenue)}, EBITDA около ${money(m.ebitda)}, кредит ${money(m.loan)}${loanTerm ? ` на ${loanTerm} мес.` : ""}; при таких вводных покрытие долга слабое и требует улучшения до заявки.`,
      mitigation: "До подачи заявки снизить аренду/ФОТ, увеличить маржу, сократить стартовые вложения или увеличить собственные средства, чтобы DSCR приблизился к банковскому уровню.",
      owner: "Финансы",
      timing: "До подачи заявки"
    }),
    risk({
      code: "children_clothing_low_ebitda_margin_risk",
      title: "Низкая EBITDA-маржа при текущей аренде и ФОТ",
      category: "financial",
      probability: m.ebitdaMargin < 5 ? 3 : 2,
      impact: 3,
      description: "Небольшая операционная маржа делает магазин уязвимым к скидкам, возвратам, росту аренды и закупочной цены.",
      reason: `Валовая прибыль после закупочной цены ${money(m.averagePurchaseCost)} составляет около ${money(m.grossProfit)}, аренда и ФОТ вместе ${money(m.rent + m.payroll)}, EBITDA-маржа около ${pctText(m.ebitdaMargin)}.`,
      mitigation: "Пересчитать ассортимент по маржинальности: школьная форма, обувь, верхняя одежда и базовые комплекты; закрепить минимальную наценку и лимит скидок.",
      owner: "Финансы / закупки",
      timing: "До закупки первой партии"
    }),
    risk({
      code: "children_clothing_funding_gap_risk",
      title: "Недофинансирование запуска и оборотного капитала",
      category: "financial",
      probability: m.fundingGap > 0 ? 3 : 2,
      impact: 3,
      description: "Запуск магазина одежды требует не только ремонта и оборудования, но и товарного запаса, депозитов, сезонного резерва и денежных буферов.",
      reason: `Собственные средства ${money(m.own)} и кредит ${money(m.loan)} нужно сопоставить с оборудованием ${money(m.equipment)}, первой закупкой ${money(m.initialInventory)} и минимум 3 месяцами аренды+ФОТ; расчетный разрыв по предварительной модели ${money(m.fundingGap)}.`,
      mitigation: "Закрыть разрыв до запуска: увеличить собственные средства, сократить стартовый ассортимент, договориться об отсрочке поставщика или подтвердить дополнительный кредит/лизинг.",
      owner: "Предприниматель",
      timing: "До подписания аренды и закупки"
    }),
    risk({
      code: "children_clothing_size_grid_risk",
      title: "Ошибочный размерный ряд и зависание неликвидных размеров",
      category: "operational",
      probability: 2,
      impact: 3,
      description: "В детской одежде прибыль зависит от правильного баланса возрастов, размеров, пола, сезона и остатков.",
      reason: `Первая закупка ${money(m.initialInventory)} должна быть распределена по ходовым размерам; ошибка в размерной сетке быстро превращает товар в замороженный оборотный капитал.`,
      mitigation: "Собрать спрос по размерам через тестовые посты Instagram/Telegram, продажи конкурентов и 3 КП поставщиков; ограничить закупку редких размеров в первой партии.",
      owner: "Закупки",
      timing: "До первой закупки"
    }),
    risk({
      code: "children_clothing_school_season_risk",
      title: "Сезонный риск школьной формы и верхней одежды",
      category: "seasonality",
      probability: 2,
      impact: 3,
      description: "Детская одежда имеет выраженные пики: школа, смена сезона, праздники и распродажи.",
      reason: `План ${m.monthlySales || "не указан"} продаж/мес. нужно проверить помесячно: среднее значение может скрывать провалы после школьного сезона или перед сменой коллекции.`,
      mitigation: "Сделать помесячный денежный поток, разделить школьную форму, базовую одежду, обувь и верхнюю одежду; заранее определить скидки и распродажи остатков.",
      owner: "Продажи / закупки",
      timing: "До утверждения ассортимента"
    }),
    risk({
      code: "children_clothing_fx_import_risk",
      title: "Валютный риск импортного ассортимента",
      category: "currency",
      probability: /import|usd|турц|кит|china|turkey/i.test(supplierRegion) ? 3 : 2,
      impact: 3,
      description: "Импортная одежда и обувь зависят от курса, предоплаты, логистики и сроков поставки.",
      reason: `Поставки указаны как ${supplierRegion}; продажи идут в UZS, поэтому курс и условия оплаты могут съесть маржу между закупочной ценой ${money(m.averagePurchaseCost)} и средним чеком ${money(m.averageTicket)}.`,
      mitigation: "Зафиксировать валюту КП, срок действия цены, логистику и запас курса; иметь локальную альтернативу для базовых размеров и школьной формы.",
      owner: "Закупки / финансы",
      timing: "До оплаты поставщика"
    }),
    risk({
      code: "children_clothing_supplier_assortment_risk",
      title: "Задержка поставок и неполный размерный ряд",
      category: "supplier",
      probability: 2,
      impact: 3,
      description: "Даже при наличии спроса магазин теряет продажи, если ходовые размеры и цвета недоступны в нужный сезон.",
      reason: `Для плана ${m.monthlySales || "не указано"} продаж/мес. нужен стабильный товарный поток и дозакупка ходовых размеров, а не только разовая первая закупка.`,
      mitigation: "Получить 2-3 альтернативных поставщика, условия дозакупки, обмена брака и сроков доставки; закрепить артикулы/размеры в заказе.",
      owner: "Закупки",
      timing: "До запуска и ежемесячно"
    }),
    risk({
      code: "children_clothing_returns_exchange_risk",
      title: "Возвраты и обмены после примерки",
      category: "compliance",
      probability: 2,
      impact: 2,
      description: "Одежда для детей часто меняется из-за размера, фасона или дефекта; это влияет на кассу, остатки и клиентскую лояльность.",
      reason: "Нужно заранее определить правила обмена, возврата, чеков, упаковки, брака и повторной реализации товара после примерки.",
      mitigation: "Подготовить письменную политику возврата/обмена, обучить продавцов, настроить учет возвратов в кассе/POS и сверку с остатками.",
      owner: "Операции / бухгалтер",
      timing: "До первых продаж"
    }),
    risk({
      code: "children_clothing_traffic_location_risk",
      title: "Недостаточный поток покупателей в выбранной торговой зоне",
      category: "market",
      probability: m.traffic > 0 ? 2 : 3,
      impact: 3,
      description: "Для офлайн-магазина детской одежды трафик родителей и семей рядом с точкой определяет выручку сильнее, чем общий рынок города.",
      reason: `План основан на ${m.traffic || "неподтвержденном"} посетителях/день, ${pctText(m.conversion || 0)} конверсии и локации ${location}; эти цифры нужно проверить наблюдением и тестовыми заявками.`,
      mitigation: "Посчитать трафик 3-5 похожих точек в Чиланзаре в будни/выходные, сравнить конкурентов и проверить заявки через Instagram/Telegram до подписания долгой аренды.",
      owner: "Продажи",
      timing: "До подписания аренды"
    }),
    risk({
      code: "children_clothing_competition_risk",
      title: "Конкуренция с Instagram-магазинами, маркетплейсами и ТЦ",
      category: "market",
      probability: 2,
      impact: 2,
      description: "Покупатели детской одежды сравнивают цену, размерный ряд, доставку и условия обмена между офлайн-точками и онлайн-продавцами.",
      reason: `Средний чек ${money(m.averageTicket)} нужно подтвердить сравнением с 5 конкурентами по школьной форме, обуви, верхней одежде и базовым комплектам.`,
      mitigation: "Собрать матрицу цен конкурентов, выделить 3-5 ключевых товарных позиций, добавить Telegram/Instagram продажи и программу повторных покупателей.",
      owner: "Маркетинг / продажи",
      timing: "До открытия"
    }),
    risk({
      code: "children_clothing_cash_docs_risk",
      title: "Кассовая дисциплина, товарные документы и маркировка",
      category: "legal",
      probability: 2,
      impact: 2,
      description: "Для розницы важны онлайн-касса, товарные накладные, документы поставщика, происхождение импортного товара, состав ткани и корректные возвраты.",
      reason: "Без связки касса - товарный учет - документы поставщика банк и налоговые консультанты не смогут надежно проверить выручку, маржу и остатки.",
      mitigation: "До запуска подготовить регистрацию, налоговый режим, онлайн-кассу/POS, товарные накладные, документы импортного товара, правила возврата и складской учет.",
      owner: "Бухгалтер / администратор",
      timing: "До первых продаж"
    }),
    risk({
      code: "children_clothing_collateral_valuation_risk",
      title: "Переоценка залога банком",
      category: "bankability",
      probability: project.collateralAvailable ? 2 : 3,
      impact: 2,
      description: "Банк может принять залог по стоимости ниже ожиданий предпринимателя или потребовать дополнительные документы.",
      reason: `В качестве залога указан ${readableCollateralType(project.collateralType)}${project.collateralEstimatedValue ? ` на ${project.collateralEstimatedValue.toLocaleString("ru-RU")} ${String((project as Record<string, unknown>).collateralCurrency ?? "")}` : ""}; нужна независимая банковская оценка и документы собственности.`,
      mitigation: "Получить документы собственности, предварительную оценку банка/оценщика и запасной вариант обеспечения: поручительство, лизинг оборудования или увеличение собственного участия.",
      owner: "Финансы / банк",
      timing: "До подачи кредитной заявки"
    })
  ];
}

export function riskRelevanceFilter(item: RiskItem, project: StructuredProjectData): boolean {
  if (isOnlineOnlyProject(project) && item.code === "infrastructure_risk") return false;
  if (isOnlineOnlyProject(project) && item.category === "infrastructure" && !item.code.includes("storage")) return false;
  return true;
}

export function generateRiskMatrix(project: StructuredProjectData): RiskItem[] {
  const risks = isChildrenClothingProject(project) ? childrenClothingRiskItems(project) : [
    evaluateMarketDemandRisk(project),
    evaluateCustomerAcquisitionRisk(project),
    evaluateSalesChannelRisk(project),
    evaluatePricingMarginRisk(project),
    evaluateFxRisk(project),
    evaluateSupplierRisk(project),
    evaluateInventoryRisk(project),
    evaluateEquipmentRisk(project),
    evaluateInfrastructureRisk(project),
    evaluateStaffSkillsRisk(project),
    evaluateComplianceRisk(project),
    evaluateCertificationRisk(project),
    evaluateWorkingCapitalRisk(project),
    evaluateSeasonalityRisk(project),
    evaluateBankabilityRisk(project),
    evaluateCollateralRisk(project),
    evaluateDataQualityRisk(project)
  ];
  if (isAutoService(project)) {
    risks.push(
      evaluateAutoServiceLeaseRisk(project),
      evaluateAutoServiceInfrastructureRisk(project),
      evaluateAutoServiceWasteRisk(project),
      evaluateAutoServicePaymentFlowRisk(project)
    );
  }
  if (isCarWash(project)) {
    risks.push(
      evaluateCarWashLocationRisk(project),
      evaluateCarWashWaterWastewaterRisk(project),
      evaluateCarWashEquipmentChemicalsRisk(project),
      evaluateCarWashB2BRisk(project)
    );
  }
  if (isToolRental(project)) {
    risks.push(
      evaluateToolRentalDamageLossRisk(project),
      evaluateToolRentalUtilizationRisk(project),
      evaluateToolRentalMaintenanceRisk(project),
      evaluateToolRentalContractsRisk(project)
    );
  }
  if (isIceCreamTrailer(project)) {
    risks.push(
      evaluateIceCreamLocationPermitRisk(project),
      evaluateIceCreamColdChainRisk(project),
      evaluateIceCreamSeasonalityTrafficRisk(project)
    );
  }
  return ensureUniqueRiskIds(risks.filter((item) => riskRelevanceFilter(item, project)).sort((a, b) => levelRank[b.level] - levelRank[a.level] || b.score - a.score));
}

export function riskCategoryLabel(category: RiskCategory): string {
  return categoryLabels[category];
}
