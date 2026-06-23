export type RiskLevel = "low" | "medium" | "high";
export type RiskCategory =
  | "market"
  | "financial"
  | "operational"
  | "legal"
  | "compliance"
  | "infrastructure"
  | "bankability"
  | "environmental"
  | "currency"
  | "supplier"
  | "staff"
  | "technology"
  | "seasonality";
export type CurrencyCode = "UZS" | "USD" | "EUR" | "CNY" | "RUB" | string;
export type CreditNeeded = "yes" | "no" | "unknown" | string;
export type Locale = "ru" | "uz" | "en";
export type DataSourceKind =
  | "user_input"
  | "assumption"
  | "estimated"
  | "external_source"
  | "calculated";

export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "boolean"
  | "staffPlan";

export type ExchangeRateSnapshot = {
  sourceCurrency: "USD";
  targetCurrency: "UZS";
  rate: number;
  requestedDate: string;
  rateDate: string;
  source: "CBU";
  sourceUrl: string;
  fetchedAt: string;
  cached?: boolean;
  currency?: "USD";
  date?: string;
};

export type MoneyValueSnapshot = {
  sourceAmount: number;
  sourceCurrency: CurrencyCode;
  amountUZS: number;
  exchangeRateSnapshot?: ExchangeRateSnapshot;
};

export type StaffPlanRole = {
  id?: string;
  role: string;
  count: number;
  monthlySalaryAmount: number;
  monthlySalaryCurrency: CurrencyCode | string;
  monthlySalaryUZS?: number;
};

export type StaffPlan = {
  roles: StaffPlanRole[];
  exchangeRateSnapshot?: ExchangeRateSnapshot;
};

export type QuestionShowIfOperator = "equals" | "not_equals" | "includes" | "not_includes";

export type QuestionShowIfCondition = {
  field: string;
  operator?: QuestionShowIfOperator;
  value?: string | string[] | boolean | number | null;
};

export type QuestionShowIf =
  | QuestionShowIfCondition
  | QuestionShowIfCondition[]
  | Partial<Record<string, unknown | unknown[]>>;

export type InterviewQuestion = {
  key: string;
  label: string;
  question: string;
  type: QuestionType;
  unit?: string | null;
  options?: string[];
  helpText?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  isRequired?: boolean;
  visible?: boolean;
  showIf?: QuestionShowIf;
  optionShowIf?: Record<string, QuestionShowIf>;
  semanticGroup?: string;
  blockId?: string;
  affects?: string[];
  source?: string;
  localizedCopy?: Partial<Record<Locale, { label?: string; question?: string; helpText?: string; placeholder?: string; unit?: string }>>;
  capabilityTags?: string[];
};

export type InterviewBlockReviewStatus = {
  blockId: string;
  status: "ok" | "needs_review";
  reason?: string;
};

export type InterviewBlock = {
  id: string;
  name: string;
  description: string;
  questions: InterviewQuestion[];
};

export type InterviewPlanBlock = {
  blockId: string;
  generatedBy: "ai" | "fallback" | "template";
  generatedAt: string;
  questions: InterviewQuestion[];
  requiredQuestionKeys: string[];
  optionalQuestionKeys: string[];
};

export type InterviewPlan = {
  version: "1.0";
  generatedAt: string;
  templateSignature?: string;
  businessCategory?: string;
  businessSubcategory?: string;
  operationalModel?: string;
  blocks: Record<string, InterviewPlanBlock>;
};

export type SectionNotes = {
  businessIdea?: string;
  premisesInfrastructure?: string;
  equipment?: string;
  productionCapacity?: string;
  rawMaterials?: string;
  salesMarketing?: string;
  finance?: string;
  complianceExperience?: string;
};

export type StructuredProjectData = {
  userLanguage?: Locale;
  title?: string;
  sectorCode?: string;
  templateCode?: string;
  businessType?: string;
  region?: string;
  district?: string;
  businessIdea?: string;
  productOrService?: string;
  revenueModel?: string;
  monthlySalesVolume?: number;
  monthlyOrders?: number;
  monthlyClients?: number;
  averageTicket?: number;
  averageServicePrice?: number;
  salesUnitLabel?: string;
  plannedVolumeMonthly?: number;
  plannedMonthlyVolume?: number;
  monthlyPlannedVolume?: number;
  plannedVolumeUnit?: string;
  dailyOrders?: number;
  ordersPerDay?: number;
  salesPerDay?: number;
  workingDaysPerMonth?: number;
  operationalModel?: string;
  grossMarginPct?: number;
  marketingBudget?: number;
  staffSkills?: string;
  hasSeasonality?: boolean;
  seasonality?: string;
  // Dynamic AI-driven interview fields used by sector-specific templates.
  cleaningServiceTypes?: string[];
  cleaningBusinessModel?: string;
  serviceArea?: string;
  hasInitialClients?: boolean | string;
  brandOrPartnerModel?: string;
  b2bAgreements?: boolean | string;
  contractModel?: string;
  prepaymentRequired?: boolean | string;
  transportNeeds?: string;
  serviceZone?: string;
  teamTransportModel?: string;
  cleaningChemicals?: string | string[];
  chemicalStorageSafety?: string;
  teamSizePerOrder?: number;
  supervisorNeeded?: boolean | string;
  dailyOrdersCapacity?: number;
  averageCleaningTicket?: number;
  averageCleaningAreaSqm?: number;
  firstMonthOrdersPerDay?: number;
  stableOrdersPerDay?: number;
  costPerOrder?: number;
  workCompletionActs?: boolean | string;
  liabilityInsurance?: boolean | string;
  employeeFormalization?: string;
  serviceCategories?: string[];
  dailyServiceCapacity?: number;
  averageServiceTicket?: number;
  bookingOrWalkInModel?: string;
  serviceQualityControl?: string;
  chairsOrWorkstations?: number;
  autoServiceFormat?: string;
  parentAutoServiceName?: string;
  boxLeaseModel?: string;
  boxLeaseTerms?: string;
  leaseTermMonths?: number;
  leaseRenewalOption?: boolean;
  subleaseAllowed?: boolean;
  terminationNoticeDays?: number;
  boxAreaSqm?: number;
  carsServedAtOnce?: number;
  workingHoursPerDay?: number;
  averageServiceDurationMinutes?: number;
  includedInfrastructure?: string;
  liftIncluded?: boolean;
  compressorIncluded?: boolean;
  ventilationReady?: boolean;
  waterDrainageReady?: boolean;
  signageAllowed?: boolean;
  servicePositioning?: string;
  capacityBottleneck?: string;
  firstMonthCarsPerDay?: number;
  stableCarsPerDay?: number;
  customerAcquisitionChannels?: string[];
  parentServiceCustomerFlow?: string;
  clientPaymentFlow?: string;
  parentServiceCommissionPct?: number;
  paymentSettlementTerms?: string;
  partsResalePlanned?: boolean;
  partsMarginPct?: number;
  equipmentOwnership?: string;
  equipmentServiceSupport?: string;
  consumables?: string;
  consumablesSource?: string;
  importedPartsSharePct?: number;
  supplierPaymentTerms?: string;
  wasteOilHandling?: string;
  wasteOilHandlingPlan?: string;
  vehicleModificationServices?: boolean;
  gasEquipmentInstallation?: boolean;
  paintingOrBodywork?: boolean;
  hazardousWasteHandlingKnown?: boolean;
  warrantyPolicy?: string;
  rentalToolCategories?: string[];
  rentalEquipmentList?: string;
  rentalTargetCustomers?: string[];
  rentalPremisesStatus?: string;
  rentalInfrastructureReady?: boolean;
  rentalClientContracts?: boolean;
  rentalPaymentFlow?: string;
  rentalRequiredDocuments?: string;
  rentalDamageLiability?: string;
  rentalFleetSize?: number;
  rentalPricingModel?: string;
  averageRentalTicket?: number;
  rentalOrdersPerMonth?: number;
  depositPolicy?: string;
  deliveryModel?: string;
  toolTrackingSystem?: string;
  handoverInspectionProcess?: string;
  toolMaintenancePlan?: string;
  maintenanceCostPct?: number;
  clientSafetyInstructions?: string;
  damageLossPolicy?: string;
  handoverActRequired?: boolean;
  carWashFormat?: string;
  carWashPositioning?: string;
  washServiceTypes?: string[];
  customerFlowModel?: string;
  locationTraffic?: string;
  waterSource?: string;
  wastewaterHandling?: string;
  powerSupplyReady?: boolean;
  landlordRestrictions?: string;
  washBaysCount?: number;
  carsPerDayStart?: number;
  carsPerDayStable?: number;
  carWashEquipment?: string[];
  washChemicals?: string[];
  chemicalsSource?: string;
  b2bFleetAgreements?: boolean;
  pricingModel?: string;
  averageWashTicket?: number;
  repeatOrdersPct?: number;
  teamSizePerShift?: number;
  workingSchedule?: string;
  administratorNeeded?: boolean;
  staffTrainingSafety?: boolean;
  businessLegalForm?: string;
  clientContracts?: boolean;
  cashRegisterNeeded?: boolean;
  chemicalSafetyRules?: boolean;
  damageLiability?: string;
  wasteByproducts?: string;
  equipmentList?: string;
  trailerLocationType?: string;
  locationPermitStatus?: string;
  iceCreamEquipment?: string | string[];
  iceCreamSupplierType?: string;
  rawMaterials?: string;
  productionStages?: string;
  monthlyOutputCapacity?: number;
  storageNeeds?: string;
  energyNeeds?: string;
  productCategories?: string[];
  targetCustomerSegments?: string[];
  salesChannels?: string[];
  initialInventoryCostUZS?: number;
  averagePurchaseCost?: number;
  purchasePricesDetail?: string;
  averageMarkupPct?: number;
  inventoryTurnoverDays?: number;
  seasonalCollections?: boolean | string;
  supplierLocation?: string;
  returnsExchangePolicy?: string;
  storageModel?: string;
  locationCostStatus?: string;
  inventoryTurnover?: number;
  purchasePrices?: string;
  marginPct?: number;
  traffic?: number;
  conversion?: number;
  returnsPct?: number;
  salesPlatform?: string | string[];
  marketplaces?: string[];
  cac?: number;
  delivery?: string;
  fulfillment?: string;
  orderProcessingPlan?: string;
  adBudget?: number;
  format?: string;
  menuCategories?: string[];
  seatingCapacity?: number;
  kitchenEquipment?: string;
  bakeryProductionSchedule?: string;
  ingredientSupplyPlan?: string;
  dailyWastePct?: number;
  foodWastePct?: number;
  wasteSpoilagePct?: number;
  sanitaryProductionFlow?: string;
  kitchenEquipmentMaintenance?: string;
  peakHoursPlan?: string;
  dailyCovers?: number;
  foodCostPct?: number;
  costPerCheck?: number;
  laborCostPct?: number;
  deliveryChannels?: string[];
  sanitaryPermits?: string;
  landOrGreenhouse?: string;
  area?: number;
  cropOrLivestock?: string;
  yield?: number;
  water?: string;
  energy?: string;
  seedsFeed?: string;
  storage?: string;
  climateRisks?: string;
  importCountry?: string;
  supplierCurrency?: CurrencyCode | string;
  supplier?: string;
  incoterms?: string;
  customsBroker?: string;
  customsDuties?: number;
  certificates?: string;
  deliveryTime?: string;
  prepaymentPct?: number;
  transportType?: string;
  routes?: string;
  fleet?: string;
  vehicleLease?: string;
  fuel?: string;
  drivers?: string;
  insurance?: string;
  b2bContracts?: string;
  loadFactor?: number;
  tariff?: number;
  program?: string;
  teachers?: string;
  studentsCount?: number;
  schedule?: string;
  retention?: number;
  serviceType?: string;
  licensedActivity?: string;
  doctors?: string;
  medicalEquipment?: string;
  medicalWaste?: string;
  patients?: number;
  requiredPermits?: string;
  productionType?: string;
  toyType?: string;
  priceSegment?: string;
  productExamples?: string;
  designModel?: string;
  brandedPackaging?: boolean;
  ageGroup?: string;
  premisesStatus?: string;
  premisesAreaSqm?: number;
  infrastructureReady?: boolean;
  equipmentCondition?: string;
  supplierSelected?: boolean;
  supplierOfferAvailable?: boolean;
  equipmentDeliveryMonths?: number;
  serviceSupportUzbekistan?: boolean;
  staffTrainingNeeded?: boolean;
  monthlyCapacity?: number;
  skuCount?: number;
  shiftsPerDay?: number;
  employeesCount?: number;
  defectRatePct?: number;
  qualityControlPlan?: boolean | string;
  repeatCustomersPlan?: string;
  serviceTerms?: string;
  averagePrice?: number;
  targetCustomers?: string[];
  rawMaterialSource?: string;
  suppliersAvailable?: boolean;
  firstMonthRawMaterialStockUZS?: number;
  foreignCurrencyPurchases?: boolean;
  alternativeSuppliers?: boolean;
  hasBuyerAgreements?: boolean;
  clientPaymentTerm?: string;
  seasonalDemand?: boolean;
  firstThreeMonthsMonthlyRevenue?: number;
  stableMonthlyRevenue?: number;
  certificationAwareness?: string;
  packagingLabelingPlan?: boolean;
  sanitaryRequirementsKnown?: boolean;
  hasAccountantOrConsultant?: boolean;
  staffPlan?: StaffPlan;
  exchangeRateSnapshot?: ExchangeRateSnapshot;
  moneyValues?: Record<string, MoneyValueSnapshot>;
  businessProfile?: {
    category?:
      | "food_service"
      | "manufacturing"
      | "retail"
      | "services"
      | "agriculture"
      | "ecommerce"
      | "education"
      | "healthcare"
      | "logistics"
      | "transport"
      | "construction"
      | "real_estate"
      | "beauty_wellness"
      | "tourism_hospitality"
      | "professional_services"
      | "it_digital"
      | "financial_services"
      | "entertainment"
      | "energy"
      | "mining"
      | "recycling_waste"
      | "import_export"
      | "b2b_services"
      | "other"
      | "generic";
    confidence?: number;
    relevantFocusAreas?: string[];
    businessCategory?: string;
    businessSubcategory?: string;
    subcategory?: string;
    revenueModel?: string;
    operationalModel?: string;
    sellsGoods?: boolean;
    providesServices?: boolean;
    producesGoods?: boolean;
    importsGoodsOrInputs?: boolean;
    exportsGoodsOrServices?: boolean;
    hasInventory?: boolean;
    hasEquipment?: boolean;
    hasPremises?: boolean;
    hasStaff?: boolean;
    hasLicensing?: boolean;
    hasLicensingOrPermits?: boolean;
    hasSanitaryRequirements?: boolean;
    hasEnvironmentalRisk?: boolean;
    hasSafetyRisk?: boolean;
    hasSeasonality?: boolean;
    hasHighWorkingCapitalNeed?: boolean;
    hasCustomerFlowDependency?: boolean;
    capabilities?: {
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
    };
    hasB2BContracts?: boolean;
    hasWalkInTraffic?: boolean;
    hasRegulatedActivity?: boolean;
    hasCurrencyExposure?: boolean;
    hasCreditOrLeasingNeed?: boolean;
    salesChannels?: string[];
    relevantInterviewBlocks?: string[];
    excludedInterviewBlocks?: string[];
    requiredDataForAnalysis?: string[];
    keyCostDrivers?: string[];
    keyRevenueDrivers?: string[];
    keyRisks?: string[];
    recommendedSourceCategories?: string[];
    recommendedInterviewBlocks?: string[];
  };
  ownContribution?: number;
  ownContributionAmount?: number;
  ownContributionCurrency?: CurrencyCode | string;
  ownContributionUZS?: number;
  exchangeRateUZSPerUSD?: number;
  creditNeeded?: CreditNeeded;
  requestedLoanAmount?: number;
  requestedLoanCurrency?: CurrencyCode | string;
  requestedLoanUZS?: number;
  loanPurpose?: string;
  loanTermMonths?: number;
  loanAnnualRatePct?: number;
  loanGracePeriodMonths?: number;
  loanRepaymentType?: "annuity" | "equal_principal";
  requestedLeasingAmount?: number;
  requestedLeasingCurrency?: CurrencyCode | string;
  requestedLeasingUZS?: number;
  leasingItem?: string;
  leasingAssetType?: string;
  leasingAssetCost?: number;
  leasingAdvancePayment?: number;
  leasingTermMonths?: number;
  leasingAnnualRatePct?: number;
  leasingMonthlyPayment?: number;
  leasingResidualValue?: number;
  leasingSupplier?: string;
  leasingOfferAvailable?: boolean;
  leasingCollateralByAsset?: boolean;
  additionalLeasingCollateralNeeded?: boolean;
  leasingOwnershipUntilBuyout?: string;
  leasingDocuments?: string;
  leasingAssetRevenueImpact?: string;
  leasingDeliveryInstallationIncluded?: boolean;
  needsLeasing?: boolean;
  workingCapitalCreditNeeded?: boolean;
  calculatedExpenses?: string;
  contingencyReserveAvailable?: boolean;
  collateralAvailable?: boolean;
  collateralType?: string;
  collateralYear?: number;
  collateralCondition?: string;
  collateralEstimatedValue?: number;
  collateralDocumentsAvailable?: boolean;
  experienceLevel?: string;
  plannedStartPeriod?: string;
  moldRequired?: boolean;
  workingCapitalNeeded?: boolean;
  hasOperatingBusiness?: boolean;
  consultantNeeded?: boolean;
  sectionNotes?: SectionNotes;
  otherDetails?: Record<string, string>;
  preferredRevenueSource?: "calculated" | "stable";
  utilizationRatePct?: number;
  rawMaterialCostPerUnit?: number;
  packagingCostPerUnit?: number;
  directLogisticsCostPerUnit?: number;
  marketplaceCommissionPerUnit?: number;
  otherVariableCostPerUnit?: number;
  wasteAllowancePct?: number;
  monthlyRent?: number;
  monthlyUtilities?: number;
  monthlyMarketing?: number;
  monthlyMaintenance?: number;
  monthlyTaxes?: number;
  monthlyLogistics?: number;
  monthlySoftware?: number;
  monthlyInsurance?: number;
  monthlyAccounting?: number;
  monthlyOtherOpex?: number;
  equipmentCapex?: number;
  premisesSetupCapex?: number;
  furnitureFixturesCapex?: number;
  itPosWebsiteCapex?: number;
  registrationCertificationCapex?: number;
  initialInventoryCapex?: number;
  workingCapitalInventoryBufferUZS?: number;
  deliveryInstallationCapex?: number;
  trainingLaunchCapex?: number;
  capexReserve?: number;
  otherCapex?: number;
  workingCapitalBufferMonths?: number;
  accountsReceivableBufferUZS?: number;
  accountsPayableBufferUZS?: number;
  seasonalStockBufferUZS?: number;
  approvedLoanAmount?: number;
  approvedLoanCurrency?: CurrencyCode;
  approvedLeasingAmount?: number;
  approvedLeasingCurrency?: CurrencyCode;
  grants?: number;
  otherFunding?: number;
  interviewCursorBlockId?: string;
  interviewPlan?: InterviewPlan;
  completedBlockIds?: string[];
  blockReviewStatuses?: InterviewBlockReviewStatus[];
  aiReport?: import("../report/aiReportGenerator.ts").AIGeneratedReport | null;
  webResearchData?: import("../market/webResearchService.ts").WebResearchResult | null;
};

export type SectorAssumptions = {
  minViableInvestmentUZS: number;
  recommendedOwnContributionMinPct: number;
  recommendedOwnContributionMaxPct: number;
  typicalGrossMarginMinPct: number;
  typicalGrossMarginMaxPct: number;
  defaultGrossMarginPct: number;
  defaultMonthlyFixedCostsUZS: number;
  defaultVariableCostPct: number;
  defaultLoanAnnualRatePct: number;
  defaultLeasingAnnualRatePct: number;
  defaultLoanTermMonths: number;
  defaultLeasingTermMonths: number;
  defaultWorkingCapitalMonths: number;
  defaultCertificationCostUZS: number;
  defaultMoldCostUZS: number;
  defaultEquipmentCostUZS: number;
  defaultPremisesSetupCostUZS: number;
  defaultPackagingSetupCostUZS: number;
  defaultInitialInventoryCostUZS: number;
  defaultExpectedUtilizationPct: number;
};

export type FinancialResult = {
  warnings: Array<{
    code: string;
    severity?: "low" | "medium" | "high";
    title?: string;
    message: string;
    messageKey?: string;
    calculationPolicy?: "structured_fields_used" | "free_text_fallback_used" | "assumption_used";
    values?: Record<string, string | number>;
  }>;
  formulaRows: Array<{
    indicator: string;
    formula: string;
    substitution: string;
    result: string;
    source: DataSourceKind;
  }>;
  capex: {
    equipmentCost: number;
    moldCost: number;
    premisesSetupCost: number;
    packagingSetupCost: number;
    certificationCost: number;
    initialInventoryCost: number;
    reserveCost: number;
    furnitureFixturesCapex: number;
    itPosWebsiteCapex: number;
    deliveryInstallationCapex: number;
    trainingLaunchCapex: number;
    otherCapex: number;
    totalCapEx: number;
    lineItems: Array<{
      key: string;
      label: string;
      amount: number;
      source: DataSourceKind;
    }>;
  };
  workingCapital: {
    monthlyFixedCosts: number;
    baseMonthlyFixedCosts: number;
    totalMonthlyPayrollUZS: number;
    workingCapitalMonths: number;
    bufferMonths: number;
    initialInventory: number;
    accountsReceivableBuffer: number;
    accountsPayableBuffer: number;
    seasonalStockBuffer: number;
    requiredWorkingCapital: number;
    formula: string;
  };
  revenue: {
    monthlyCapacity: number;
    effectiveUnits: number;
    volumeLabel?: string;
    unitLabel?: string;
    /** User-facing entered volume. For daily inputs this stays daily, while monthlyCapacity stores the calculated monthly equivalent. */
    displayVolume?: number;
    displayVolumeLabel?: string;
    displayVolumeUnitLabel?: string;
    displayVolumeSource?: "user_input" | "calculated";
    displayVolumeMonthlyEquivalent?: number;
    workingDaysForDisplay?: number;
    conversionPct?: number;
    conversionSourceKey?: string;
    conversionApplied?: boolean;
    trafficPerDay?: number;
    trafficUnitLabel?: string;
    monthlySales?: number;
    monthlySalesUnitLabel?: string;
    averagePrice: number;
    expectedUtilizationPct: number;
    calculatedMonthlyRevenue: number;
    stableMonthlyRevenue?: number;
    revenueSource: "calculated" | "stable";
    monthlyRevenue: number;
    annualRevenue: number;
  };
  cogs: {
    rawMaterialCostPerUnit: number;
    packagingCostPerUnit: number;
    directLogisticsCostPerUnit: number;
    marketplaceCommissionPerUnit: number;
    otherVariableCostPerUnit: number;
    wasteAllowancePct: number;
    unitCOGS: number;
    wasteAdjustedUnitCOGS: number;
    monthlyCOGS: number;
    source: DataSourceKind;
    calculationMode?: "unit_cost" | "percent_of_revenue" | "cost_per_check";
    foodCostPct?: number;
  };
  opex: {
    monthlyPayroll: number;
    monthlyRent: number;
    monthlyUtilities: number;
    monthlyMarketing: number;
    monthlyMaintenance: number;
    monthlyTaxes: number;
    monthlyLogistics: number;
    monthlySoftware: number;
    monthlyInsurance: number;
    monthlyAccounting: number;
    monthlyOtherOpex: number;
    monthlyFixedOpex: number;
    lineItems: Array<{
      key: string;
      label: string;
      amount: number;
      source: DataSourceKind;
    }>;
  };
  profitability: {
    grossMarginPct: number;
    monthlyGrossProfit: number;
    monthlyEBITDA: number;
    ebitdaMarginPct: number;
    contributionMarginPerUnit: number;
    breakEvenUnits: number | null;
    breakEvenRevenue: number | null;
    monthlyNetCashFlow: number;
    paybackMonths: number | null;
  };
  payroll: {
    roles: StaffPlanRole[];
    totalMonthlyPayrollUZS: number;
    exchangeRateSnapshot?: ExchangeRateSnapshot;
  };
  financing: {
    creditNeeded: CreditNeeded;
    ownContributionAmount: number;
    ownContributionCurrency: CurrencyCode;
    ownContributionUZS: number;
    ownContribution: number;
    ownContributionPct: number;
    exchangeRateUZSPerUSD: number;
    exchangeRateSnapshot?: ExchangeRateSnapshot;
    requestedLoanUZS: number;
    loanRequired: number;
    loanCurrency: CurrencyCode;
    loanPurpose?: string;
    loanTermMonths: number;
    loanAnnualRatePct: number;
    loanAnnualRateSource: DataSourceKind;
    loanGracePeriodMonths: number;
    loanRepaymentType: "annuity" | "equal_principal";
    loanFirstPayment: number;
    loanLastPayment: number;
    loanAveragePayment: number;
    loanMaxPayment: number;
    debtServiceForDscr: number;
    totalLoanInterest: number;
    leasingRequired: number;
    leasingSelected?: boolean;
    leasingTermsIncomplete?: boolean;
    leasingCurrency: CurrencyCode;
    leasingTermMonths: number;
    leasingAnnualRatePct: number;
    leasingAnnualRateSource: DataSourceKind;
    leasingAdvancePayment: number;
    leasingPaymentSource: DataSourceKind;
    estimatedMonthlyLoanPayment: number;
    estimatedMonthlyLeasingPayment: number;
    totalMonthlyDebtService: number;
    totalInvestmentNeed: number;
    availableFunding: number;
    financingGap: number;
    fundingSurplus: number;
    grants: number;
    otherFunding: number;
    dscr: number | null;
    dscrLabel: string;
  };
};

export type RiskItem = {
  id?: string;
  code: string;
  title: string;
  category: RiskCategory;
  probability: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  level: RiskLevel;
  score: number;
  description: string;
  reason: string;
  evidence?: string[];
  sourceIds?: string[];
  missingData?: string[];
  mitigation: string;
  owner?: string;
  timing?: string;
  nextStep?: string;
};

export type AiExtractionResult = {
  mode: "openai" | "fallback";
  detectedSector: string;
  confidence: number;
  extractedFields: StructuredProjectData;
  missingFields: string[];
  nextQuestions: Array<{
    key: string;
    question: string;
    type: QuestionType;
    unit?: string | null;
    options?: string[] | null;
  }>;
  advisorMessage: string;
};
