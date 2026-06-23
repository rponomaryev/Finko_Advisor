import type { BusinessProfile } from "../business/businessClassifier.ts";
import type { StructuredProjectData } from "../types/project.ts";

export type AnswerMemory = {
  businessIdea?: string;
  productsOrServices?: string[];
  targetCustomers?: string[];
  salesChannels?: string[];
  equipment?: string[];
  inventory?: string[];
  suppliers?: string;
  premises?: string;
  team?: string;
  pricing?: string;
  averageTicket?: number;
  monthlyRevenue?: number;
  monthlyCosts?: number;
  monthlyVolume?: number;
  ownContribution?: number;
  fundingNeed?: number;
  legalDocs?: string[];
  risks?: string[];
  operations?: string;
  returnsPolicy?: string;
  serviceFlow?: string;
  productionCapacity?: string | number;
  workingCapital?: string | number;
  sanitaryCompliance?: string;
  b2bContracts?: string | boolean;
};

export type MissingInput = {
  key: string;
  severity: "critical" | "important" | "optional";
  reason: string;
  relatedReportSection: "financial_model" | "market" | "operations" | "risks" | "documents" | "bank_readiness";
};

export const answerAliases: Record<string, string[]> = {
  businessIdea: ["businessIdea", "sectionNotes.businessIdea"],
  productsOrServices: ["productOrService", "serviceType", "serviceCategories", "productCategories", "menuCategories", "washServiceTypes", "cleaningServiceTypes", "repairServiceTypes", "rentalToolCategories", "solarSystemTypes", "storageUnitTypes"],
  targetCustomers: ["targetCustomers", "targetCustomerSegments", "customerSegments", "mainClients", "b2bClients", "b2cClients", "clientSegments", "rentalTargetCustomers", "groomingTargetCustomers"],
  salesChannels: ["salesChannels", "customerAcquisitionChannels", "onlineChannels", "offlineSales", "telegramSales", "bookingChannels", "deliveryChannels", "marketplaces"],
  equipment: ["equipmentList", "laundryEquipment", "productionEquipment", "keyEquipment", "tools", "launchAssets", "equipmentCapex", "carWashEquipment", "kitchenEquipment", "groomingEquipment", "repairEquipment", "solarInstallationEquipment", "rentalEquipmentList", "labEquipmentList", "sectionNotes.equipment"],
  inventory: ["inventory", "initialInventoryCostUZS", "initialInventoryCapex", "firstMonthRawMaterialStockUZS", "skuCount", "productCategories", "rawMaterials", "laundryConsumables", "washChemicals", "groomingConsumables", "repairSpareParts"],
  suppliers: ["supplierSelected", "supplier", "rawMaterialSource", "inventorySupplier", "productSupplier", "supplierPaymentTerms", "supplierOfferAvailable", "alternativeSuppliers", "solarSupplierPlan", "ingredientSupplyPlan", "reagentsSupplierSelected", "laundrySupplierPlan", "sectionNotes.rawMaterials", "sectionNotes.inventory"],
  premises: ["premises", "premisesStatus", "rentalPremisesStatus", "premisesAreaSqm", "monthlyRent", "locationTraffic", "serviceArea", "storageNeeds", "sectionNotes.premisesInfrastructure"],
  team: ["team", "staffPlan", "teachers", "doctors", "drivers", "supervisorStaffPlan", "staffSkills", "employeeFormalization"],
  pricing: ["averageTicket", "averagePrice", "priceList", "markupPct", "averageMarkupPct", "servicePrice", "unitEconomics", "pricingModel", "rentalPricingModel", "averageServiceTicket", "averageWashTicket", "averageRentalTicket", "averageRepairTicket", "averageLaundryTicket", "averageGroomingTicket", "averageStorageTicket", "averageTestTicket", "averageSolarProjectTicket"],
  averageTicket: ["averageTicket", "averagePrice", "averageServiceTicket", "averageWashTicket", "averageRentalTicket", "averageRepairTicket", "averageLaundryTicket", "averageGroomingTicket", "averageStorageTicket", "averageTestTicket", "averageSolarProjectTicket"],
  monthlyVolume: ["plannedVolumeMonthly", "plannedMonthlyVolume", "monthlyPlannedVolume", "monthlyCapacity", "dailyServiceCapacity", "dailyOrdersCapacity", "dailyCovers", "monthlyOutputCapacity", "monthlyOrders", "studentsCount", "patients", "carsPerDayStart", "carsPerDayStable", "laundryCyclesPerDay", "repairOrdersPerMonth", "rentalOrdersPerMonth", "solarProjectsPerMonth", "storageUnitsCount", "testsPerMonth", "sectionNotes.productionCapacity"],
  monthlyRevenue: ["stableMonthlyRevenue", "firstThreeMonthsMonthlyRevenue"],
  monthlyCosts: ["monthlyRent", "monthlyUtilities", "monthlyMarketing", "monthlyMaintenance", "monthlyTaxes", "monthlyLogistics", "monthlySoftware", "monthlyInsurance", "monthlyAccounting", "monthlyOtherOpex", "rawMaterialCostPerUnit", "averagePurchaseCost", "foodCostPct"],
  ownContribution: ["ownContribution", "ownContributionAmount", "ownContributionUZS"],
  fundingNeed: ["requestedLoanAmount", "requestedLoanUZS", "requestedLeasingAmount", "requestedLeasingUZS", "creditNeeded", "needsLeasing"],
  legalDocs: ["businessLegalForm", "requiredPermits", "certificationAwareness", "sanitaryPermits", "clientContracts", "handoverActRequired", "repairWarrantyPolicy", "warrantyPolicy", "damageLiability", "sectionNotes.complianceExperience"],
  risks: ["keyRisks", "riskNotes", "damageLiability", "qualityControlPlan", "warrantyPolicy", "serviceTerms", "returnsExchangePolicy", "returnsPolicy", "damageLossPolicy"],
  operations: ["operations", "orderProcessingPlan", "qualityControlPlan", "productionStages", "workingSchedule", "toolTrackingSystem", "handoverInspectionProcess", "serviceArea", "bookingOrWalkInModel", "sectionNotes.productionCapacity"],
  returnsPolicy: ["returnPolicy", "returnsPolicy", "returnsExchangePolicy", "warrantyPolicy", "complaintPolicy", "damageLiability", "damageLossPolicy", "serviceGuarantee", "repairWarrantyPolicy", "laundryServiceTerms", "serviceTerms"],
  serviceFlow: ["serviceFlow", "serviceTerms", "orderProcessingPlan", "bookingOrWalkInModel", "clientPaymentFlow", "laundryServiceTerms", "repairWarrantyPolicy", "deviceIntakeForm", "toolTrackingSystem", "handoverInspectionProcess"],
  productionCapacity: ["monthlyOutputCapacity", "productionStages", "bakeryProductionSchedule", "dailyCovers", "dailyWastePct", "sectionNotes.productionCapacity"],
  workingCapital: ["workingCapitalBufferMonths", "firstMonthRawMaterialStockUZS", "initialInventoryCostUZS", "accountsReceivableBufferUZS", "accountsPayableBufferUZS", "seasonalStockBufferUZS", "workingCapitalNeeded"],
  sanitaryCompliance: ["sanitaryRequirementsKnown", "sanitaryPermits", "sanitaryProductionFlow", "chemicalSafetyRules", "wastewaterHandling", "waterDrainageReady", "sectionNotes.complianceExperience"],
  b2bContracts: ["b2bContracts", "b2bAgreements", "b2bFleetAgreements", "b2bContractsPlanned", "clientContracts", "rentalClientContracts", "hasBuyerAgreements"]
};

const questionToMemoryKey: Record<string, keyof AnswerMemory> = {
  businessType: "businessIdea",
  businessIdea: "businessIdea",
  productOrService: "productsOrServices",
  serviceType: "productsOrServices",
  serviceCategories: "productsOrServices",
  productCategories: "productsOrServices",
  menuCategories: "productsOrServices",
  targetCustomers: "targetCustomers",
  targetCustomerSegments: "targetCustomers",
  customerAcquisitionChannels: "salesChannels",
  salesChannels: "salesChannels",
  marketplaces: "salesChannels",
  bookingChannels: "salesChannels",
  equipmentList: "equipment",
  laundryEquipment: "equipment",
  carWashEquipment: "equipment",
  kitchenEquipment: "equipment",
  groomingEquipment: "equipment",
  repairEquipment: "equipment",
  solarInstallationEquipment: "equipment",
  rentalEquipmentList: "equipment",
  labEquipmentList: "equipment",
  equipmentServiceSupport: "equipment",
  kitchenEquipmentMaintenance: "equipment",
  toolMaintenancePlan: "equipment",
  maintenancePlan: "equipment",
  supplierSelected: "suppliers",
  supplier: "suppliers",
  ingredientSupplyPlan: "suppliers",
  laundrySupplierPlan: "suppliers",
  rawMaterials: "inventory",
  laundryConsumables: "inventory",
  washChemicals: "inventory",
  initialInventoryCostUZS: "inventory",
  premisesStatus: "premises",
  rentalPremisesStatus: "premises",
  serviceArea: "premises",
  monthlyRent: "premises",
  staffPlan: "team",
  teachers: "team",
  averageTicket: "averageTicket",
  averagePrice: "averageTicket",
  averageServiceTicket: "averageTicket",
  averageWashTicket: "averageTicket",
  averageRentalTicket: "averageTicket",
  averageRepairTicket: "averageTicket",
  averageLaundryTicket: "averageTicket",
  monthlyCapacity: "monthlyVolume",
  monthlyOrders: "monthlyVolume",
  dailyCovers: "monthlyVolume",
  monthlyOutputCapacity: "monthlyVolume",
  repairOrdersPerMonth: "monthlyVolume",
  rentalOrdersPerMonth: "monthlyVolume",
  ownContributionAmount: "ownContribution",
  requiredPermits: "legalDocs",
  certificationAwareness: "legalDocs",
  sanitaryPermits: "sanitaryCompliance",
  sanitaryProductionFlow: "sanitaryCompliance",
  serviceTerms: "serviceFlow",
  laundryServiceTerms: "serviceFlow",
  qualityControlPlan: "operations",
  orderProcessingPlan: "operations",
  productionStages: "operations",
  bakeryProductionSchedule: "productionCapacity",
  dailyWastePct: "productionCapacity",
  returnsExchangePolicy: "returnsPolicy",
  damageLiability: "returnsPolicy",
  warrantyPolicy: "returnsPolicy",
  repairWarrantyPolicy: "returnsPolicy",
  damageLossPolicy: "returnsPolicy",
  clientContracts: "b2bContracts",
  b2bAgreements: "b2bContracts",
  b2bFleetAgreements: "b2bContracts"
};

function valueByPath(source: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return source[path];
  return path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0 && value !== "__later__";
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && "roles" in value) return Array.isArray((value as { roles?: unknown[] }).roles) && (value as { roles?: unknown[] }).roles!.length > 0;
  return true;
}

function normalizeValue(value: unknown): string[] | string | number | boolean | undefined {
  if (!isPresent(value)) return undefined;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function firstPresent(source: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const value = valueByPath(source, alias);
    if (isPresent(value)) return value;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  const normalized = normalizeValue(value);
  if (normalized === undefined) return undefined;
  if (Array.isArray(normalized)) return normalized;
  if (typeof normalized === "string") return normalized.split(",").map((item) => item.trim()).filter(Boolean);
  return [String(normalized)];
}

function asNumber(value: unknown): number | undefined {
  if (!isPresent(value)) return undefined;
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

export function buildAnswerMemory(project: Partial<StructuredProjectData> = {}, answers: Record<string, unknown> = {}): AnswerMemory {
  const source = { ...(project as Record<string, unknown>), ...answers };
  const memory: AnswerMemory = {};

  for (const key of Object.keys(answerAliases) as Array<keyof AnswerMemory>) {
    const value = firstPresent(source, answerAliases[key as string] ?? [String(key)]);
    if (value === undefined) continue;
    if (["productsOrServices", "targetCustomers", "salesChannels", "equipment", "inventory", "legalDocs", "risks"].includes(String(key))) {
      (memory as Record<string, unknown>)[key] = asStringArray(value);
    } else if (["averageTicket", "monthlyRevenue", "monthlyCosts", "monthlyVolume", "ownContribution", "fundingNeed"].includes(String(key))) {
      (memory as Record<string, unknown>)[key] = asNumber(value) ?? normalizeValue(value);
    } else {
      (memory as Record<string, unknown>)[key] = normalizeValue(value);
    }
  }

  return memory;
}

function hasMemoryValue(memory: AnswerMemory, key: keyof AnswerMemory): boolean {
  return isPresent(memory[key]);
}

export function canonicalQuestionKey(questionKey: string): keyof AnswerMemory | undefined {
  if (questionToMemoryKey[questionKey]) return questionToMemoryKey[questionKey];
  for (const [memoryKey, aliases] of Object.entries(answerAliases)) {
    if (aliases.includes(questionKey)) return memoryKey as keyof AnswerMemory;
  }
  return undefined;
}

export function isQuestionAlreadyAnswered(
  questionKey: string,
  memory: AnswerMemory,
  aliases: Record<string, string[]> = answerAliases
): boolean {
  const canonical = canonicalQuestionKey(questionKey) ?? (questionKey in memory ? questionKey as keyof AnswerMemory : undefined);
  if (canonical && hasMemoryValue(memory, canonical)) return true;
  const semanticAliases = aliases[questionKey] ?? [];
  return semanticAliases.some((alias) => {
    const aliasCanonical = canonicalQuestionKey(alias) ?? (alias in memory ? alias as keyof AnswerMemory : undefined);
    return aliasCanonical ? hasMemoryValue(memory, aliasCanonical) : false;
  });
}

function pushMissing(target: MissingInput[], memory: AnswerMemory, key: keyof AnswerMemory, missing: MissingInput) {
  if (!hasMemoryValue(memory, key)) target.push(missing);
}

export function detectMissingAnalysisInputs(profile: BusinessProfile, memory: AnswerMemory): MissingInput[] {
  const gaps: MissingInput[] = [];

  pushMissing(gaps, memory, "businessIdea", {
    key: "businessIdea",
    severity: "critical",
    reason: "Нужно понимать суть бизнеса, чтобы классифицировать модель и собрать релевантный отчёт.",
    relatedReportSection: "market"
  });
  pushMissing(gaps, memory, "targetCustomers", {
    key: "targetCustomers",
    severity: "important",
    reason: "Без сегментов клиентов отчёт будет слишком общим по спросу и каналам продаж.",
    relatedReportSection: "market"
  });
  pushMissing(gaps, memory, "monthlyVolume", {
    key: "monthlyVolume",
    severity: "critical",
    reason: "Нужен плановый объём продаж, заказов или выпуска для расчёта выручки.",
    relatedReportSection: "financial_model"
  });
  pushMissing(gaps, memory, "averageTicket", {
    key: "averageTicket",
    severity: "critical",
    reason: "Средний чек или цена единицы нужны для финансовой модели.",
    relatedReportSection: "financial_model"
  });
  pushMissing(gaps, memory, "ownContribution", {
    key: "ownContribution",
    severity: "critical",
    reason: "Собственный вклад нужен для оценки потребности во внешнем финансировании.",
    relatedReportSection: "bank_readiness"
  });

  if (profile.hasPremises || profile.hasWalkInTraffic || profile.hasCustomerFlowDependency) {
    pushMissing(gaps, memory, "premises", {
      key: "premises",
      severity: "important",
      reason: "Локация, аренда или зона обслуживания влияют на спрос, CapEx, Opex и риски.",
      relatedReportSection: "operations"
    });
  }
  if (profile.hasEquipment) {
    pushMissing(gaps, memory, "equipment", {
      key: "equipment",
      severity: "important",
      reason: "Оборудование влияет на CapEx, мощность, простой и банковскую готовность.",
      relatedReportSection: "operations"
    });
  }
  if (profile.hasInventory || profile.sellsGoods || profile.producesGoods) {
    pushMissing(gaps, memory, "suppliers", {
      key: "suppliers",
      severity: "important",
      reason: "Поставщики, закупки и условия оплаты влияют на себестоимость и оборотный капитал.",
      relatedReportSection: "financial_model"
    });
  }
  if (profile.providesServices && !profile.producesGoods) {
    pushMissing(gaps, memory, "serviceFlow", {
      key: "serviceFlow",
      severity: "important",
      reason: "Процесс оказания услуги нужен для оценки качества, сроков и претензий.",
      relatedReportSection: "operations"
    });
  }
  if (profile.producesGoods) {
    pushMissing(gaps, memory, "productionCapacity", {
      key: "productionCapacity",
      severity: "important",
      reason: "Производственная мощность и потери нужны для оценки выпуска, маржи и брака.",
      relatedReportSection: "operations"
    });
  }
  if (profile.hasStaff) {
    pushMissing(gaps, memory, "team", {
      key: "team",
      severity: "important",
      reason: "Команда и зарплаты нужны для Opex, мощности и операционных рисков.",
      relatedReportSection: "financial_model"
    });
  }
  if (profile.hasRegulatedActivity || profile.hasSanitaryRequirements || profile.hasLicensingOrPermits) {
    pushMissing(gaps, memory, profile.hasSanitaryRequirements ? "sanitaryCompliance" : "legalDocs", {
      key: profile.hasSanitaryRequirements ? "sanitaryCompliance" : "legalDocs",
      severity: "important",
      reason: "Документы, разрешения и санитарные требования влияют на запуск и compliance-риск.",
      relatedReportSection: "documents"
    });
  }
  if (profile.hasHighWorkingCapitalNeed || profile.hasInventory || profile.sellsGoods) {
    pushMissing(gaps, memory, "workingCapital", {
      key: "workingCapital",
      severity: "optional",
      reason: "Оборотный капитал уточняет закупки, аренду, зарплаты и запас прочности.",
      relatedReportSection: "financial_model"
    });
  }
  if (profile.hasB2BContracts || profile.capabilities?.hasB2BClients) {
    pushMissing(gaps, memory, "b2bContracts", {
      key: "b2bContracts",
      severity: "important",
      reason: "B2B-договоры, акты и условия оплаты влияют на спрос, дебиторку и банк-readiness.",
      relatedReportSection: "bank_readiness"
    });
  }
  pushMissing(gaps, memory, "returnsPolicy", {
    key: "returnsPolicy",
    severity: "optional",
    reason: "Гарантии, возвраты и претензии уточняют операционные и юридические риски.",
    relatedReportSection: "risks"
  });

  const severityRank = { critical: 0, important: 1, optional: 2 } as const;
  return gaps.sort((left, right) => severityRank[left.severity] - severityRank[right.severity]);
}
