import type { SectorTemplate } from "../../types/sector";

export const sectionNotePlaceholders = {
  businessIdea: "Опишите подробнее, какие игрушки вы хотите производить, для кого они предназначены, чем они будут отличаться от импортных или местных аналогов.",
  premisesInfrastructure: "Опишите помещение: площадь, аренда или собственность, электричество, вентиляция, склад, доступ к транспорту, есть ли ограничения по производству.",
  equipment: "Опишите оборудование: новое или б/у, есть ли поставщик, страна производства, цена, срок поставки, нужен ли сервис или запасные части.",
  productionCapacity: "Опишите производственный процесс: сколько смен, сколько сотрудников, какая мощность, сколько видов продукции на старте, есть ли план по браку и контролю качества.",
  rawMaterials: "Опишите сырье: PP, PE, ABS или другое, локальное или импортное, поставщики, условия оплаты, валютные риски, запас сырья на складе.",
  salesMarketing: "Опишите каналы продаж: оптовики, базары, магазины, маркетплейсы, детские сады, экспорт, есть ли предварительные договоренности или письма намерений.",
  finance: "Опишите финансовую часть: собственные средства, нужен ли кредит или лизинг, на что именно нужны деньги, есть ли резерв на оборотный капитал.",
  complianceExperience: "Опишите опыт команды, понимание требований к детским товарам, наличие бухгалтера, консультанта, сертификатов или плана по их получению."
} as const;

export const plasticToyProductionTemplate: SectorTemplate = {
  code: "plastic_toy_production",
  name: "Производство пластиковых игрушек",
  description:
    "Малое производственное предприятие по выпуску пластиковых игрушек с использованием литья под давлением, сборки или комбинированной модели.",
  requiredInputs: [
    "region",
    "district",
    "toyType",
    "productionType",
    "priceSegment",
    "premisesStatus",
    "equipmentCondition",
    "monthlyCapacity",
    "averagePrice",
    "rawMaterialSource",
    "targetCustomers",
    "creditNeeded",
    "requestedLoanAmount",
    "requestedLoanCurrency",
    "loanTermMonths",
    "loanAnnualRatePct",
    "loanRepaymentType",
    "needsLeasing",
    "requestedLeasingAmount",
    "requestedLeasingCurrency",
    "leasingItem",
    "leasingTermMonths",
    "leasingAnnualRatePct",
    "ownContributionAmount",
    "ownContributionCurrency",
    "certificationAwareness",
    "experienceLevel",
  ],
  assumptions: {
    minViableInvestmentUZS: 500000000,
    recommendedOwnContributionMinPct: 25,
    recommendedOwnContributionMaxPct: 35,
    typicalGrossMarginMinPct: 20,
    typicalGrossMarginMaxPct: 35,
    defaultGrossMarginPct: 28,
    defaultMonthlyFixedCostsUZS: 45000000,
    defaultVariableCostPct: 62,
    defaultLoanAnnualRatePct: 26,
    defaultLeasingAnnualRatePct: 24,
    defaultLoanTermMonths: 36,
    defaultLeasingTermMonths: 48,
    defaultWorkingCapitalMonths: 3,
    defaultCertificationCostUZS: 25000000,
    defaultMoldCostUZS: 120000000,
    defaultEquipmentCostUZS: 350000000,
    defaultPremisesSetupCostUZS: 80000000,
    defaultPackagingSetupCostUZS: 30000000,
    defaultInitialInventoryCostUZS: 70000000,
    defaultExpectedUtilizationPct: 65
  },
  mainEquipment: [
    "Термопластавтомат",
    "Пресс-формы",
    "Компрессор",
    "Охлаждающая система",
    "Упаковочное оборудование",
    "Складское оборудование",
    "Оборудование для контроля качества"
  ],
  mainRawMaterials: ["PP", "PE", "ABS", "PVC", "Красители", "Упаковочные материалы"],
  mainRisks: [
    "certification_risk",
    "fx_risk",
    "working_capital_risk",
    "equipment_risk",
    "infrastructure_risk",
    "sales_channel_concentration",
    "bankability_risk",
    "collateral_risk"
  ],
  interviewBlocks: [
    {
      id: "business_idea",
      name: "Бизнес-идея",
      description: "Фиксируем регион, продукт и модель производства.",
      questions: [
        { key: "region", label: "Регион", question: "В каком регионе вы планируете открыть производство?", type: "select", options: ["Андижан", "Ташкентская область", "Самарканд", "other"] },
        { key: "district", label: "Район или город", question: "В каком районе или городе будет производство?", type: "text" },
        { key: "toyType", label: "Вид игрушек", question: "Какие именно игрушки вы хотите производить?", type: "select", options: ["educational_and_mass_market", "toddlers", "outdoor", "branded", "other"] },
        { key: "productionType", label: "Модель производства", question: "Какая модель производства планируется?", type: "select", options: ["full_cycle", "assembly", "contract", "combined", "other"] },
        { key: "priceSegment", label: "Ценовой сегмент", question: "Какой ценовой сегмент продукта?", type: "select", options: ["budget", "middle", "premium", "other"] },
        { key: "productExamples", label: "Примеры/аналоги", question: "Есть ли у вас примеры или аналоги игрушек, которые хотите производить?", type: "textarea", optional: true },
        { key: "sectionNotes.businessIdea", label: "Подробное описание", question: "Опишите бизнес-идею подробнее", type: "textarea", placeholder: sectionNotePlaceholders.businessIdea, optional: true }
      ]
    },
    {
      id: "product",
      name: "Продукт",
      description: "Уточняем ассортимент, дизайн, упаковку и возрастную группу.",
      questions: [
        { key: "skuCount", label: "SKU", question: "Сколько видов продукции/SKU планируете на старте?", type: "number" },
        { key: "designModel", label: "Дизайн", question: "Нужен ли собственный дизайн или будете использовать готовые формы?", type: "select", options: ["own_design", "ready_molds", "mixed_design", "other"] },
        { key: "brandedPackaging", label: "Упаковка", question: "Требуется ли упаковка с брендом?", type: "boolean" },
        { key: "ageGroup", label: "Возрастная группа", question: "Для какой возрастной группы предназначены игрушки?", type: "select", options: ["age_0_3", "age_3_6", "age_6_12", "age_12_plus", "other"] }
      ]
    },
    {
      id: "premises",
      name: "Помещение и инфраструктура",
      description: "Проверяем площадку, инфраструктуру и ограничения.",
      questions: [
        { key: "premisesStatus", label: "Помещение", question: "Есть ли у вас помещение?", type: "select", options: ["owned", "rent", "searching", "land_required", "other"] },
        { key: "infrastructureReady", label: "Инфраструктура", question: "Есть ли доступ к электричеству, вентиляции и базовой инфраструктуре?", type: "boolean" },
        { key: "premisesAreaSqm", label: "Площадь", question: "Какая ориентировочная площадь помещения?", type: "number", unit: "м²", optional: true },
        { key: "sectionNotes.premisesInfrastructure", label: "Подробное описание", question: "Опишите помещение и инфраструктуру", type: "textarea", placeholder: sectionNotePlaceholders.premisesInfrastructure, optional: true }
      ]
    },
    {
      id: "equipment",
      name: "Оборудование",
      description: "Оцениваем оборудование, поставщика и сервис.",
      questions: [
        { key: "equipmentCondition", label: "Оборудование", question: "Какое оборудование планируете использовать?", type: "select", options: ["new", "used", "not_selected", "other"] },
        { key: "supplierSelected", label: "Поставщик", question: "Есть ли выбранный поставщик оборудования?", type: "boolean" },
        { key: "supplierOfferAvailable", label: "Коммерческое предложение", question: "Есть ли коммерческое предложение от поставщика оборудования?", type: "boolean", optional: true },
        { key: "equipmentDeliveryMonths", label: "Срок запуска", question: "Сколько месяцев займет поставка и запуск оборудования?", type: "number", unit: "мес.", optional: true },
        { key: "serviceSupportUzbekistan", label: "Сервис", question: "Есть ли сервисная поддержка в Узбекистане?", type: "boolean", optional: true },
        { key: "staffTrainingNeeded", label: "Обучение", question: "Нужно ли обучение персонала?", type: "boolean", optional: true },
        { key: "sectionNotes.equipment", label: "Подробное описание", question: "Опишите оборудование подробнее", type: "textarea", placeholder: sectionNotePlaceholders.equipment, optional: true }
      ]
    },
    {
      id: "capacity",
      name: "Производство и мощность",
      description: "Уточняем процесс, мощность, персонал и контроль качества.",
      questions: [
        { key: "monthlyCapacity", label: "Мощность", question: "Какая плановая месячная производственная мощность?", type: "number", unit: "шт./мес." },
        { key: "shiftsPerDay", label: "Смены", question: "Сколько смен в день планируется?", type: "number", optional: true },
        { key: "employeesCount", label: "Сотрудники", question: "Сколько сотрудников нужно на старте?", type: "number", optional: true },
        { key: "defectRatePct", label: "Брак", question: "Какой ожидаемый процент брака?", type: "number", unit: "%", optional: true },
        { key: "qualityControlPlan", label: "Контроль качества", question: "Есть ли план контроля качества?", type: "boolean", optional: true },
        { key: "sectionNotes.productionCapacity", label: "Подробное описание", question: "Опишите производственный процесс", type: "textarea", placeholder: sectionNotePlaceholders.productionCapacity, optional: true }
      ]
    },
    {
      id: "raw_materials",
      name: "Сырье",
      description: "Проверяем поставщиков, валюту и запас сырья.",
      questions: [
        { key: "rawMaterialSource", label: "Источник сырья", question: "Где планируете покупать сырье?", type: "select", options: ["local", "import", "mixed", "other"] },
        { key: "suppliersAvailable", label: "Поставщики", question: "Есть ли уже поставщики сырья?", type: "boolean" },
        { key: "foreignCurrencyPurchases", label: "Валюта", question: "Будут ли закупки в иностранной валюте?", type: "boolean", optional: true },
        { key: "alternativeSuppliers", label: "Альтернативы", question: "Есть ли альтернативные поставщики?", type: "boolean", optional: true },
        { key: "firstMonthRawMaterialStockUZS", label: "Запас сырья", question: "Какой запас сырья нужен на первый месяц?", type: "number", unit: "UZS", optional: true },
        { key: "sectionNotes.rawMaterials", label: "Подробное описание", question: "Опишите сырье и поставки", type: "textarea", placeholder: sectionNotePlaceholders.rawMaterials, optional: true }
      ]
    },
    {
      id: "sales",
      name: "Продажи",
      description: "Оцениваем каналы продаж, цену, оплату и спрос.",
      questions: [
        { key: "targetCustomers", label: "Каналы продаж", question: "Кто основные покупатели?", type: "multiselect", options: ["wholesale", "bazaars", "supermarkets", "marketplaces", "schools", "export", "direct_b2b", "other"] },
        { key: "hasBuyerAgreements", label: "Договоренности", question: "Есть ли предварительные договоренности с покупателями?", type: "boolean" },
        { key: "clientPaymentTerm", label: "Срок оплаты", question: "Какой средний срок оплаты от клиентов?", type: "select", options: ["immediate", "days_7", "days_15", "days_30", "days_60_plus", "other"] },
        { key: "seasonalDemand", label: "Сезонность", question: "Есть ли сезонность спроса?", type: "boolean", optional: true },
        { key: "averagePrice", label: "Средняя цена", question: "Какая ожидаемая средняя цена реализации одной игрушки?", type: "number", unit: "UZS" },
        { key: "firstThreeMonthsMonthlyRevenue", label: "Выручка на старте", question: "Планируемая месячная выручка в первые 3 месяца", type: "number", unit: "UZS", optional: true },
        { key: "stableMonthlyRevenue", label: "Стабильная выручка", question: "Планируемая месячная выручка после выхода на стабильную работу", type: "number", unit: "UZS", optional: true },
        { key: "sectionNotes.salesMarketing", label: "Подробное описание", question: "Опишите продажи и маркетинг", type: "textarea", placeholder: sectionNotePlaceholders.salesMarketing, optional: true }
      ]
    },
    {
      id: "finance",
      name: "Финансирование",
      description: "Собираем собственные средства, кредит, лизинг и залог только при необходимости.",
      questions: [
        { key: "ownContributionAmount", label: "Собственные средства", question: "Сколько собственных средств готовы вложить?", type: "number" },
        { key: "ownContributionCurrency", label: "Валюта", question: "В какой валюте указаны собственные средства?", type: "select", options: ["UZS", "USD"] },
        { key: "creditNeeded", label: "Кредит", question: "Нужен ли вам кредит?", type: "select", options: ["yes", "no", "unknown"] },
        { key: "requestedLoanAmount", label: "Сумма кредита", question: "Какая сумма кредита нужна?", type: "number", showIf: { creditNeeded: "yes" } },
        { key: "requestedLoanCurrency", label: "Валюта кредита", question: "В какой валюте указан кредит?", type: "select", options: ["UZS", "USD"], showIf: { creditNeeded: "yes" } },
        { key: "loanTermMonths", label: "Срок кредита", question: "На какой срок нужен кредит?", type: "number", unit: "мес.", showIf: { creditNeeded: "yes" } },
        { key: "loanAnnualRatePct", label: "Годовая ставка", question: "Какая годовая процентная ставка по кредиту?", type: "number", unit: "%", showIf: { creditNeeded: "yes" } },
        { key: "loanGracePeriodMonths", label: "Льготный период", question: "Есть ли льготный период по кредиту? Укажите срок в месяцах, если есть.", type: "number", unit: "мес.", optional: true, showIf: { creditNeeded: "yes" } },
        { key: "loanRepaymentType", label: "Тип погашения", question: "Какой тип погашения кредита планируется?", type: "select", options: ["annuity", "equal_principal"], showIf: { creditNeeded: "yes" } },
        { key: "loanPurpose", label: "Цель кредита", question: "На что именно нужен кредит?", type: "textarea", showIf: { creditNeeded: "yes" } },
        { key: "collateralAvailable", label: "Залог", question: "Есть ли потенциальный залог?", type: "boolean", showIf: { creditNeeded: ["yes", "unknown"] } },
        { key: "collateralType", label: "Тип залога", question: "Какой тип залога можно предложить?", type: "text", showIf: { collateralAvailable: true } },
        { key: "collateralYear", label: "Год залога", question: "Если залог - автомобиль или оборудование, укажите год выпуска.", type: "number", optional: true, showIf: { collateralAvailable: true } },
        { key: "collateralCondition", label: "Состояние залога", question: "Опишите состояние залога.", type: "select", options: ["new", "good", "average", "needs_repair", "unknown"], optional: true, showIf: { collateralAvailable: true } },
        { key: "collateralEstimatedValue", label: "Стоимость залога", question: "Ориентировочная стоимость залога", type: "number", unit: "UZS", optional: true, showIf: { collateralAvailable: true } },
        { key: "collateralDocumentsAvailable", label: "Документы по залогу", question: "Есть ли подтверждающие документы по залогу?", type: "boolean", optional: true, showIf: { collateralAvailable: true } },
        { key: "needsLeasing", label: "Лизинг", question: "Нужен ли лизинг оборудования?", type: "boolean" },
        { key: "requestedLeasingAmount", label: "Сумма лизинга", question: "Какая сумма лизинга нужна?", type: "number", unit: "UZS", showIf: { needsLeasing: true } },
        { key: "requestedLeasingCurrency", label: "Валюта лизинга", question: "В какой валюте указан лизинг?", type: "select", options: ["UZS", "USD"], showIf: { needsLeasing: true } },
        { key: "leasingItem", label: "Предмет лизинга", question: "Какое оборудование или предмет планируется взять в лизинг?", type: "text", showIf: { needsLeasing: true } },
        { key: "leasingAdvancePayment", label: "Первоначальный взнос", question: "Какой первоначальный взнос по лизингу?", type: "number", unit: "UZS", optional: true, showIf: { needsLeasing: true } },
        { key: "leasingTermMonths", label: "Срок лизинга", question: "На какой срок нужен лизинг?", type: "number", unit: "мес.", showIf: { needsLeasing: true } },
        { key: "leasingAnnualRatePct", label: "Ставка/удорожание", question: "Какая годовая ставка или удорожание по лизингу?", type: "number", unit: "%", showIf: { needsLeasing: true } },
        { key: "leasingMonthlyPayment", label: "Ежемесячный платеж", question: "Если известен ежемесячный платеж по лизингу, укажите сумму.", type: "number", unit: "UZS", optional: true, showIf: { needsLeasing: true } },
        { key: "leasingSupplier", label: "Поставщик лизинга", question: "Кто поставщик оборудования?", type: "text", optional: true, showIf: { needsLeasing: true } },
        { key: "leasingOfferAvailable", label: "Коммерческое предложение", question: "Есть ли коммерческое предложение по лизингу?", type: "boolean", optional: true, showIf: { needsLeasing: true } },
        { key: "leasingDeliveryInstallationIncluded", label: "Доставка и монтаж", question: "Доставка и монтаж включены в условия лизинга?", type: "boolean", optional: true, showIf: { needsLeasing: true } },
        { key: "workingCapitalCreditNeeded", label: "Оборотный капитал", question: "Нужен ли кредит на оборотный капитал?", type: "boolean", optional: true },
        { key: "calculatedExpenses", label: "Просчитанные расходы", question: "Какие расходы вы уже просчитали?", type: "textarea", optional: true },
        { key: "contingencyReserveAvailable", label: "Резерв", question: "Есть ли резерв на непредвиденные расходы?", type: "boolean", optional: true },
        { key: "sectionNotes.finance", label: "Подробное описание", question: "Опишите финансовую часть", type: "textarea", placeholder: sectionNotePlaceholders.finance, optional: true }
      ]
    },
    {
      id: "compliance",
      name: "Сертификация и опыт",
      description: "Проверяем требования, документы и опыт команды.",
      questions: [
        { key: "certificationAwareness", label: "Сертификация", question: "Знаете ли вы, какие сертификаты нужны для детских товаров?", type: "select", options: ["aware", "partly_aware", "not_aware", "other"] },
        { key: "packagingLabelingPlan", label: "Маркировка", question: "Есть ли план по маркировке и упаковке?", type: "boolean", optional: true },
        { key: "sanitaryRequirementsKnown", label: "Санитарные требования", question: "Есть ли экологические или санитарные требования к производству?", type: "boolean", optional: true },
        { key: "hasAccountantOrConsultant", label: "Бухгалтер/консультант", question: "Есть ли бухгалтер или консультант?", type: "boolean", optional: true },
        { key: "experienceLevel", label: "Опыт", question: "Какой опыт у команды в производстве или продажах?", type: "select", options: ["low", "medium", "high", "other"] },
        { key: "sectionNotes.complianceExperience", label: "Подробное описание", question: "Опишите опыт и план по сертификации", type: "textarea", placeholder: sectionNotePlaceholders.complianceExperience, optional: true }
      ]
    }
  ],
  riskRules: {
    certification: "Высокий риск, если требования неизвестны, продукт для 0-3 лет или маркировка не продумана.",
    collateral: "Не применяется, если кредит не выбран. Высокий риск, если кредит нужен и залог отсутствует.",
    fx: "Высокий риск при импортном сырье/оборудовании, продажах в UZS и отсутствии валютного буфера.",
    workingCapital: "Высокий риск при оплате клиентов 30+ дней и недостаточном резерве оборотного капитала.",
    sales: "Высокий риск при одном канале продаж и отсутствии предварительных договоренностей.",
    equipment: "Высокий риск при б/у оборудовании, отсутствии сервиса или поставщика.",
    infrastructure: "Высокий риск при отсутствии помещения и неподтвержденной инфраструктуре."
  },
  scoringRules: {
    detailedSalesNotesBonus: 5,
    detailedEquipmentNotesBonus: 5,
    detailedRawMaterialsNotesBonus: 5,
    concreteFiguresBonus: 8,
    unknownAnswersPenalty: -10
  }
};
