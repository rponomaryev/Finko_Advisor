import { NextResponse } from "next/server";
import { calculateAll } from "@/lib/calculator/financialCalculator";
import { prisma } from "@/lib/db/prisma";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "@/lib/scoring/scoringService";
import { generateRiskMatrix } from "@/lib/scoring/riskEngine";
import { buildReportDataWithAI } from "@/lib/services/reportService";
import { getMarketData } from "@/lib/marketData/marketDataService";
import { conductMarketResearch } from "@/lib/market/webResearchService";
import { getBusinessProfileForData } from "@/lib/interview/dynamicInterviewEngine";
import { resolveReportReadiness } from "@/lib/report/reportReadiness";
import { getProjectForSession, toStructuredProjectData } from "@/lib/services/projectService";
import { hasEnoughDataForCalculation, validateReliableCalculationInputs } from "@/lib/services/interviewService";
import { resolveTemplateFromProject } from "@/lib/services/templateService";
import { getUsdUzsExchangeRate, isExchangeRateUnavailableError, toUzbekistanDate } from "@/lib/services/exchangeRateService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { assertCsrf, checkDailyAIQuota, enforceRateLimit } from "@/lib/server/security";
import { safeProjectDetailDto } from "@/lib/server/dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function resolveApplicationRateDate(project: Record<string, unknown>) {
  const updatedAt = project.updatedAt instanceof Date ? project.updatedAt : undefined;
  const createdAt = project.createdAt instanceof Date ? project.createdAt : undefined;
  return toUzbekistanDate(updatedAt ?? createdAt ?? new Date());
}

function projectUsesUsd(profile: ReturnType<typeof toStructuredProjectData>) {
  const positiveUsdAmount = (currency: unknown, amount: unknown) => currency === "USD" && Number(amount ?? 0) > 0;
  if (positiveUsdAmount(profile.ownContributionCurrency, profile.ownContributionAmount)) return true;
  if (positiveUsdAmount(profile.requestedLoanCurrency, profile.requestedLoanAmount)) return true;
  if (positiveUsdAmount(profile.requestedLeasingCurrency, profile.requestedLeasingAmount)) return true;
  if (profile.staffPlan?.roles?.some((role) => positiveUsdAmount(role.monthlySalaryCurrency, role.monthlySalaryAmount))) return true;
  return Object.values(profile.moneyValues ?? {}).some((money) => positiveUsdAmount(money.sourceCurrency, money.sourceAmount));
}

export async function POST(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const { id } = await context.params;
  const limited = enforceRateLimit(request, "ai", session, id);
  if (limited) return limited;

  const dailyQuota = checkDailyAIQuota({ request, session, projectId: id });
  if (dailyQuota) return dailyQuota;

  const project = await getProjectForSession(id, session);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const profile = toStructuredProjectData(project as unknown as Record<string, unknown>);
  const storedRateSnapshot = profile.exchangeRateSnapshot ?? profile.staffPlan?.exchangeRateSnapshot;
  let rateSnapshot = storedRateSnapshot;
  const needsRate = projectUsesUsd(profile);
  if (!rateSnapshot && needsRate) {
    try {
      rateSnapshot = await getUsdUzsExchangeRate(resolveApplicationRateDate(project as unknown as Record<string, unknown>));
    } catch (error) {
      if (isExchangeRateUnavailableError(error)) {
        console.error("[calculate] CBU USD/UZS rate unavailable", { projectId: id, message: error.message });
        return NextResponse.json(
          { error: "Official CBU USD/UZS exchange rate is temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      throw error;
    }
  }
  const profileWithRate = {
    ...profile,
    exchangeRateUZSPerUSD: rateSnapshot?.rate ?? profile.exchangeRateUZSPerUSD,
    exchangeRateSnapshot: rateSnapshot ?? profile.exchangeRateSnapshot,
    staffPlan: profile.staffPlan
      ? { ...profile.staffPlan, exchangeRateSnapshot: profile.staffPlan.exchangeRateSnapshot ?? rateSnapshot }
      : profile.staffPlan
  };
  const dynamicTemplate = resolveTemplateFromProject({
    ...(project as unknown as Record<string, unknown>),
    structuredData: profileWithRate
  });
  const template = await prisma.sectorTemplate.findUnique({
    where: { code: dynamicTemplate.code }
  }).catch(() => null);
  const assumptions = (template?.assumptions as typeof dynamicTemplate.assumptions | undefined) ??
    dynamicTemplate.assumptions;

  const readiness = resolveReportReadiness(profileWithRate, { template: dynamicTemplate, locale: profileWithRate.userLanguage ?? "ru" });
  if (!readiness.ready) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_REQUIRED_FIELDS",
        errorCode: "MISSING_REQUIRED_FIELDS",
        error: "Required interview fields are incomplete",
        reason: "missing_required_financial_fields",
        missingFields: readiness.blockingIssues.map((issue) => ({
          field: issue.field ?? issue.key ?? issue.code,
          key: issue.key ?? issue.field ?? issue.code,
          label: issue.label ?? issue.field ?? issue.code,
          block: issue.block ?? issue.blockId ?? "",
          blockId: issue.blockId ?? issue.block ?? "",
          code: issue.code,
          message: issue.message,
          severity: issue.severity,
          calculationPolicy: issue.calculationPolicy
        })),
        warnings: readiness.nonBlockingWarnings,
        requiredVisibleFields: readiness.requiredVisibleFields,
        message: "Не хватает данных для надежного расчета. Заполните обязательные поля или явно сформируйте предварительный отчет с допущениями."
      },
      { status: 400 }
    );
  }

  const financial = calculateAll(profileWithRate, assumptions, rateSnapshot);
  const risks = generateRiskMatrix({ ...profileWithRate, financialResult: financial } as ReturnType<typeof toStructuredProjectData>);
  const feasibilityScore = calculateFeasibilityScore(profileWithRate, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(profileWithRate, financial, risks);
  const marketData = await getMarketData({
    businessType: profileWithRate.businessType ?? project.title,
    region: profileWithRate.region,
    locale: profileWithRate.userLanguage ?? "ru"
  });
  const businessProfile = getBusinessProfileForData(profileWithRate);
  let webResearch = null;
  if (process.env.ENABLE_WEB_RESEARCH !== "false" && process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    try {
      webResearch = await conductMarketResearch(businessProfile, { ...profileWithRate, id }, profileWithRate.userLanguage ?? "ru");
    } catch (error) {
      console.warn("[calculate] Web research failed, proceeding without it", error);
    }
  }

  const reportData = await buildReportDataWithAI({
    project: {
      ...profileWithRate,
      title: project.title,
      sectorCode: dynamicTemplate.code
    },
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore,
    marketData,
    webResearch
  });

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: "calculated",
      structuredData: profileWithRate as never,
      exchangeRateUZSPerUSD: rateSnapshot?.rate ?? null,
      exchangeRateSnapshot: (rateSnapshot ?? null) as never,
      staffPlan: profileWithRate.staffPlan as never,
      financialResult: financial as never,
      riskResult: risks as never,
      feasibilityScore,
      bankReadinessScore,
      reportData: reportData as never,
      aiReportData: (reportData.aiReport ?? null) as never,
      webResearchData: (webResearch ?? null) as never
    } as never,
    include: { answers: { orderBy: { createdAt: "asc" } } }
  });

  return NextResponse.json({
    project: safeProjectDetailDto(updated as never),
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore,
    reportData
  });
}
