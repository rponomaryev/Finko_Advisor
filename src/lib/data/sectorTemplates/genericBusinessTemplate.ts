import type { DynamicBusinessTemplate } from "../../types/sector.ts";
import type { InterviewBlock, InterviewQuestion, SectorAssumptions } from "../../types/project.ts";

const genericAssumptions: SectorAssumptions = {
  minViableInvestmentUZS: 120000000,
  recommendedOwnContributionMinPct: 20,
  recommendedOwnContributionMaxPct: 35,
  typicalGrossMarginMinPct: 18,
  typicalGrossMarginMaxPct: 38,
  defaultGrossMarginPct: 28,
  defaultMonthlyFixedCostsUZS: 25000000,
  defaultVariableCostPct: 58,
  defaultLoanAnnualRatePct: 26,
  defaultLeasingAnnualRatePct: 24,
  defaultLoanTermMonths: 36,
  defaultLeasingTermMonths: 36,
  defaultWorkingCapitalMonths: 3,
  defaultCertificationCostUZS: 8000000,
  defaultMoldCostUZS: 0,
  defaultEquipmentCostUZS: 85000000,
  defaultPremisesSetupCostUZS: 35000000,
  defaultPackagingSetupCostUZS: 6000000,
  defaultInitialInventoryCostUZS: 30000000,
  defaultExpectedUtilizationPct: 65
};

const cafeAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 180000000,
  defaultGrossMarginPct: 42,
  defaultMonthlyFixedCostsUZS: 38000000,
  defaultVariableCostPct: 46,
  defaultEquipmentCostUZS: 90000000,
  defaultPremisesSetupCostUZS: 60000000,
  defaultPackagingSetupCostUZS: 12000000,
  defaultCertificationCostUZS: 12000000,
  defaultInitialInventoryCostUZS: 25000000
};

const bakeryAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 170000000,
  defaultGrossMarginPct: 38,
  defaultMonthlyFixedCostsUZS: 36000000,
  defaultVariableCostPct: 48,
  defaultEquipmentCostUZS: 95000000,
  defaultPremisesSetupCostUZS: 55000000,
  defaultPackagingSetupCostUZS: 12000000,
  defaultCertificationCostUZS: 12000000,
  defaultInitialInventoryCostUZS: 22000000
};

const iceCreamKioskAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 85000000,
  defaultGrossMarginPct: 44,
  defaultMonthlyFixedCostsUZS: 24000000,
  defaultVariableCostPct: 42,
  defaultEquipmentCostUZS: 45000000,
  defaultPremisesSetupCostUZS: 18000000,
  defaultPackagingSetupCostUZS: 8000000,
  defaultCertificationCostUZS: 9000000,
  defaultInitialInventoryCostUZS: 15000000
};

const sewingAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 160000000,
  defaultGrossMarginPct: 32,
  defaultMonthlyFixedCostsUZS: 32000000,
  defaultEquipmentCostUZS: 110000000,
  defaultPremisesSetupCostUZS: 40000000,
  defaultPackagingSetupCostUZS: 8000000,
  defaultInitialInventoryCostUZS: 45000000
};

const toyAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 500000000,
  defaultGrossMarginPct: 28,
  defaultMonthlyFixedCostsUZS: 45000000,
  defaultEquipmentCostUZS: 350000000,
  defaultPremisesSetupCostUZS: 80000000,
  defaultPackagingSetupCostUZS: 30000000,
  defaultCertificationCostUZS: 25000000,
  defaultMoldCostUZS: 120000000,
  defaultInitialInventoryCostUZS: 70000000
};


const furnitureAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 260000000,
  defaultGrossMarginPct: 34,
  defaultMonthlyFixedCostsUZS: 42000000,
  defaultVariableCostPct: 55,
  defaultEquipmentCostUZS: 180000000,
  defaultPremisesSetupCostUZS: 60000000,
  defaultPackagingSetupCostUZS: 15000000,
  defaultInitialInventoryCostUZS: 70000000
};

const beautyAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 90000000,
  defaultGrossMarginPct: 50,
  defaultMonthlyFixedCostsUZS: 30000000,
  defaultVariableCostPct: 30,
  defaultEquipmentCostUZS: 65000000,
  defaultPremisesSetupCostUZS: 35000000,
  defaultPackagingSetupCostUZS: 10000000,
  defaultInitialInventoryCostUZS: 12000000
};

const poultryAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 320000000,
  defaultGrossMarginPct: 27,
  defaultMonthlyFixedCostsUZS: 55000000,
  defaultVariableCostPct: 68,
  defaultEquipmentCostUZS: 220000000,
  defaultPremisesSetupCostUZS: 90000000,
  defaultPackagingSetupCostUZS: 12000000,
  defaultCertificationCostUZS: 18000000,
  defaultInitialInventoryCostUZS: 95000000
};

const ecommerceAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 80000000,
  defaultGrossMarginPct: 24,
  defaultMonthlyFixedCostsUZS: 22000000,
  defaultVariableCostPct: 62,
  defaultEquipmentCostUZS: 25000000,
  defaultPremisesSetupCostUZS: 10000000,
  defaultPackagingSetupCostUZS: 18000000,
  defaultInitialInventoryCostUZS: 50000000
};

const importExportAssumptions: SectorAssumptions = {
  ...genericAssumptions,
  minViableInvestmentUZS: 300000000,
  defaultGrossMarginPct: 22,
  defaultMonthlyFixedCostsUZS: 35000000,
  defaultVariableCostPct: 72,
  defaultEquipmentCostUZS: 30000000,
  defaultPremisesSetupCostUZS: 25000000,
  defaultPackagingSetupCostUZS: 20000000,
  defaultInitialInventoryCostUZS: 180000000
};

const requiredInputs = [
  "businessType",
  "businessIdea",
  "region",
  "productOrService",
  "premisesStatus",
  "equipmentCondition",
  "monthlyCapacity",
  "averagePrice",
  "targetCustomers",
  "rawMaterialSource",
  "staffPlan",
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
  "requestedLeasingAmount",
  "requestedLeasingCurrency",
  "leasingItem",
  "leasingTermMonths",
  "leasingAnnualRatePct",
  "certificationAwareness",
  "experienceLevel"
];

function slugBusinessType(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "generic_business";
}

function textQuestion(key: string, label: string, question: string, optional = false) {
  return { key, label, question, type: "text" as const, optional };
}

function textareaQuestion(key: string, label: string, question: string, placeholder?: string, optional = false) {
  return { key, label, question, type: "textarea" as const, placeholder, optional };
}

function numberQuestion(key: string, label: string, question: string, unit?: string, optional = false) {
  return { key, label, question, type: "number" as const, unit, optional };
}

function booleanQuestion(key: string, label: string, question: string, optional = false) {
  return { key, label, question, type: "boolean" as const, optional };
}

function selectQuestion(key: string, label: string, question: string, options: string[], optional = false) {
  return { key, label, question, type: "select" as const, options, optional };
}

function multiQuestion(key: string, label: string, question: string, options: string[], optional = false) {
  return { key, label, question, type: "multiselect" as const, options, optional };
}

function showIf<T extends InterviewQuestion>(question: T, condition: Record<string, unknown>): T {
  return { ...question, showIf: condition };
}

function staffPlanQuestion() {
  return {
    key: "staffPlan",
    label: "Фонд оплаты труда",
    question: "Какие роли сотрудников нужны на старте и какая плановая ежемесячная зарплата по каждой роли?",
    type: "staffPlan" as const
  };
}

function buildGenericBlocks(input: {
  businessType: string;
  productLabel: string;
  volumeLabel: string;
  unit: string;
  averagePriceLabel: string;
  customerOptions: string[];
  complianceQuestion: string;
  businessPlaceholder: string;
  equipmentQuestion: string;
  supplyQuestion: string;
}): InterviewBlock[] {
  return [
    {
      id: "business_idea",
      name: "Бизнес-идея",
      description: "Фиксируем суть бизнеса, регион и продукт или услугу.",
      questions: [
        textQuestion("businessType", "Тип бизнеса", "Какой тип бизнеса или предприятия вы планируете?"),
        textareaQuestion("businessIdea", "Описание идеи", "Кратко опишите бизнес-идею.", input.businessPlaceholder),
        textQuestion("region", "Регион", "В каком регионе Узбекистана планируется запуск?"),
        textQuestion("district", "Район/город", "В каком районе или городе будет работать бизнес?", true),
        textQuestion("plannedStartPeriod", "Планируемый старт", "Когда планируете запустить бизнес?", true),
        textQuestion("productOrService", input.productLabel, `Что именно будет продавать или производить ${input.businessType}?`),
        textareaQuestion("sectionNotes.businessIdea", "Детали бизнес-идеи", "Опишите клиентов, ценность продукта и отличие от конкурентов.", input.businessPlaceholder, true)
      ]
    },
    {
      id: "premises",
      name: "Помещение и локация",
      description: "Проверяем помещение, инфраструктуру и ограничения.",
      questions: [
        selectQuestion("premisesStatus", "Помещение", "Какой статус помещения?", ["owned", "rent", "searching", "land_required", "other"]),
        numberQuestion("monthlyRent", "Аренда в месяц", "Если помещение арендуется, какая ежемесячная аренда?", "UZS", true),
        booleanQuestion("infrastructureReady", "Инфраструктура", "Есть ли доступ к нужной инфраструктуре: электричество, вода, склад, интернет или вентиляция?", true),
        numberQuestion("premisesAreaSqm", "Площадь", "Какая ориентировочная площадь помещения?", "м2", true),
        textareaQuestion("sectionNotes.premisesInfrastructure", "Описание помещения", "Опишите помещение, локацию и инфраструктуру.", "Площадь, аренда или собственность, проходимость, коммунальные условия, склад, транспорт.", true)
      ]
    },
    {
      id: "equipment",
      name: "Оборудование и запуск",
      description: "Оцениваем оборудование, поставщиков и сроки запуска.",
      questions: [
        selectQuestion("equipmentCondition", "Оборудование", input.equipmentQuestion, ["new", "used", "not_selected", "mixed", "other"]),
        booleanQuestion("supplierSelected", "Поставщик", "Выбран ли поставщик оборудования или ключевых услуг?"),
        booleanQuestion("supplierOfferAvailable", "Коммерческое предложение", "Есть ли коммерческое предложение или смета?", true),
        numberQuestion("equipmentDeliveryMonths", "Срок поставки", "Сколько месяцев займет поставка и запуск?", "мес.", true),
        numberQuestion("equipmentCapex", "Оборудование CapEx", "Сколько стоит оборудование и ключевой инвентарь?", "UZS", true),
        numberQuestion("premisesSetupCapex", "Ремонт/подготовка", "Сколько потребуется на ремонт, подготовку помещения или монтаж?", "UZS", true),
        numberQuestion("itPosWebsiteCapex", "IT/POS/сайт", "Сколько потребуется на кассу, POS, сайт, CRM или маркетплейс-интеграции?", "UZS", true),
        textareaQuestion("sectionNotes.equipment", "Описание оборудования", "Опишите оборудование, смету, поставщика и сроки запуска.", "Что нужно купить, сколько стоит, есть ли сервис, обучение и запасные части.", true)
      ]
    },
    {
      id: "operations",
      name: "Операционная модель",
      description: "Собираем объем, персонал и качество.",
      questions: [
        numberQuestion("monthlyCapacity", input.volumeLabel, "Какой плановый месячный объем продаж, заказов или выпуска?", input.unit),
        numberQuestion("utilizationRatePct", "Загрузка", "Какая реалистичная загрузка/утилизация в процентах от планового объема?", "%", true),
        staffPlanQuestion(),
        booleanQuestion("qualityControlPlan", "Контроль качества", "Есть ли план контроля качества продукта или услуги?", true),
        textareaQuestion("sectionNotes.productionCapacity", "Описание процесса", "Опишите операционный процесс и план загрузки.", "Режим работы, поток клиентов или заказов, команда, качество, узкие места.", true)
      ]
    },
    {
      id: "suppliers",
      name: "Поставщики и закупки",
      description: "Проверяем поставки, валюту и запас на запуск.",
      questions: [
        selectQuestion("rawMaterialSource", "Поставки", input.supplyQuestion, ["local", "import", "mixed", "other"]),
        booleanQuestion("suppliersAvailable", "Поставщики", "Есть ли уже 2-3 поставщика или альтернативы?", true),
        booleanQuestion("foreignCurrencyPurchases", "Валюта", "Будут ли закупки в иностранной валюте?", true),
        numberQuestion("firstMonthRawMaterialStockUZS", "Стартовый запас", "Какой запас закупок нужен на первый месяц?", "UZS", true),
        numberQuestion("rawMaterialCostPerUnit", "Сырье/товар на единицу", "Какая себестоимость сырья или товара на одну единицу продажи?", "UZS", true),
        numberQuestion("packagingCostPerUnit", "Упаковка на единицу", "Сколько стоит упаковка на одну единицу?", "UZS", true),
        numberQuestion("directLogisticsCostPerUnit", "Логистика на единицу", "Какая прямая логистика на одну единицу?", "UZS", true),
        numberQuestion("marketplaceCommissionPerUnit", "Комиссия на единицу", "Если есть маркетплейс/эквайринг, какая комиссия на единицу?", "UZS", true),
        numberQuestion("wasteAllowancePct", "Списания/потери", "Какой процент списаний, брака или потерь нужно заложить?", "%", true),
        textareaQuestion("sectionNotes.rawMaterials", "Описание закупок", "Опишите поставщиков, закупки и условия оплаты.", "Ключевые поставщики, сроки, валюта, предоплата, запас и альтернативы.", true)
      ]
    },
    {
      id: "sales",
      name: "Продажи",
      description: "Оцениваем клиентов, цену, каналы и спрос.",
      questions: [
        multiQuestion("targetCustomers", "Клиенты и каналы", "Кто основные клиенты и каналы продаж?", input.customerOptions),
        booleanQuestion("hasBuyerAgreements", "Договоренности", "Есть ли предварительные договоренности с клиентами?", true),
        selectQuestion("clientPaymentTerm", "Оплата", "Как быстро клиенты обычно будут платить?", ["immediate", "days_7", "days_15", "days_30", "days_60_plus", "other"], true),
        numberQuestion("averagePrice", input.averagePriceLabel, "Какая ожидаемая средняя цена за продажу, заказ или единицу?", "UZS"),
        numberQuestion("stableMonthlyRevenue", "Стабильная выручка", "Если уже считали, укажите плановую стабильную месячную выручку.", "UZS", true),
        selectQuestion("preferredRevenueSource", "Основной расчет выручки", "Что использовать как основную выручку, если есть расхождение?", ["calculated", "stable"], true),
        booleanQuestion("seasonalDemand", "Сезонность", "Есть ли заметная сезонность продаж?", true),
        textareaQuestion("sectionNotes.salesMarketing", "Описание продаж", "Опишите продажи, маркетинг и спрос.", "Клиенты, каналы, цены, конкуренты, договоренности, сезонность.", true)
      ]
    },
    {
      id: "finance",
      name: "Финансирование",
      description: "Собираем собственные средства, кредит, лизинг и залог.",
      questions: [
        numberQuestion("ownContributionAmount", "Собственные средства", "Сколько собственных средств готовы вложить?"),
        selectQuestion("ownContributionCurrency", "Валюта", "В какой валюте указаны собственные средства?", ["UZS", "USD"]),
        selectQuestion("creditNeeded", "Кредит", "Нужен ли кредит?", ["yes", "no", "unknown"]),
        showIf(numberQuestion("requestedLoanAmount", "Сумма кредита", "Какая сумма кредита нужна?", undefined, false), { creditNeeded: "yes" }),
        showIf(selectQuestion("requestedLoanCurrency", "Валюта кредита", "В какой валюте указан кредит?", ["UZS", "USD"], false), { creditNeeded: "yes" }),
        showIf(numberQuestion("loanTermMonths", "Срок кредита", "На какой срок нужен кредит?", "мес.", false), { creditNeeded: "yes" }),
        showIf(numberQuestion("loanAnnualRatePct", "Годовая ставка кредита", "Какая годовая процентная ставка по кредиту? Если банк еще не дал ставку, укажите ожидаемую.", "%", false), { creditNeeded: "yes" }),
        showIf(numberQuestion("loanGracePeriodMonths", "Льготный период", "Есть ли льготный период по кредиту и сколько месяцев?", "мес.", true), { creditNeeded: "yes" }),
        showIf(selectQuestion("loanRepaymentType", "Тип погашения", "Какой тип погашения использовать в расчете?", ["annuity", "equal_principal"], false), { creditNeeded: "yes" }),
        showIf(textareaQuestion("loanPurpose", "Цель кредита", "На что именно нужен кредит?", undefined, false), { creditNeeded: "yes" }),
        showIf(booleanQuestion("collateralAvailable", "Залог", "Есть ли потенциальный залог?", false), { creditNeeded: "yes" }),
        showIf(textQuestion("collateralType", "Тип залога", "Какой залог можно предложить? Укажите конкретный актив: автомобиль, оборудование, недвижимость, товарный запас.", false), { collateralAvailable: true }),
        showIf(numberQuestion("collateralYear", "Год залога", "Если залог - автомобиль или техника, укажите год выпуска.", undefined, true), { collateralAvailable: true }),
        showIf(selectQuestion("collateralCondition", "Состояние залога", "В каком состоянии залог?", ["new", "used", "other"], true), { collateralAvailable: true }),
        showIf(numberQuestion("collateralEstimatedValue", "Стоимость залога", "Ориентировочная рыночная стоимость залога, если известна.", "UZS", true), { collateralAvailable: true }),
        showIf(booleanQuestion("collateralDocumentsAvailable", "Документы по залогу", "Есть ли документы, подтверждающие право собственности и оценку залога?", true), { collateralAvailable: true }),
        booleanQuestion("needsLeasing", "Лизинг", "Нужен ли лизинг оборудования?"),
        showIf(numberQuestion("requestedLeasingAmount", "Сумма лизинга", "Какая сумма лизинга нужна?", undefined, false), { needsLeasing: true }),
        showIf(selectQuestion("requestedLeasingCurrency", "Валюта лизинга", "В какой валюте указан лизинг?", ["UZS", "USD"], false), { needsLeasing: true }),
        showIf(textQuestion("leasingItem", "Предмет лизинга", "Какое оборудование или актив планируется взять в лизинг?", false), { needsLeasing: true }),
        showIf(numberQuestion("leasingAdvancePayment", "Первоначальный взнос", "Какой первоначальный взнос по лизингу?", "UZS", true), { needsLeasing: true }),
        showIf(numberQuestion("leasingTermMonths", "Срок лизинга", "На какой срок нужен лизинг?", "мес.", false), { needsLeasing: true }),
        showIf(numberQuestion("leasingAnnualRatePct", "Ставка/удорожание лизинга", "Какая годовая ставка или удорожание по лизингу?", "%", false), { needsLeasing: true }),
        showIf(numberQuestion("leasingMonthlyPayment", "Ежемесячный платеж лизинга", "Если лизинговая компания уже дала график, укажите ежемесячный платеж.", "UZS", true), { needsLeasing: true }),
        showIf(textQuestion("leasingSupplier", "Поставщик оборудования", "Кто поставщик оборудования для лизинга?", true), { needsLeasing: true }),
        showIf(booleanQuestion("leasingOfferAvailable", "КП по лизингу", "Есть ли коммерческое предложение по лизингу?", true), { needsLeasing: true }),
        showIf(booleanQuestion("leasingDeliveryInstallationIncluded", "Доставка/монтаж включены", "Доставка и монтаж включены в условия лизинга?", true), { needsLeasing: true }),
        numberQuestion("workingCapitalBufferMonths", "Буфер оборотного капитала", "На сколько месяцев фиксированных расходов нужен оборотный капитал?", "мес.", true),
        numberQuestion("accountsReceivableBufferUZS", "Буфер дебиторки", "Какой буфер нужен из-за отсрочки платежей клиентов?", "UZS", true),
        numberQuestion("seasonalStockBufferUZS", "Сезонный запас", "Если продажи сезонные, какой дополнительный запас нужен?", "UZS", true),
        numberQuestion("grants", "Гранты/субсидии", "Есть ли подтвержденные гранты или субсидии? Введите 0, если их нет.", "UZS", true),
        numberQuestion("otherFunding", "Другое финансирование", "Есть ли другое подтвержденное финансирование? Введите 0, если его нет.", "UZS", true),
        booleanQuestion("contingencyReserveAvailable", "Резерв", "Есть ли резерв на непредвиденные расходы?", true),
        textareaQuestion("sectionNotes.finance", "Описание финансов", "Опишите структуру финансирования и основные расходы.", "Собственные средства, кредит, лизинг, залог, оборотный капитал, резерв.", true)
      ]
    },
    {
      id: "compliance",
      name: "Документы и опыт",
      description: "Проверяем разрешения, документы и компетенции команды.",
      questions: [
        selectQuestion("certificationAwareness", "Документы/разрешения", input.complianceQuestion, ["aware", "partly_aware", "not_aware", "other"]),
        booleanQuestion("hasAccountantOrConsultant", "Консультант", "Есть ли бухгалтер, юрист или профильный консультант?", true),
        selectQuestion("experienceLevel", "Опыт", "Какой опыт у команды в этом бизнесе?", ["low", "medium", "high", "other"]),
        textareaQuestion("sectionNotes.complianceExperience", "Описание документов и опыта", "Опишите опыт команды, документы и разрешения.", "Опыт, регистрация, разрешения, бухгалтерия, консультанты, требования отрасли.", true)
      ]
    }
  ];
}

function sectorPreset(businessType: string) {
  const normalized = businessType.trim().toLowerCase();
  if (/пекар|хлеб|булоч|самса|выпеч|bakery|bread|buloch|nonvoy/.test(normalized)) {
    return {
      code: "bakery_food_production",
      name: "Мини-пекарня",
      assumptions: bakeryAssumptions,
      productLabel: "Хлебобулочные изделия",
      volumeLabel: "Изделия/порции в месяц",
      unit: "шт./мес.",
      averagePriceLabel: "Средняя цена изделия/заказа",
      customerOptions: ["walk_in", "office_workers", "b2b_orders", "retail", "delivery", "marketplaces", "other"],
      complianceQuestion: "Понимаете ли санитарные требования, сертификаты, кассу и правила пищевого производства?",
      businessPlaceholder: "Например: мини-пекарня с хлебом, самсой и выпечкой для точки продаж и B2B-заказов.",
      equipmentQuestion: "Какие печи, тестомесы, расстойка, витрины, вентиляция и холодильное оборудование нужны?",
      supplyQuestion: "Где планируете закупать муку, дрожжи, масло, сахар, яйца, упаковку и энергию?",
      mainEquipment: ["Печь", "Тестомес", "Расстойка", "Витрина", "Вентиляция", "Касса/POS"],
      mainRawMaterials: ["Мука", "Дрожжи", "Масло", "Сахар", "Яйца", "Упаковка"],
      mainRisks: ["food_compliance", "supplier_risk", "quality_risk", "working_capital_risk", "location_demand", "bankability_risk"]
    };
  }
  if (/морожен|ice\s*cream|ice-cream|dessert kiosk|food kiosk|muzqaymoq/.test(normalized)) {
    return {
      code: "ice_cream_kiosk",
      name: "Киоск мороженого",
      assumptions: iceCreamKioskAssumptions,
      productLabel: "Продукты киоска",
      volumeLabel: "Порции/продажи в месяц",
      unit: "порций/мес.",
      averagePriceLabel: "Средний чек",
      customerOptions: ["walk_in", "students", "families", "parks", "delivery", "events", "other"],
      complianceQuestion: "Понимаете ли санитарные требования, холодовую цепь, кассу и документы по общепиту?",
      businessPlaceholder: "Например: сезонный киоск мороженого в парке или рядом с оживленной улицей.",
      equipmentQuestion: "Какие морозильники, витрины, генератор/электричество, POS и навес нужны?",
      supplyQuestion: "Где планируете закупать мороженое, топпинги, стаканчики, упаковку и расходники?",
      mainEquipment: ["Морозильники", "Витрина", "POS", "Навес", "Холодовая цепь"],
      mainRawMaterials: ["Мороженое", "Топпинги", "Стаканчики", "Упаковка", "Энергия"],
      mainRisks: ["seasonality_risk", "location_demand", "supplier_risk", "working_capital_risk", "food_compliance", "bankability_risk"]
    };
  }
  if (/кофе|coffee|кафе|cafe|qahva|kafe/.test(normalized)) {
    return {
      code: "coffee_shop",
      name: "Кофейня",
      assumptions: cafeAssumptions,
      productLabel: "Формат и меню",
      volumeLabel: "Заказы в месяц",
      unit: "заказов/мес.",
      averagePriceLabel: "Средний чек",
      customerOptions: ["walk_in", "students", "office_workers", "delivery", "events", "marketplaces", "other"],
      complianceQuestion: "Понимаете ли требования к общепиту, санитарии и кассовой дисциплине?",
      businessPlaceholder: "Например: небольшая кофейня возле университета с напитками навынос и десертами.",
      equipmentQuestion: "Какое оборудование для кухни, кофе и кассы планируете использовать?",
      supplyQuestion: "Где планируете закупать кофе, продукты, упаковку и расходники?",
      mainEquipment: ["Кофемашина", "Холодильное оборудование", "Касса/POS", "Мебель", "Вытяжка", "Витрина"],
      mainRawMaterials: ["Кофе", "Молоко", "Десерты", "Упаковка", "Расходные материалы"],
      mainRisks: ["location_demand", "supplier_risk", "working_capital_risk", "food_compliance", "sales_channel_concentration", "bankability_risk"]
    };
  }
  if (/швей|sew|garment|одеж|tikuv|kiyim/.test(normalized)) {
    return {
      code: "sewing_workshop",
      name: "Швейный цех",
      assumptions: sewingAssumptions,
      productLabel: "Тип изделий",
      volumeLabel: "Изделия в месяц",
      unit: "изделий/мес.",
      averagePriceLabel: "Средняя цена изделия",
      customerOptions: ["b2b_orders", "retail", "marketplaces", "export", "uniforms", "wholesale", "other"],
      complianceQuestion: "Понимаете ли требования к маркировке, договорам и документам на продукцию?",
      businessPlaceholder: "Например: цех по пошиву школьной формы и корпоративной одежды.",
      equipmentQuestion: "Какое швейное, раскройное и вспомогательное оборудование планируется?",
      supplyQuestion: "Где планируете закупать ткани, фурнитуру и упаковку?",
      mainEquipment: ["Швейные машины", "Оверлоки", "Раскройное оборудование", "Утюжильный стол", "Складские стеллажи"],
      mainRawMaterials: ["Ткани", "Фурнитура", "Нитки", "Упаковка", "Этикетки"],
      mainRisks: ["supplier_risk", "equipment_risk", "sales_channel_concentration", "working_capital_risk", "quality_risk", "bankability_risk"]
    };
  }
  if (/игруш|toy|oyinchoq|o'yinchoq/.test(normalized)) {
    return {
      code: "toy_manufacturing",
      name: "Производство игрушек",
      assumptions: toyAssumptions,
      productLabel: "Тип игрушек",
      volumeLabel: "Единицы продукции в месяц",
      unit: "шт./мес.",
      averagePriceLabel: "Средняя цена единицы",
      customerOptions: ["wholesale", "bazaars", "supermarkets", "marketplaces", "schools", "export", "direct_b2b", "other"],
      complianceQuestion: "Понимаете ли требования к безопасности, сертификации и маркировке игрушек?",
      businessPlaceholder: "Например: производство развивающих игрушек для детей 3-6 лет.",
      equipmentQuestion: "Какое производственное оборудование и формы планируете использовать?",
      supplyQuestion: "Где планируете покупать материалы, упаковку и комплектующие?",
      mainEquipment: ["Производственное оборудование", "Формы/оснастка", "Упаковочное оборудование", "Контроль качества", "Склад"],
      mainRawMaterials: ["Материалы для игрушек", "Красители", "Комплектующие", "Упаковка"],
      mainRisks: ["product_safety", "certification_risk", "equipment_risk", "supplier_risk", "working_capital_risk", "sales_channel_concentration"]
    };
  }

  if (/мебел|furniture|mebel|duradgor/.test(normalized)) {
    return {
      code: "furniture_manufacturing",
      name: "Мебельное производство",
      assumptions: furnitureAssumptions,
      productLabel: "Тип мебели",
      volumeLabel: "Изделия в месяц",
      unit: "шт./мес.",
      averagePriceLabel: "Средняя цена изделия",
      customerOptions: ["b2c", "b2b_orders", "design_studios", "marketplaces", "retail", "wholesale", "other"],
      complianceQuestion: "Понимаете ли требования к договорам, качеству, пожарной безопасности и документам на материалы?",
      businessPlaceholder: "Например: мебельный цех в Самарканде для кухонь и шкафов на заказ.",
      equipmentQuestion: "Какие станки, инструмент, вытяжка, склад и монтажный транспорт нужны?",
      supplyQuestion: "Где планируете закупать ЛДСП/МДФ, фурнитуру, кромку и упаковку?",
      mainEquipment: ["Станки", "Инструмент", "Вытяжка", "Склад", "Монтажный транспорт"],
      mainRawMaterials: ["ЛДСП/МДФ", "Фурнитура", "Кромка", "Клей", "Упаковка"],
      mainRisks: ["supplier_risk", "quality_risk", "equipment_risk", "working_capital_risk", "sales_channel_concentration", "bankability_risk"]
    };
  }
  if (/салон|красот|beauty|hair|barber|go'zallik/.test(normalized)) {
    return {
      code: "beauty_salon",
      name: "Салон красоты",
      assumptions: beautyAssumptions,
      productLabel: "Услуги салона",
      volumeLabel: "Клиенты/услуги в месяц",
      unit: "услуг/мес.",
      averagePriceLabel: "Средний чек услуги",
      customerOptions: ["walk_in", "instagram", "repeat_clients", "office_workers", "women", "men", "other"],
      complianceQuestion: "Понимаете ли санитарные требования, договор помещения и правила работы с персоналом?",
      businessPlaceholder: "Например: салон красоты в Ташкенте с парикмахерскими услугами, маникюром и косметологией.",
      equipmentQuestion: "Какая мебель, кресла, стерилизация, инструменты и касса нужны?",
      supplyQuestion: "Где планируете закупать косметику, расходники и стерилизационные материалы?",
      mainEquipment: ["Кресла", "Мебель", "Инструменты", "Стерилизация", "Касса/POS"],
      mainRawMaterials: ["Косметика", "Расходники", "Полотенца", "Дезсредства", "Упаковка"],
      mainRisks: ["location_demand", "staff_risk", "compliance_risk", "working_capital_risk", "sales_channel_concentration", "bankability_risk"]
    };
  }
  if (/птиц|куриц|poultry|parrand|ферм|farm/.test(normalized)) {
    return {
      code: "poultry_farm",
      name: "Птицеферма",
      assumptions: poultryAssumptions,
      productLabel: "Продукция фермы",
      volumeLabel: "Птица/яйца в месяц",
      unit: "ед./мес.",
      averagePriceLabel: "Средняя цена реализации",
      customerOptions: ["wholesale", "markets", "retail", "restaurants", "distributors", "export", "other"],
      complianceQuestion: "Понимаете ли ветеринарные, санитарные и земельные требования?",
      businessPlaceholder: "Например: птицеферма в Фергане по выращиванию бройлеров.",
      equipmentQuestion: "Какие клетки, кормушки, вентиляция, обогрев и холодильное хранение нужны?",
      supplyQuestion: "Где планируете закупать птицу, корма, ветеринарные препараты и упаковку?",
      mainEquipment: ["Клетки", "Кормушки", "Вентиляция", "Обогрев", "Холодильное хранение"],
      mainRawMaterials: ["Птица", "Корм", "Ветпрепараты", "Упаковка", "Энергия"],
      mainRisks: ["biosecurity_risk", "supplier_risk", "commodity_price_risk", "working_capital_risk", "compliance_risk", "bankability_risk"]
    };
  }
  if (/онлайн|ecommerce|e-commerce|marketplace|магазин|internet|интернет/.test(normalized)) {
    return {
      code: "ecommerce_store",
      name: "Онлайн-магазин",
      assumptions: ecommerceAssumptions,
      productLabel: "Товарная категория",
      volumeLabel: "Заказы в месяц",
      unit: "заказов/мес.",
      averagePriceLabel: "Средний чек",
      customerOptions: ["instagram", "telegram", "marketplaces", "website", "repeat_clients", "delivery", "other"],
      complianceQuestion: "Понимаете ли требования к онлайн-продажам, возвратам, фискализации и персональным данным?",
      businessPlaceholder: "Например: онлайн-магазин одежды с продажами через Instagram, Telegram и маркетплейсы.",
      equipmentQuestion: "Нужны ли склад, сайт, CRM, касса, фотооборудование и интеграции доставки?",
      supplyQuestion: "Где планируете закупать товар, упаковку и доставку?",
      mainEquipment: ["Сайт/CRM", "Касса", "Склад", "Фотооборудование", "Интеграции доставки"],
      mainRawMaterials: ["Товар", "Упаковка", "Доставка", "Комиссии", "Реклама"],
      mainRisks: ["market_demand", "marketing_efficiency", "inventory_risk", "working_capital_risk", "payment_risk", "bankability_risk"]
    };
  }
  if (/импорт|экспорт|import|export|trade|china|китай/.test(normalized)) {
    return {
      code: "import_export",
      name: "Импорт/экспорт",
      assumptions: importExportAssumptions,
      productLabel: "Товар для импорта/экспорта",
      volumeLabel: "Партии/единицы в месяц",
      unit: "ед./мес.",
      averagePriceLabel: "Средняя цена реализации",
      customerOptions: ["wholesale", "b2b_orders", "retail", "marketplaces", "distributors", "export", "other"],
      complianceQuestion: "Понимаете ли таможенные документы, HS-код, сертификаты, валютные и логистические риски?",
      businessPlaceholder: "Например: импорт оборудования из Китая с продажей предпринимателям в Узбекистане.",
      equipmentQuestion: "Нужны ли склад, логистика, таможенный брокер, тестирование или сервисный центр?",
      supplyQuestion: "Какая страна поставки, валюта, Инкотермс, таможня и страховой буфер?",
      mainEquipment: ["Склад", "Логистика", "Сервис", "IT/учет", "Таможенный брокер"],
      mainRawMaterials: ["Импортный товар", "Пошлины", "Логистика", "Страхование", "Сертификация"],
      mainRisks: ["fx_risk", "customs_risk", "supplier_risk", "working_capital_risk", "sales_channel_concentration", "bankability_risk"]
    };
  }

  return {
    code: `generic_${slugBusinessType(businessType)}`,
    name: businessType || "Универсальный бизнес",
    assumptions: genericAssumptions,
    productLabel: "Продукт или услуга",
    volumeLabel: "Продажи в месяц",
    unit: "ед./мес.",
    averagePriceLabel: "Средняя цена",
    customerOptions: ["retail", "wholesale", "b2b_orders", "marketplaces", "delivery", "export", "other"],
    complianceQuestion: "Понимаете ли документы, разрешения и требования для запуска?",
    businessPlaceholder: "Опишите, что будет продаваться, кто клиент, где бизнес будет работать и чем идея отличается.",
    equipmentQuestion: "Какое оборудование, инвентарь или цифровые инструменты нужны для запуска?",
    supplyQuestion: "Где планируете закупать товары, материалы или услуги поставщиков?",
    mainEquipment: ["Оборудование", "Инвентарь", "IT/касса", "Склад", "Транспорт/доставка"],
    mainRawMaterials: ["Товары или материалы", "Упаковка", "Расходники", "Услуги поставщиков"],
    mainRisks: ["market_demand", "supplier_risk", "working_capital_risk", "equipment_risk", "location_risk", "bankability_risk"]
  };
}

export function buildGenericBusinessTemplate(businessType = "Универсальный бизнес"): DynamicBusinessTemplate {
  const preset = sectorPreset(businessType);
  return {
    code: preset.code,
    name: preset.name,
    description: `Динамический шаблон FINKO для бизнеса: ${businessType || preset.name}.`,
    businessType: businessType || preset.name,
    requiredInputs,
    assumptions: preset.assumptions,
    mainEquipment: preset.mainEquipment,
    mainRawMaterials: preset.mainRawMaterials,
    mainRisks: preset.mainRisks,
    interviewBlocks: buildGenericBlocks({
      businessType: businessType || preset.name,
      productLabel: preset.productLabel,
      volumeLabel: preset.volumeLabel,
      unit: preset.unit,
      averagePriceLabel: preset.averagePriceLabel,
      customerOptions: preset.customerOptions,
      complianceQuestion: preset.complianceQuestion,
      businessPlaceholder: preset.businessPlaceholder,
      equipmentQuestion: preset.equipmentQuestion,
      supplyQuestion: preset.supplyQuestion
    }),
    riskRules: {
      marketDemand: "Высокий риск при неподтвержденном спросе или узком наборе клиентов.",
      suppliers: "Высокий риск при одном поставщике, валютной зависимости или отсутствии альтернатив.",
      workingCapital: "Высокий риск при отсрочках оплаты и малом резерве оборотного капитала.",
      equipment: "Высокий риск при неподтвержденной смете, сервисе или сроках запуска.",
      compliance: "Высокий риск при непонимании документов, разрешений и отраслевых требований.",
      bankability: "Высокий риск при слабой финансовой модели, отсутствии залога или неподтвержденных продажах."
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

export const genericBusinessTemplate = buildGenericBusinessTemplate();
