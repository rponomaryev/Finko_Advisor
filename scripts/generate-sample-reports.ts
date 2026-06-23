import { writeFile } from "node:fs/promises";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildGenericBusinessTemplate } from "../src/lib/data/sectorTemplates/genericBusinessTemplate.ts";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { mapBusinessToSector } from "../src/lib/marketData/hsCodeMapper.ts";
import type { MarketDataPoint, MarketDataResult } from "../src/lib/marketData/types.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

type Scenario = {
  slug: string;
  title: string;
  businessType: string;
  data: StructuredProjectData;
  marketPoints: MarketDataPoint[];
  formats: Array<"xlsx" | "pdf">;
};

function staff(roles: Array<{ role: string; count: number; salary: number }>) {
  return { roles: roles.map((role) => ({ role: role.role, count: role.count, monthlySalaryAmount: role.salary, monthlySalaryCurrency: "UZS" as const })) };
}

function source(points: MarketDataPoint[], businessType: string, region?: string): MarketDataResult {
  const mapping = mapBusinessToSector(businessType);
  return {
    locale: "ru",
    businessType,
    region,
    mapping,
    dataPoints: points,
    messages: points.length ? [] : ["Официальные числовые данные по данному продукту не найдены."],
    sources: points.map((point) => ({
      sourceName: point.sourceName,
      sourceType: point.sourceType,
      sourceUrl: point.sourceUrl,
      year: point.year,
      lastUpdated: typeof point.lastUpdated === "string" ? point.lastUpdated : undefined,
      notes: `${point.indicator} (${point.matchQuality ?? "close_proxy"}). ${point.explanation ?? "Показатель выбран как релевантный косвенный ориентир для бизнес-профиля."}`
    }))
  };
}

function projectFor(scenario: Scenario) {
  const template = buildGenericBusinessTemplate(scenario.businessType);
  const structuredData: StructuredProjectData = {
    userLanguage: "ru",
    templateCode: template.code,
    sectorCode: template.code,
    exchangeRateUZSPerUSD: 11970.68,
    preferredRevenueSource: "calculated",
    ...scenario.data
  };
  const financial = calculateAll(structuredData, template.assumptions);
  const risks = generateRiskMatrix(structuredData);
  const feasibilityScore = calculateFeasibilityScore(structuredData, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(structuredData, financial, risks);
  const marketData = source(scenario.marketPoints, scenario.businessType, structuredData.region);
  const reportData = buildReportData({
    project: { ...structuredData, title: scenario.title, sectorCode: template.code },
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore,
    marketData
  });
  return {
    id: `sample-${scenario.slug}`,
    title: scenario.title,
    status: "calculated",
    businessType: scenario.businessType,
    userLanguage: "ru",
    sectorCode: template.code,
    structuredData,
    region: structuredData.region,
    district: structuredData.district,
    plannedStartPeriod: structuredData.plannedStartPeriod,
    financialResult: financial,
    riskResult: risks,
    feasibilityScore,
    bankReadinessScore,
    reportData
  };
}

const common = {
  region: "Ташкент город",
  district: "Юнусабад",
  plannedStartPeriod: "через 3 месяца",
  ownContributionCurrency: "UZS" as const,
  requestedLoanCurrency: "UZS" as const,
  loanRepaymentType: "annuity" as const,
  collateralAvailable: true,
  collateralDocumentsAvailable: true,
  needsLeasing: false,
  certificationAwareness: "aware",
  experienceLevel: "medium"
};

const scenarios: Scenario[] = [
  {
    slug: "auto-service-one-box-report",
    title: "Автосервис: 1 бокс внутри большого сервиса - Ташкент город",
    businessType: "Автосервис",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Автосервис",
      region: "Ташкент город",
      district: "Сергелийский район",
      businessIdea: "Один бокс внутри большого автосервиса: замена масла, фильтров, диагностика, мелкий ремонт ходовой и тормозов.",
      productOrService: "Автосервисные услуги: замена масла, диагностика, мелкий ремонт, фильтры, тормоза и ходовая часть",
      autoServiceFormat: "one_box_inside_larger_service",
      operationalModel: "one_box_inside_larger_business",
      parentAutoServiceName: "Большой автосервис / арендодатель уточняется",
      boxLeaseModel: "sublease",
      boxLeaseTerms: "Письменная субаренда одного бокса с доступом к подъемнику, электричеству, воде, компрессору, парковке и клиентскому потоку большого автосервиса.",
      leaseTermMonths: 24,
      leaseRenewalOption: true,
      subleaseAllowed: true,
      terminationNoticeDays: 60,
      boxAreaSqm: 42,
      carsServedAtOnce: 1,
      includedInfrastructure: "Подъемник, электричество, компрессор, вода/слив, парковка, охрана, общий администратор, зона ожидания; нужно проверить вентиляцию, вывеску и хранение расходников.",
      liftIncluded: true,
      compressorIncluded: true,
      ventilationReady: false,
      waterDrainageReady: true,
      signageAllowed: false,
      premisesStatus: "rent",
      premisesAreaSqm: 42,
      serviceCategories: ["oil_change", "filters", "diagnostics", "minor_repair", "suspension", "brakes"],
      monthlyCapacity: 130,
      salesUnitLabel: "авто/мес.",
      dailyServiceCapacity: 5,
      workingDaysPerMonth: 26,
      workingHoursPerDay: 9,
      averageServiceDurationMinutes: 75,
      averagePrice: 350000,
      averageServiceTicket: 350000,
      utilizationRatePct: 58,
      capacityBottleneck: "customer_flow",
      firstMonthCarsPerDay: 2,
      stableCarsPerDay: 5,
      customerAcquisitionChannels: ["parent_service_flow", "recommendations", "maps_2gis_google_yandex", "telegram_instagram"],
      parentServiceCustomerFlow: "Нужна отдельная договоренность с владельцем большого сервиса о передаче клиентов на замену масла и мелкий ремонт.",
      clientPaymentFlow: "mixed",
      parentServiceCommissionPct: 10,
      paymentSettlementTerms: "Если оплата идет через кассу большого сервиса, доля бокса перечисляется ежедневно или еженедельно по акту.",
      partsResalePlanned: true,
      partsMarginPct: 18,
      equipmentList: "Диагностический сканер, набор инструмента, оборудование для масла, емкости для отработанного масла, базовый POS/учет.",
      equipmentOwnership: "mixed",
      equipmentCondition: "mixed",
      supplierOfferAvailable: false,
      equipmentServiceSupport: "Нужно подтвердить гарантию и сервис диагностического сканера в Узбекистане.",
      equipmentCapex: 85000000,
      premisesSetupCapex: 18000000,
      consumables: "Масла, фильтры, тормозная жидкость, антифриз, химия, перчатки, ветошь, мелкий крепеж.",
      consumablesSource: "mixed",
      rawMaterialSource: "mixed",
      supplierCurrency: "mixed",
      importedPartsSharePct: 55,
      foreignCurrencyPurchases: true,
      alternativeSuppliers: true,
      supplierPaymentTerms: "Локальные закупки в UZS, импортные бренды с валютной привязкой, часть позиций покупается под клиента.",
      initialInventoryCapex: 30000000,
      wasteOilHandling: "Нужно закрепить, кто отвечает за сбор и передачу отработанного масла, фильтров и жидкостей: владелец большого сервиса или предприниматель.",
      wasteOilHandlingPlan: "planned",
      vehicleModificationServices: false,
      gasEquipmentInstallation: false,
      paintingOrBodywork: false,
      hazardousWasteHandlingKnown: false,
      staffPlan: staff([{ role: "Мастер-автомеханик", count: 1, salary: 6000000 }, { role: "Помощник мастера", count: 1, salary: 3000000 }]),
      staffSkills: "Мастер имеет опыт замены масла, диагностики и мелкого ремонта; по сложной электронике нужен внешний специалист.",
      serviceQualityControl: "Чек-лист приемки/выдачи авто, фото до/после, контроль уровня жидкостей и затяжки.",
      warrantyPolicy: "Гарантия на работы 7-14 дней, на детали по условиям поставщика; ответственность фиксируется в заказ-наряде.",
      monthlyRent: 6000000,
      rawMaterialCostPerUnit: 165000,
      packagingCostPerUnit: 0,
      directLogisticsCostPerUnit: 10000,
      marketplaceCommissionPerUnit: 0,
      wasteAllowancePct: 4,
      ownContributionAmount: 55000000,
      ownContributionUZS: 55000000,
      creditNeeded: "yes",
      requestedLoanAmount: 120000000,
      requestedLoanUZS: 120000000,
      loanTermMonths: 36,
      loanAnnualRatePct: 26,
      loanPurpose: "Инструмент, диагностический сканер, стартовый запас расходников и оборотный капитал.",
      collateralType: "Оборудование и личный автомобиль",
      collateralEstimatedValue: 140000000,
      sectionNotes: {
        premisesInfrastructure: "Ключевой риск - зависимость от договора субаренды бокса и общей инфраструктуры большого автосервиса.",
        equipment: "Для запуска нужны диагностический сканер, инструмент, емкости для отработанного масла и учет/POS; КП поставщика нужно получить.",
        productionCapacity: "Пропускная способность около 5 авто в день при 26 рабочих днях; узкое место - клиентский поток и мастер.",
        rawMaterials: "Расходники смешанные: локальные поставщики и импортные бренды с валютной привязкой.",
        salesMarketing: "Поток клиентов должен быть подтвержден договоренностью с большим сервисом, 2GIS/Google/Яндекс.Карты и рекомендациями.",
        finance: "Нужны собственные средства, кредит и оборотный буфер на аренду, зарплату и расходники.",
        complianceExperience: "Нужно проверить договор субаренды, порядок оплаты через кассу, отработанное масло, фильтры, жидкости и ограничения по видам работ."
      }
    },
    marketPoints: [
      { sector: "auto services", businessType: "Автосервис", indicator: "Рыночные услуги / ремонт автомобилей", year: 2024, region: "Tashkent", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Статистика услуг используется как официальный косвенный ориентир для оценки спроса на сервисные бизнесы." },
      { sector: "auto services", businessType: "Автосервис", indicator: "Валютный риск по импортным запчастям", year: 2024, region: "Uzbekistan", value: 55, unit: "% импортных затрат", sourceName: "Курс ЦБ / коммерческое предложение поставщика", sourceType: "project_evidence", matchQuality: "close_proxy", explanation: "Доля импортных расходников из проекта повышает валютный риск минимум до среднего, а при валютных закупках до высокого." }
    ]
  },
  {
    slug: "bakery-report",
    title: "Мини-пекарня - Ташкент город",
    businessType: "Мини-пекарня",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Мини-пекарня",
      businessIdea: "Мини-пекарня с собственной точкой продаж и корпоративными заказами для офисов, кафе и магазинов.",
      productOrService: "Свежий хлеб, самса, булочки, слойки и сладкая выпечка",
      premisesStatus: "rent",
      equipmentCondition: "mixed",
      dailyCovers: 120,
      workingDaysPerMonth: 26,
      salesUnitLabel: "заказов/мес.",
      averageTicket: 35000,
      averagePrice: 35000,
      foodCostPct: 35,
      utilizationRatePct: 65,
      rawMaterialSource: "local",
      targetCustomers: ["retail", "corporate", "delivery", "walk_in"],
      staffPlan: staff([{ role: "Пекарь", count: 2, salary: 4500000 }, { role: "Продавец", count: 1, salary: 3500000 }, { role: "Помощник", count: 1, salary: 3000000 }]),
      monthlyRent: 4200000,
      equipmentCapex: 60000000,
      premisesSetupCapex: 50000000,
      itPosWebsiteCapex: 12000000,
      initialInventoryCapex: 6000000,
      packagingCostPerUnit: 500,
      directLogisticsCostPerUnit: 0,
      marketplaceCommissionPerUnit: 0,
      wasteAllowancePct: 10,
      ownContributionAmount: 200000000,
      ownContributionUZS: 200000000,
      creditNeeded: "yes",
      requestedLoanAmount: 50000000,
      requestedLoanUZS: 50000000,
      loanTermMonths: 48,
      loanAnnualRatePct: 26,
      loanPurpose: "Часть оборудования и ремонта помещения.",
      collateralType: "Автомобиль Toyota Land Cruiser 300",
      collateralYear: 2022,
      collateralCondition: "good",
      collateralEstimatedValue: 780000000,
      sectionNotes: { salesMarketing: "Спрос подтверждается локальным трафиком и корпоративными заказами; требуется собрать письма о намерениях." }
    },
    marketPoints: [{ sector: "food manufacturing", businessType: "Мини-пекарня", indicator: "Объём производства пищевой продукции", year: 2024, region: "Uzbekistan", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Пищевое производство используется как близкий косвенный ориентир, потому что точные данные по мини-пекарням не найдены." }]
  },
  {
    slug: "cleaning-service-report",
    title: "Клининговая служба - Ташкент город",
    businessType: "Клининговые услуги",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Клининговые услуги",
      businessIdea: "Клининговая компания в Ташкенте: уборка квартир, офисов и договоры с небольшими компаниями. Планируются выездные бригады, профессиональный инвентарь и безопасная химия.",
      productOrService: "Уборка квартир, офисов и коммерческих помещений",
      premisesStatus: "storage_only",
      equipmentCondition: "new",
      equipmentList: "Профессиональный пылесос, пароочиститель, инвентарь, спецодежда, расходники",
      cleaningServiceTypes: ["apartment_cleaning", "office_cleaning", "commercial_cleaning", "deep_cleaning"],
      targetCustomers: ["apartments", "offices", "b2b_contracts", "repeat_clients"],
      customerAcquisitionChannels: ["instagram", "telegram", "recommendations", "maps_2gis_google_yandex"],
      cleaningBusinessModel: "mobile_teams",
      transportNeeds: "taxi_and_rented_vehicle",
      cleaningChemicals: "Чистящие средства, перчатки, маски, салфетки, мешки",
      chemicalStorageSafety: "Отдельное хранение химии, маркировка, инструкции и средства защиты для бригад.",
      chemicalsSource: "local",
      dailyOrdersCapacity: 4,
      averageCleaningTicket: 350000,
      pricingModel: "per_order",
      clientContracts: true,
      damageLiability: "Нужен акт приемки, чек-лист и порядок ответственности за повреждение имущества клиента.",
      chemicalSafetyRules: true,
      requiredPermits: "Регистрация бизнеса, договоры с клиентами, трудовые договоры, касса и правила безопасного применения химии.",
      equipmentCapex: 35000000,
      premisesSetupCapex: 5000000,
      initialInventoryCapex: 12000000,
      rawMaterialCostPerUnit: 65000,
      packagingCostPerUnit: 15000,
      directLogisticsCostPerUnit: 40000,
      marketplaceCommissionPerUnit: 0,
      wasteAllowancePct: 5,
      staffPlan: staff([{ role: "Клинер", count: 4, salary: 3500000 }, { role: "Бригадир", count: 1, salary: 5000000 }]),
      ownContributionAmount: 50000000,
      ownContributionUZS: 50000000,
      creditNeeded: "yes",
      requestedLoanAmount: 80000000,
      requestedLoanUZS: 80000000,
      loanTermMonths: 36,
      loanAnnualRatePct: 26,
      loanPurpose: "Профессиональный инвентарь, расходники, спецодежда, маркетинг и оборотный капитал.",
      monthlyRent: 0,
      sectionNotes: {
        premisesInfrastructure: "Постоянная торговая точка не нужна, но требуется безопасное место хранения инвентаря и химии.",
        equipment: "Ключевые активы - профессиональный пылесос, пароочиститель, инвентарь, спецодежда и расходники.",
        productionCapacity: "Мощность зависит от числа бригад, времени уборки, маршрута и повторных заказов.",
        rawMaterials: "Расходники закупаются локально; нужны запасные поставщики и правила безопасного хранения.",
        salesMarketing: "Спрос подтверждается повторными клиентами, заявками из соцсетей, рекомендациями и договорами с офисами.",
        finance: "Финансирование требуется на инвентарь, расходники, маркетинг и денежный резерв первых месяцев.",
        complianceExperience: "Проверить договоры с клиентами, трудовые договоры, кассу, инструкции по химии и ответственность за имущество."
      }
    },
    marketPoints: [
      { sector: "Клининговые услуги", businessType: "Клининговые услуги", indicator: "Динамика сектора услуг", year: 2024, region: "Ташкент", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Показатель услуг используется как официальный ориентир спроса на сервисные компании." },
      { sector: "Клининговые услуги", businessType: "Клининговые услуги", indicator: "Проверка договоров и кассы", year: 2025, region: "Узбекистан", value: 1, unit: "требует проверки", sourceName: "Портал государственных услуг Республики Узбекистан", sourceType: "official_registry", matchQuality: "broad_proxy", explanation: "Документы, договоры и кассовую дисциплину нужно проверить перед запуском." }
    ]
  },
  {
    slug: "ice-cream-kiosk-report",
    title: "Киоск мороженого - Ташкент город",
    businessType: "Киоск мороженого",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Киоск мороженого",
      businessIdea: "Сезонный киоск мороженого возле парка с продажами порциями и напитками навынос.",
      productOrService: "Мороженое, вафельные рожки, холодные напитки",
      premisesStatus: "rent",
      equipmentCondition: "new",
      monthlyCapacity: 4200,
      salesUnitLabel: "порций/мес.",
      averagePrice: 18000,
      utilizationRatePct: 60,
      rawMaterialSource: "local",
      targetCustomers: ["walk_in", "students", "events"],
      staffPlan: staff([{ role: "Продавец", count: 2, salary: 3200000 }]),
      monthlyRent: 3000000,
      equipmentCapex: 42000000,
      premisesSetupCapex: 18000000,
      rawMaterialCostPerUnit: 6500,
      packagingCostPerUnit: 700,
      ownContributionAmount: 85000000,
      ownContributionUZS: 85000000,
      creditNeeded: "yes",
      requestedLoanAmount: 35000000,
      requestedLoanUZS: 35000000,
      loanTermMonths: 24,
      loanAnnualRatePct: 25,
      loanPurpose: "Оборудование для хранения и продажи мороженого.",
      collateralType: "Торговое оборудование",
      collateralEstimatedValue: 42000000
    },
    marketPoints: [{ sector: "food retail", businessType: "Киоск мороженого", indicator: "Retail food trade turnover", year: 2024, region: "Tashkent", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Розничная торговля продуктами отражает близкий спросовой косвенный ориентир для киоска." }]
  },
  {
    slug: "furniture-workshop-report",
    title: "Мебельный цех - Самарканд",
    businessType: "Мебельный цех",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Мебельный цех",
      region: "Самарканд",
      district: "Самарканд город",
      businessIdea: "Цех по производству корпусной мебели на заказ для квартир, офисов и малых магазинов.",
      productOrService: "Кухни, шкафы, офисная мебель, торговые стойки",
      premisesStatus: "rent",
      equipmentCondition: "mixed",
      monthlyCapacity: 55,
      salesUnitLabel: "комплектов/мес.",
      averagePrice: 4500000,
      utilizationRatePct: 58,
      rawMaterialSource: "mixed",
      targetCustomers: ["direct_b2b", "retail", "marketplaces"],
      staffPlan: staff([{ role: "Мастер", count: 3, salary: 5200000 }, { role: "Сборщик", count: 2, salary: 4200000 }, { role: "Менеджер продаж", count: 1, salary: 4000000 }]),
      monthlyRent: 8000000,
      equipmentCapex: 160000000,
      premisesSetupCapex: 55000000,
      rawMaterialCostPerUnit: 1800000,
      packagingCostPerUnit: 100000,
      directLogisticsCostPerUnit: 180000,
      ownContributionAmount: 220000000,
      ownContributionUZS: 220000000,
      creditNeeded: "yes",
      requestedLoanAmount: 120000000,
      requestedLoanUZS: 120000000,
      loanTermMonths: 36,
      loanAnnualRatePct: 27,
      loanPurpose: "Станки, инструмент и оборотный запас ЛДСП/фурнитуры.",
      collateralType: "Оборудование и автомобиль доставки",
      collateralEstimatedValue: 180000000
    },
    marketPoints: [{ sector: "furniture manufacturing", indicator: "Furniture manufacturing production косвенный ориентир", year: 2024, region: "Uzbekistan", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Показатель производства мебели является близким косвенный ориентир для мебельного цеха." }]
  },
  {
    slug: "beauty-salon-report",
    title: "Салон красоты - Ташкент город",
    businessType: "Салон красоты",
    formats: ["xlsx", "pdf"],
    data: {
      ...common,
      businessType: "Салон красоты",
      businessIdea: "Салон красоты в жилом районе с услугами стрижки, окрашивания, маникюра и ухода.",
      productOrService: "Парикмахерские услуги, маникюр, уходовые процедуры",
      premisesStatus: "rent",
      equipmentCondition: "new",
      monthlyCapacity: 650,
      salesUnitLabel: "клиентов/мес.",
      averagePrice: 95000,
      utilizationRatePct: 62,
      rawMaterialSource: "mixed",
      targetCustomers: ["walk_in", "students", "retail"],
      staffPlan: staff([{ role: "Парикмахер", count: 2, salary: 4200000 }, { role: "Мастер маникюра", count: 2, salary: 3800000 }, { role: "Администратор", count: 1, salary: 3500000 }]),
      monthlyRent: 6500000,
      equipmentCapex: 70000000,
      premisesSetupCapex: 65000000,
      rawMaterialCostPerUnit: 18000,
      ownContributionAmount: 130000000,
      ownContributionUZS: 130000000,
      creditNeeded: "yes",
      requestedLoanAmount: 65000000,
      requestedLoanUZS: 65000000,
      loanTermMonths: 30,
      loanAnnualRatePct: 26,
      loanPurpose: "Ремонт, оборудование и стартовые материалы.",
      collateralType: "Оборудование салона",
      collateralEstimatedValue: 70000000
    },
    marketPoints: [{ sector: "personal services", indicator: "Household and personal services demand косвенный ориентир", year: 2024, region: "Tashkent", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Услуги населению являются близким косвенный ориентир для салона красоты." }]
  },
  {
    slug: "sewing-workshop-report",
    title: "Швейная мастерская - Фергана",
    businessType: "Швейная мастерская",
    formats: ["xlsx"],
    data: {
      ...common,
      businessType: "Швейная мастерская",
      region: "Фергана",
      district: "Фергана город",
      businessIdea: "Мастерская по пошиву формы, спецодежды и мелких партий одежды для B2B-клиентов.",
      productOrService: "Форма, спецодежда, ремонт и мелкосерийный пошив",
      premisesStatus: "rent",
      equipmentCondition: "used",
      monthlyCapacity: 900,
      salesUnitLabel: "изделий/мес.",
      averagePrice: 85000,
      rawMaterialSource: "mixed",
      targetCustomers: ["direct_b2b", "marketplaces"],
      staffPlan: staff([{ role: "Швея", count: 5, salary: 3300000 }, { role: "Закройщик", count: 1, salary: 4200000 }]),
      monthlyRent: 3500000,
      equipmentCapex: 48000000,
      premisesSetupCapex: 12000000,
      rawMaterialCostPerUnit: 35000,
      ownContributionAmount: 80000000,
      ownContributionUZS: 80000000,
      creditNeeded: "no",
      collateralAvailable: false,
      needsLeasing: true,
      requestedLeasingAmount: 35000000,
      requestedLeasingCurrency: "UZS",
      leasingItem: "Швейные машины и оверлоки",
      leasingTermMonths: 24,
      leasingAnnualRatePct: 24
    },
    marketPoints: [{ sector: "textile manufacturing", indicator: "Textile and apparel production косвенный ориентир", year: 2024, region: "Uzbekistan", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Текстильное производство является близким косвенный ориентир для швейной мастерской." }]
  },
  {
    slug: "ecommerce-store-report",
    title: "Онлайн-магазин одежды - Ташкент город",
    businessType: "Онлайн-магазин одежды",
    formats: ["xlsx"],
    data: {
      ...common,
      businessType: "Онлайн-магазин одежды",
      businessIdea: "Онлайн-магазин повседневной одежды с продажами через сайт, маркетплейсы и доставку.",
      productOrService: "Одежда, аксессуары, сезонные коллекции",
      premisesStatus: "rent",
      equipmentCondition: "new",
      monthlyCapacity: 1200,
      salesUnitLabel: "заказов/мес.",
      averagePrice: 210000,
      utilizationRatePct: 45,
      rawMaterialSource: "import",
      targetCustomers: ["marketplaces", "delivery", "retail"],
      staffPlan: staff([{ role: "Менеджер заказов", count: 2, salary: 3500000 }, { role: "SMM/контент", count: 1, salary: 4500000 }]),
      monthlyRent: 5000000,
      equipmentCapex: 28000000,
      itPosWebsiteCapex: 35000000,
      initialInventoryCapex: 160000000,
      rawMaterialCostPerUnit: 120000,
      marketplaceCommissionPerUnit: 16000,
      directLogisticsCostPerUnit: 12000,
      ownContributionAmount: 180000000,
      ownContributionUZS: 180000000,
      creditNeeded: "yes",
      requestedLoanAmount: 80000000,
      requestedLoanUZS: 80000000,
      loanTermMonths: 24,
      loanAnnualRatePct: 26,
      loanPurpose: "Закупка товара и маркетинг.",
      collateralType: "Товарный запас",
      collateralEstimatedValue: 160000000
    },
    marketPoints: [{ sector: "retail ecommerce", indicator: "Retail trade and ecommerce косвенный ориентир", year: 2024, region: "Uzbekistan", value: 100, unit: "индекс", sourceName: "Национальный комитет статистики Республики Узбекистан", sourceType: "official_statistics", matchQuality: "close_proxy", explanation: "Розничная торговля и цифровые каналы являются близким косвенный ориентир для онлайн-магазина." }]
  },
  {
    slug: "import-equipment-report",
    title: "Импорт оборудования из Китая - Ташкент город",
    businessType: "Импорт оборудования из Китая",
    formats: ["xlsx"],
    data: {
      ...common,
      businessType: "Импорт оборудования из Китая",
      businessIdea: "Импорт и перепродажа малого производственного оборудования из Китая для предпринимателей.",
      productOrService: "Оборудование для малого производства, сервис и доставка",
      premisesStatus: "rent",
      equipmentCondition: "new",
      monthlyCapacity: 20,
      salesUnitLabel: "комплектов/мес.",
      averagePrice: 28000000,
      utilizationRatePct: 50,
      rawMaterialSource: "import",
      targetCustomers: ["direct_b2b", "marketplaces"],
      staffPlan: staff([{ role: "Менеджер ВЭД", count: 1, salary: 7000000 }, { role: "Менеджер продаж", count: 2, salary: 4500000 }]),
      monthlyRent: 7000000,
      initialInventoryCapex: 400000000,
      itPosWebsiteCapex: 25000000,
      rawMaterialCostPerUnit: 19500000,
      directLogisticsCostPerUnit: 1200000,
      marketplaceCommissionPerUnit: 300000,
      ownContributionAmount: 350000000,
      ownContributionUZS: 350000000,
      creditNeeded: "yes",
      requestedLoanAmount: 250000000,
      requestedLoanUZS: 250000000,
      loanTermMonths: 36,
      loanAnnualRatePct: 27,
      loanPurpose: "Закупка первой партии оборудования и логистика.",
      collateralType: "Товарный запас и контракт поставки",
      collateralEstimatedValue: 400000000
    },
    marketPoints: [{ sector: "equipment import", indicator: "HS 84/85 machinery import value", year: 2024, region: "Uzbekistan", valueUsd: 1000000, sourceName: "UN Comtrade / customs косвенный ориентир", sourceType: "multilateral_statistics", matchQuality: "close_proxy", explanation: "HS-коды оборудования используются как косвенный ориентир для оценки импортного рынка и валютного риска." }]
  }
];

for (const scenario of scenarios) {
  const project = projectFor(scenario);
  if (scenario.formats.includes("xlsx")) {
    await writeFile(`sample-${scenario.slug}.xlsx`, await buildExcelReportBuffer(project, "ru"));
  }
  if (scenario.formats.includes("pdf")) {
    await writeFile(`sample-${scenario.slug}.pdf`, await buildPdfReportBuffer(project, "ru"));
  }
}

console.log(`Generated ${scenarios.length} sample report scenarios.`);
