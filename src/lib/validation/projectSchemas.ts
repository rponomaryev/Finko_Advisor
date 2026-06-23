import { z } from "zod";

const currencySchema = z.enum(["UZS", "USD"]);
const creditNeededSchema = z.enum(["yes", "no", "unknown"]);
const localeSchema = z.enum(["ru", "uz", "en"]);
const boundedText = (min = 0, max = 4000) => z.string().trim().min(min).max(max);
export const answerKeySchema = z.string().min(1).max(160).regex(/^(?!(__proto__|prototype|constructor)$)(?!.*\.(__proto__|prototype|constructor)$)[A-Za-z0-9_.-]+$/);
const sectionNotesSchema = z.object({
  businessIdea: boundedText(0).optional(),
  premisesInfrastructure: boundedText(0).optional(),
  equipment: boundedText(0).optional(),
  productionCapacity: boundedText(0).optional(),
  rawMaterials: boundedText(0).optional(),
  salesMarketing: boundedText(0).optional(),
  finance: boundedText(0).optional(),
  complianceExperience: boundedText(0).optional()
}).partial();

export const exchangeRateSnapshotSchema = z.object({
  sourceCurrency: z.literal("USD").default("USD"),
  targetCurrency: z.literal("UZS").default("UZS"),
  rate: z.coerce.number().positive(),
  requestedDate: z.string().min(4).max(32),
  rateDate: z.string().min(4).max(32),
  source: z.literal("CBU"),
  sourceUrl: z.string().url().max(500),
  fetchedAt: z.string().min(4).max(64),
  cached: z.boolean().optional(),
  currency: z.literal("USD").optional(),
  date: z.string().min(4).max(32).optional()
});

export const moneyValueSnapshotSchema = z.object({
  sourceAmount: z.coerce.number().min(0),
  sourceCurrency: currencySchema,
  amountUZS: z.coerce.number().min(0),
  exchangeRateSnapshot: exchangeRateSnapshotSchema.optional()
});

export const staffPlanRoleSchema = z.object({
  id: z.string().optional(),
  role: boundedText(1, 120),
  count: z.coerce.number().int().min(1).max(500),
  monthlySalaryAmount: z.coerce.number().min(0).max(1_000_000_000),
  monthlySalaryCurrency: currencySchema,
  monthlySalaryUZS: z.coerce.number().min(0).optional()
});

export const staffPlanSchema = z.object({
  roles: z.array(staffPlanRoleSchema).max(30).default([]),
  exchangeRateSnapshot: exchangeRateSnapshotSchema.optional()
});


export const interviewQuestionSchema = z.object({
  key: z.string().min(1).max(160),
  label: z.string().min(1).max(500),
  question: z.string().min(1).max(2000),
  type: z.enum(["text", "textarea", "number", "select", "multiselect", "boolean", "staffPlan"]),
  unit: z.string().max(80).nullable().optional(),
  options: z.array(z.string().max(500)).max(100).optional(),
  helpText: z.string().max(2000).optional(),
  placeholder: z.string().max(1000).optional(),
  optional: z.boolean().optional(),
  showIf: z.record(z.unknown()).optional(),
  semanticGroup: z.string().max(160).optional(),
  blockId: z.string().min(1).max(160).optional(),
  source: z.string().min(1).max(80).optional(),
  affects: z.array(z.string().min(1).max(80)).max(20).optional(),
  capabilityTags: z.array(z.string().min(1).max(160)).max(30).optional()
});

export const persistedInterviewPlanBlockSchema = z.object({
  blockId: z.string().min(1).max(160),
  generatedBy: z.enum(["ai", "fallback", "template"]),
  generatedAt: z.string().min(4).max(64),
  questions: z.array(interviewQuestionSchema).min(1).max(100),
  requiredQuestionKeys: z.array(z.string().min(1).max(160)).max(100),
  optionalQuestionKeys: z.array(z.string().min(1).max(160)).max(100)
});

export const persistedInterviewPlanSchema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string().min(4).max(64),
  templateSignature: z.string().min(1).max(500).optional(),
  businessCategory: z.string().min(1).max(80).optional(),
  businessSubcategory: z.string().min(1).max(120).optional(),
  operationalModel: z.string().min(1).max(120).optional(),
  blocks: z.record(persistedInterviewPlanBlockSchema)
});

export const createProjectSchema = z.object({
  businessType: boundedText(2, 160),
  businessIdea: boundedText(5, 4000),
  region: boundedText(2, 120),
  district: boundedText(0, 120).optional(),
  plannedStartPeriod: boundedText(0, 120).optional(),
  userLanguage: localeSchema.optional(),
  consentGiven: z.literal(true),
  consentLocale: localeSchema.optional(),
  consentVersion: z.string().max(24).optional()
});

export const updateProjectSchema = z.object({
  userLanguage: localeSchema.optional(),
  businessType: boundedText(0, 160).optional(),
  businessIdea: boundedText(0, 4000).optional(),
  region: boundedText(0, 120).optional(),
  district: boundedText(0, 120).optional(),
  plannedStartPeriod: boundedText(0, 120).optional(),
  productOrService: boundedText(0, 240).optional(),
  monthlySalesVolume: z.coerce.number().positive().optional(),
  monthlyOrders: z.coerce.number().positive().optional(),
  monthlyClients: z.coerce.number().positive().optional(),
  averageTicket: z.coerce.number().positive().optional(),
  averageServicePrice: z.coerce.number().positive().optional(),
  salesUnitLabel: boundedText(0, 80).optional(),
  requiredPermits: boundedText(0).optional(),
  productionType: boundedText(0, 120).optional(),
  toyType: boundedText(0, 120).optional(),
  priceSegment: boundedText(0, 120).optional(),
  premisesStatus: boundedText(0, 120).optional(),
  equipmentCondition: boundedText(0, 120).optional(),
  monthlyCapacity: z.coerce.number().positive().optional(),
  averagePrice: z.coerce.number().positive().optional(),
  targetCustomers: z.array(z.string().max(120)).max(30).optional(),
  customerAcquisitionChannels: z.array(z.string().max(120)).max(30).optional(),
  salesChannels: z.array(z.string().max(120)).max(30).optional(),
  productCategories: z.array(z.string().max(120)).max(50).optional(),
  skuCount: z.coerce.number().min(0).optional(),
  salesPlatform: z.union([boundedText(0, 120), z.array(z.string().max(120)).max(20)]).optional(),
  marketplaces: z.array(z.string().max(120)).max(20).optional(),
  rawMaterialSource: boundedText(0, 120).optional(),
  certificationAwareness: boundedText(0, 120).optional(),
  supplierSelected: z.boolean().optional(),
  ownContribution: z.coerce.number().min(0).optional(),
  ownContributionAmount: z.coerce.number().min(0).optional(),
  ownContributionCurrency: currencySchema.optional(),
  ownContributionUZS: z.coerce.number().min(0).optional(),
  exchangeRateUZSPerUSD: z.coerce.number().positive().optional(),
  creditNeeded: creditNeededSchema.optional(),
  requestedLoanAmount: z.coerce.number().min(0).optional(),
  requestedLoanCurrency: currencySchema.optional(),
  requestedLoanUZS: z.coerce.number().min(0).optional(),
  loanPurpose: boundedText(0, 1000).optional(),
  loanTermMonths: z.coerce.number().int().positive().optional(),
  loanAnnualRatePct: z.coerce.number().min(0).max(100).optional(),
  loanGracePeriodMonths: z.coerce.number().int().min(0).optional(),
  loanRepaymentType: z.enum(["annuity", "equal_principal"]).optional(),
  requestedLeasingAmount: z.coerce.number().min(0).optional(),
  requestedLeasingCurrency: currencySchema.optional(),
  requestedLeasingUZS: z.coerce.number().min(0).optional(),
  needsLeasing: z.boolean().optional(),
  leasingItem: boundedText(0, 240).optional(),
  leasingAdvancePayment: z.coerce.number().min(0).optional(),
  leasingTermMonths: z.coerce.number().int().positive().optional(),
  leasingAnnualRatePct: z.coerce.number().min(0).max(100).optional(),
  leasingMonthlyPayment: z.coerce.number().min(0).optional(),
  leasingSupplier: boundedText(0, 240).optional(),
  storageModel: boundedText(0, 2000).optional(),
  fulfillment: boundedText(0, 120).optional(),
  orderProcessingPlan: boundedText(0, 2000).optional(),
  returnsExchangePolicy: boundedText(0, 2000).optional(),
  leasingOfferAvailable: z.boolean().optional(),
  leasingDeliveryInstallationIncluded: z.boolean().optional(),
  collateralAvailable: z.boolean().optional(),
  collateralType: boundedText(0, 240).optional(),
  collateralYear: z.coerce.number().int().min(1900).max(2100).optional(),
  collateralCondition: boundedText(0, 120).optional(),
  collateralEstimatedValue: z.coerce.number().min(0).optional(),
  collateralDocumentsAvailable: z.boolean().optional(),
  experienceLevel: boundedText(0, 120).optional(),
  staffPlan: staffPlanSchema.optional(),
  exchangeRateSnapshot: exchangeRateSnapshotSchema.optional(),
  moneyValues: z.record(moneyValueSnapshotSchema).optional(),
  sectionNotes: sectionNotesSchema.optional(),
  preferredRevenueSource: z.enum(["calculated", "stable"]).optional(),
  utilizationRatePct: z.coerce.number().min(0).max(100).optional(),
  rawMaterialCostPerUnit: z.coerce.number().min(0).optional(),
  initialInventoryCostUZS: z.coerce.number().min(0).optional(),
  averagePurchaseCost: z.coerce.number().min(0).optional(),
  averageMarkupPct: z.coerce.number().min(0).max(1000).optional(),
  returnsPct: z.coerce.number().min(0).max(100).optional(),
  adBudget: z.coerce.number().min(0).optional(),
  purchasePricesDetail: boundedText(0, 2000).optional(),
  packagingCostPerUnit: z.coerce.number().min(0).optional(),
  directLogisticsCostPerUnit: z.coerce.number().min(0).optional(),
  marketplaceCommissionPerUnit: z.coerce.number().min(0).optional(),
  otherVariableCostPerUnit: z.coerce.number().min(0).optional(),
  wasteAllowancePct: z.coerce.number().min(0).max(100).optional(),
  monthlyRent: z.coerce.number().min(0).optional(),
  monthlyUtilities: z.coerce.number().min(0).optional(),
  monthlyMarketing: z.coerce.number().min(0).optional(),
  monthlyMaintenance: z.coerce.number().min(0).optional(),
  monthlyTaxes: z.coerce.number().min(0).optional(),
  monthlyLogistics: z.coerce.number().min(0).optional(),
  monthlySoftware: z.coerce.number().min(0).optional(),
  monthlyInsurance: z.coerce.number().min(0).optional(),
  monthlyAccounting: z.coerce.number().min(0).optional(),
  monthlyOtherOpex: z.coerce.number().min(0).optional(),
  equipmentCapex: z.coerce.number().min(0).optional(),
  premisesSetupCapex: z.coerce.number().min(0).optional(),
  furnitureFixturesCapex: z.coerce.number().min(0).optional(),
  itPosWebsiteCapex: z.coerce.number().min(0).optional(),
  registrationCertificationCapex: z.coerce.number().min(0).optional(),
  initialInventoryCapex: z.coerce.number().min(0).optional(),
  workingCapitalInventoryBufferUZS: z.coerce.number().min(0).optional(),
  deliveryInstallationCapex: z.coerce.number().min(0).optional(),
  trainingLaunchCapex: z.coerce.number().min(0).optional(),
  capexReserve: z.coerce.number().min(0).optional(),
  otherCapex: z.coerce.number().min(0).optional(),
  workingCapitalBufferMonths: z.coerce.number().min(0).optional(),
  accountsReceivableBufferUZS: z.coerce.number().min(0).optional(),
  accountsPayableBufferUZS: z.coerce.number().min(0).optional(),
  seasonalStockBufferUZS: z.coerce.number().min(0).optional(),
  grants: z.coerce.number().min(0).optional(),
  otherFunding: z.coerce.number().min(0).optional()
});

const answerValueSchema = z.union([
  z.string().max(8000),
  z.number(),
  z.boolean(),
  z.array(z.string().max(1000)).max(50),
  moneyValueSnapshotSchema.extend({ __money: z.literal(true).optional() }),
  staffPlanSchema
]);

export const answerSchema = z.object({
  projectId: z.string().optional(),
  blockId: z.string().optional(),
  message: z.string().min(1).max(12_000),
  autoSave: z.boolean().optional(),
  advance: z.boolean().optional(),
  answers: z
    .array(
      z.object({
        key: answerKeySchema,
        question: z.string().max(2000),
        answer: answerValueSchema,
        answerType: z.string().optional()
      })
    )
    .max(50)
    .optional()
});

export const financialInputSchema = z.object({
  monthlyCapacity: z.coerce.number().positive(),
  averagePrice: z.coerce.number().positive(),
  ownContributionAmount: z.coerce.number().min(0),
  ownContributionCurrency: currencySchema,
  creditNeeded: creditNeededSchema,
  requestedLoanAmount: z.coerce.number().min(0).optional(),
  requestedLoanCurrency: currencySchema.optional(),
  requestedLeasingAmount: z.coerce.number().min(0).optional(),
  requestedLeasingCurrency: currencySchema.optional(),
  loanAnnualRatePct: z.coerce.number().min(0).max(100).optional(),
  leasingAnnualRatePct: z.coerce.number().min(0).max(100).optional()
});

export const sectorAssumptionsSchema = z.object({
  minViableInvestmentUZS: z.coerce.number().positive(),
  recommendedOwnContributionMinPct: z.coerce.number().min(0).max(100),
  recommendedOwnContributionMaxPct: z.coerce.number().min(0).max(100),
  typicalGrossMarginMinPct: z.coerce.number().min(0).max(100),
  typicalGrossMarginMaxPct: z.coerce.number().min(0).max(100),
  defaultGrossMarginPct: z.coerce.number().min(0).max(100),
  defaultMonthlyFixedCostsUZS: z.coerce.number().min(0),
  defaultVariableCostPct: z.coerce.number().min(0).max(100),
  defaultLoanAnnualRatePct: z.coerce.number().min(0).max(100),
  defaultLeasingAnnualRatePct: z.coerce.number().min(0).max(100),
  defaultLoanTermMonths: z.coerce.number().int().positive(),
  defaultLeasingTermMonths: z.coerce.number().int().positive(),
  defaultWorkingCapitalMonths: z.coerce.number().int().positive(),
  defaultCertificationCostUZS: z.coerce.number().min(0),
  defaultMoldCostUZS: z.coerce.number().min(0),
  defaultEquipmentCostUZS: z.coerce.number().min(0),
  defaultPremisesSetupCostUZS: z.coerce.number().min(0),
  defaultPackagingSetupCostUZS: z.coerce.number().min(0),
  defaultInitialInventoryCostUZS: z.coerce.number().min(0),
  defaultExpectedUtilizationPct: z.coerce.number().min(0).max(100)
});
