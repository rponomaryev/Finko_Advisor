-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "sectorCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "businessType" TEXT,
    "region" TEXT,
    "district" TEXT,
    "plannedStartPeriod" TEXT,
    "userLanguage" TEXT DEFAULT 'ru',
    "businessIdea" TEXT,
    "productionType" TEXT,
    "toyType" TEXT,
    "premisesStatus" TEXT,
    "equipmentCondition" TEXT,
    "monthlyCapacity" INTEGER,
    "averagePrice" DECIMAL(18,2),
    "targetCustomers" TEXT,
    "rawMaterialSource" TEXT,
    "certificationAwareness" TEXT,
    "supplierSelected" BOOLEAN,
    "ownContribution" DECIMAL(18,2),
    "sectionNotes" JSONB,
    "ownContributionAmount" DECIMAL(18,2),
    "ownContributionCurrency" TEXT,
    "ownContributionUZS" DECIMAL(18,2),
    "exchangeRateUZSPerUSD" DECIMAL(18,6),
    "creditNeeded" TEXT,
    "requestedLoanAmount" DECIMAL(18,2),
    "requestedLoanCurrency" TEXT,
    "requestedLoanUZS" DECIMAL(18,2),
    "loanPurpose" TEXT,
    "loanTermMonths" INTEGER,
    "requestedLeasingAmount" DECIMAL(18,2),
    "collateralAvailable" BOOLEAN,
    "collateralType" TEXT,
    "collateralEstimatedValue" DECIMAL(18,2),
    "experienceLevel" TEXT,
    "aiMode" TEXT,
    "aiExtraction" JSONB,
    "templateData" JSONB,
    "structuredData" JSONB,
    "financialResult" JSONB,
    "riskResult" JSONB,
    "feasibilityScore" DOUBLE PRECISION,
    "bankReadinessScore" DOUBLE PRECISION,
    "reportData" JSONB,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "consentVersion" TEXT DEFAULT '1.0',
    "consentLocale" TEXT,
    "staffPlan" JSONB,
    "businessProfile" JSONB,
    "exchangeRateSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAnswer" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessType" TEXT,
    "requiredInputs" JSONB,
    "assumptions" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "riskRules" JSONB NOT NULL,
    "scoringRules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStaffRole" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "monthlySalaryAmount" DECIMAL(18,2) NOT NULL,
    "monthlySalaryCurrency" TEXT NOT NULL DEFAULT 'UZS',
    "monthlySalaryUZS" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "base" TEXT NOT NULL DEFAULT 'UZS',
    "sourceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "targetCurrency" TEXT NOT NULL DEFAULT 'UZS',
    "rate" DECIMAL(18,6) NOT NULL,
    "requestedDate" TEXT NOT NULL,
    "rateDate" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CBU',
    "sourceUrl" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketDataPoint" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "businessType" TEXT,
    "indicator" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "region" TEXT,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "currency" TEXT,
    "hsCode" TEXT,
    "activityCode" TEXT,
    "tradeType" TEXT,
    "country" TEXT,
    "productCategory" TEXT,
    "valueUsd" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorMapping" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "normalizedSector" TEXT NOT NULL,
    "possibleHsCodesJson" TEXT,
    "possibleActivityJson" TEXT,
    "keywordsJson" TEXT,
    "confidence" TEXT NOT NULL,
    "mappingSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectorMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "Project"("updatedAt");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAnswer_projectId_questionKey_key" ON "ProjectAnswer"("projectId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "SectorTemplate_code_key" ON "SectorTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Report_projectId_key" ON "Report"("projectId");

-- CreateIndex
CREATE INDEX "ProjectStaffRole_projectId_idx" ON "ProjectStaffRole"("projectId");

-- CreateIndex
CREATE INDEX "ExchangeRate_currency_base_idx" ON "ExchangeRate"("currency", "base");

-- CreateIndex
CREATE INDEX "ExchangeRate_fetchedAt_idx" ON "ExchangeRate"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_base_requestedDate_key" ON "ExchangeRate"("currency", "base", "requestedDate");

-- CreateIndex
CREATE INDEX "MarketDataPoint_sector_idx" ON "MarketDataPoint"("sector");

-- CreateIndex
CREATE INDEX "MarketDataPoint_businessType_idx" ON "MarketDataPoint"("businessType");

-- CreateIndex
CREATE INDEX "MarketDataPoint_indicator_idx" ON "MarketDataPoint"("indicator");

-- CreateIndex
CREATE INDEX "MarketDataPoint_year_idx" ON "MarketDataPoint"("year");

-- CreateIndex
CREATE INDEX "MarketDataPoint_region_idx" ON "MarketDataPoint"("region");

-- CreateIndex
CREATE INDEX "MarketDataPoint_hsCode_idx" ON "MarketDataPoint"("hsCode");

-- CreateIndex
CREATE INDEX "MarketDataPoint_tradeType_idx" ON "MarketDataPoint"("tradeType");

-- CreateIndex
CREATE INDEX "MarketDataPoint_country_idx" ON "MarketDataPoint"("country");

-- CreateIndex
CREATE INDEX "SectorMapping_businessType_idx" ON "SectorMapping"("businessType");

-- CreateIndex
CREATE INDEX "SectorMapping_normalizedSector_idx" ON "SectorMapping"("normalizedSector");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnswer" ADD CONSTRAINT "ProjectAnswer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStaffRole" ADD CONSTRAINT "ProjectStaffRole_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

