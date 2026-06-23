import { NextResponse } from "next/server";
import { calculateAll } from "@/lib/calculator/financialCalculator";
import { prisma } from "@/lib/db/prisma";
import { getBusinessProfileForData } from "@/lib/interview/dynamicInterviewEngine";
import { buildAnswerMemory, detectMissingAnalysisInputs, type MissingInput } from "@/lib/interview/answerMemory";
import { translateQuestion } from "@/lib/i18n/interviewLabels";
import type { AppLocale } from "@/lib/i18n";
import { getMarketData } from "@/lib/marketData/marketDataService";
import { conductMarketResearch } from "@/lib/market/webResearchService";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "@/lib/scoring/scoringService";
import { generateRiskMatrix } from "@/lib/scoring/riskEngine";
import { buildReportDataWithAI } from "@/lib/services/reportService";
import { resolveReportReadiness, type ReportReadinessIssue } from "@/lib/report/reportReadiness";
import { validateReportIntegrity } from "@/lib/report/reportIntegrityValidator";
import { getProjectForSession, toStructuredProjectData } from "@/lib/services/projectService";
import { hasEnoughDataForCalculation, validateReliableCalculationInputs } from "@/lib/services/interviewService";
import { flattenTemplateQuestions, resolveTemplateFromProject } from "@/lib/services/templateService";
import { getUsdUzsExchangeRate, isExchangeRateUnavailableError, toUzbekistanDate } from "@/lib/services/exchangeRateService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { safeProjectDetailDto } from "@/lib/server/dto";
import { assertCsrf, checkDailyAIQuota, enforceRateLimit } from "@/lib/server/security";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type MissingFieldDto = {
  key: string;
  label: string;
  blockId: string;
  severity: "critical" | "important" | "optional";
};

type ReportErrorCode =
  | "MISSING_REQUIRED_FIELDS"
  | "CSRF_FAILED"
  | "PROJECT_NOT_FOUND"
  | "RATE_LIMITED"
  | "EXCHANGE_RATE_UNAVAILABLE"
  | "REPORT_BUILD_FAILED"
  | "REPORT_INTEGRITY_FAILED"
  | "CALCULATION_NOT_READY"
  | "REPORT_DATA_EMPTY"
  | "INVALID_STRUCTURED_DATA"
  | "DATABASE_SAVE_FAILED"
  | "AI_GENERATION_FAILED"
  | "TIMEOUT"
  | "AUTH_REQUIRED"
  | "UNKNOWN_ERROR";

function reportError(
  errorCode: ReportErrorCode,
  message: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, success: false, code: errorCode, errorCode, message, ...extra }, { status });
}

function readinessIssueDto(issue: ReportReadinessIssue) {
  return {
    field: issue.field ?? issue.key ?? issue.code,
    key: issue.key ?? issue.field ?? issue.code,
    label: issue.label ?? issue.field ?? issue.code,
    block: issue.block ?? issue.blockId ?? "",
    blockId: issue.blockId ?? issue.block ?? "",
    severity: issue.severity,
    code: issue.code,
    message: issue.message,
    calculationPolicy: issue.calculationPolicy
  };
}

function exchangeRateUnavailableMessage(locale: AppLocale) {
  if (locale === "en") return "The official USD/UZS exchange rate is temporarily unavailable.";
  if (locale === "uz") return "USD/UZS rasmiy kursi vaqtincha mavjud emas.";
  return "Не удалось получить курс валюты на дату расчёта.";
}

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

function fallbackLabel(key: string, locale: AppLocale) {
  const labels: Record<AppLocale, Record<string, string>> = {
    ru: {
      businessIdea: "Бизнес-идея",
      targetCustomers: "Основные клиенты",
      monthlyVolume: "Плановый объём",
      averageTicket: "Средний чек",
      ownContribution: "Собственные средства",
      location: "Помещение и локация",
      equipment: "Оборудование",
      suppliers_procurement: "Поставщики и закупки",
      serviceFlow: "Процесс услуги",
      productionCapacity: "Производственная мощность",
      team: "Команда",
      legalDocs: "Документы и разрешения",
      sanitaryCompliance: "Санитарные требования",
      b2bContracts: "B2B-договоры",
      workingCapital: "Оборотный капитал",
      returnsPolicy: "Гарантии и претензии"
    },
    en: {
      businessIdea: "Business idea",
      targetCustomers: "Target customers",
      monthlyVolume: "Planned volume",
      averageTicket: "Average ticket",
      ownContribution: "Own contribution",
      location: "Premises and location",
      equipment: "Equipment",
      suppliers_procurement: "Suppliers and procurement",
      serviceFlow: "Service flow",
      productionCapacity: "Production capacity",
      team: "Team",
      legalDocs: "Documents and permits",
      sanitaryCompliance: "Sanitary requirements",
      b2bContracts: "B2B contracts",
      workingCapital: "Working capital",
      returnsPolicy: "Warranty and claims"
    },
    uz: {
      businessIdea: "Biznes g'oya",
      targetCustomers: "Asosiy mijozlar",
      monthlyVolume: "Rejalashtirilgan hajm",
      averageTicket: "O'rtacha chek",
      ownContribution: "O'z mablag'i",
      location: "Joy va lokatsiya",
      equipment: "Uskunalar",
      suppliers_procurement: "Yetkazib beruvchilar va xaridlar",
      serviceFlow: "Xizmat jarayoni",
      productionCapacity: "Ishlab chiqarish quvvati",
      team: "Jamoa",
      legalDocs: "Hujjatlar va ruxsatnomalar",
      sanitaryCompliance: "Sanitariya talablari",
      b2bContracts: "B2B shartnomalar",
      workingCapital: "Aylanma kapital",
      returnsPolicy: "Kafolat va shikoyatlar"
    }
  };
  return labels[locale]?.[key] ?? key;
}

function fallbackBlockId(key: string) {
  if (["averageTicket", "monthlyVolume", "ownContribution", "fundingNeed", "workingCapital"].includes(key)) return "financing";
  if (["targetCustomers", "businessIdea"].includes(key)) return key === "businessIdea" ? "business_idea" : "sales";
  if (["premises"].includes(key)) return "location";
  if (["equipment"].includes(key)) return "equipment_launch";
  if (["suppliers", "inventory"].includes(key)) return "suppliers_procurement";
  if (["team", "serviceFlow", "productionCapacity"].includes(key)) return "operations";
  if (["legalDocs", "sanitaryCompliance", "b2bContracts"].includes(key)) return "legal_documents";
  if (["returnsPolicy", "risks"].includes(key)) return "risks";
  return "adaptive_question_pack";
}

function normalizeMissingKey(key: string) {
  const map: Record<string, string> = {
    averagePrice: "averageTicket",
    monthlyCapacity: "monthlyVolume",
    ownContributionAmount: "ownContribution",
    ownContributionUZS: "ownContribution",
    rawMaterialSource: "suppliers",
    firstMonthRawMaterialStockUZS: "workingCapital",
    certificationAwareness: "legalDocs",
    staffPlan: "team",
    premisesStatus: "premises",
    equipmentCondition: "equipment"
  };
  return map[key] ?? key;
}

function buildQuestionIndex(template: ReturnType<typeof resolveTemplateFromProject>) {
  return new Map(flattenTemplateQuestions(template).map(({ block, question }) => [question.key, { block, question }]));
}

function toMissingFieldDto(input: {
  key: string;
  severity?: MissingFieldDto["severity"];
  locale: AppLocale;
  questionIndex: ReturnType<typeof buildQuestionIndex>;
  fallbackReasonBlock?: string;
}): MissingFieldDto {
  const normalizedKey = normalizeMissingKey(input.key);
  const direct = input.questionIndex.get(input.key) ?? input.questionIndex.get(normalizedKey);
  return {
    key: normalizedKey,
    label: direct ? translateQuestion(input.locale, direct.question).label : fallbackLabel(normalizedKey, input.locale),
    blockId: input.fallbackReasonBlock ?? direct?.block.id ?? fallbackBlockId(normalizedKey),
    severity: input.severity ?? "critical"
  };
}

function uniqueMissingFields(items: MissingFieldDto[]) {
  const rank = { critical: 0, important: 1, optional: 2 } as const;
  const byKey = new Map<string, MissingFieldDto>();
  for (const item of items) {
    const existing = byKey.get(item.key);
    if (!existing || rank[item.severity] < rank[existing.severity]) byKey.set(item.key, item);
  }
  return Array.from(byKey.values()).sort((left, right) => rank[left.severity] - rank[right.severity]);
}

function missingFieldDtos(input: {
  reliableMissingFields: string[];
  analysisGaps: MissingInput[];
  locale: AppLocale;
  questionIndex: ReturnType<typeof buildQuestionIndex>;
}) {
  const fromReliable = input.reliableMissingFields.map((key) => toMissingFieldDto({
    key,
    locale: input.locale,
    questionIndex: input.questionIndex,
    severity: "critical"
  }));
  const fromGaps = input.analysisGaps
    .filter((gap) => gap.severity !== "optional")
    .map((gap) => toMissingFieldDto({
      key: gap.key,
      locale: input.locale,
      questionIndex: input.questionIndex,
      severity: gap.severity,
      fallbackReasonBlock: fallbackBlockId(gap.key)
    }));
  return uniqueMissingFields([...fromReliable, ...fromGaps]);
}

function localizedMissingMessage(locale: AppLocale) {
  if (locale === "en") return "There is not enough data to generate the report.";
  if (locale === "uz") return "Hisobotni shakllantirish uchun ma'lumotlar yetarli emas.";
  return "Не хватает данных для формирования отчёта.";
}

function localizedReportFailure(locale: AppLocale) {
  if (locale === "en") return "Failed to generate the report. Please check the required data or try again.";
  if (locale === "uz") return "Hisobotni shakllantirib bo'lmadi. Majburiy ma'lumotlarni tekshiring yoki yana urinib ko'ring.";
  return "Не удалось сформировать отчёт. Проверьте обязательные данные или попробуйте ещё раз.";
}

function isNonEmptyReportData(reportData: unknown): boolean {
  return Boolean(reportData && typeof reportData === "object" && Object.keys(reportData as Record<string, unknown>).length > 0);
}

export async function POST(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return reportError("CSRF_FAILED", "CSRF validation failed", 403);

  const { id } = await context.params;
  const limited = enforceRateLimit(request, "ai", session, id);
  if (limited) return reportError("RATE_LIMITED", "Too many report generation requests. Please try again later.", 429);

  const dailyQuota = checkDailyAIQuota({ request, session, projectId: id });
  if (dailyQuota) return reportError("RATE_LIMITED", "Daily AI request limit exceeded.", 429);

  let localeForErrors: AppLocale = "ru";

  try {
    const project = await getProjectForSession(id, session);
    if (!project) return reportError("PROJECT_NOT_FOUND", "Project not found", 404);

    const profile = toStructuredProjectData(project as unknown as Record<string, unknown>);
    const locale = (profile.userLanguage ?? "ru") as AppLocale;
    localeForErrors = locale;
    const dynamicTemplate = resolveTemplateFromProject({
      ...(project as unknown as Record<string, unknown>),
      structuredData: profile
    });
    const questionIndex = buildQuestionIndex(dynamicTemplate);
    const businessProfile = getBusinessProfileForData(profile);
    const memory = buildAnswerMemory(profile);
    const analysisGaps = detectMissingAnalysisInputs(businessProfile, memory);
    const readiness = resolveReportReadiness(profile, { template: dynamicTemplate, locale });

    if (!readiness.ready) {
      const missingFields = readiness.blockingIssues.map(readinessIssueDto);
      return reportError("MISSING_REQUIRED_FIELDS", localizedMissingMessage(locale), 400, {
        reason: "missing_required_financial_fields",
        missingFields,
        warnings: readiness.nonBlockingWarnings.map(readinessIssueDto),
        requiredVisibleFields: readiness.requiredVisibleFields,
        calculationInputs: readiness.calculationInputs
      });
    }

    const storedRateSnapshot = profile.exchangeRateSnapshot ?? profile.staffPlan?.exchangeRateSnapshot;
    let rateSnapshot = storedRateSnapshot;
    const needsRate = projectUsesUsd(profile);
    if (!rateSnapshot && needsRate) {
      try {
        rateSnapshot = await getUsdUzsExchangeRate(resolveApplicationRateDate(project as unknown as Record<string, unknown>));
      } catch (error) {
        if (isExchangeRateUnavailableError(error)) {
          console.error("[report/generate] CBU USD/UZS rate unavailable", { projectId: id, message: error.message });
          return reportError(
            "EXCHANGE_RATE_UNAVAILABLE",
            exchangeRateUnavailableMessage(locale),
            503
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

    const template = await prisma.sectorTemplate.findUnique({
      where: { code: dynamicTemplate.code }
    }).catch(() => null);
    const assumptions = (template?.assumptions as typeof dynamicTemplate.assumptions | undefined) ?? dynamicTemplate.assumptions;

    const financial = calculateAll(profileWithRate, assumptions, rateSnapshot);
    const risks = generateRiskMatrix({ ...profileWithRate, financialResult: financial } as ReturnType<typeof toStructuredProjectData>);
    const feasibilityScore = calculateFeasibilityScore(profileWithRate, financial, risks);
    const bankReadinessScore = calculateBankReadinessScore(profileWithRate, financial, risks);
    const marketData = await getMarketData({
      businessType: profileWithRate.businessType ?? project.title,
      region: profileWithRate.region,
      locale: profileWithRate.userLanguage ?? "ru"
    });

    let webResearch = null;
    if (process.env.ENABLE_WEB_RESEARCH !== "false" && process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
      try {
        webResearch = await conductMarketResearch(businessProfile, { ...profileWithRate, id }, profileWithRate.userLanguage ?? "ru");
      } catch (error) {
        console.warn("[report/generate] Web research failed, proceeding without it", error);
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

    if (!isNonEmptyReportData(reportData)) {
      return reportError("REPORT_DATA_EMPTY", localizedReportFailure(locale), 500, {
        hasReportData: false
      });
    }

    const integrity = validateReportIntegrity({ project: profileWithRate, financial, risks, reportData, locale });
    if (!integrity.ok) {
      console.error("[report/generate] Report integrity failed", { projectId: id, errors: integrity.errors });
      return reportError("REPORT_INTEGRITY_FAILED", localizedReportFailure(locale), 500, {
        errors: integrity.errors,
        integrityErrors: integrity.errors
      });
    }

    const updatedProject = await prisma.project.update({
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

    if (!isNonEmptyReportData(updatedProject.reportData)) {
      return reportError("DATABASE_SAVE_FAILED", localizedReportFailure(locale), 500, {
        hasReportData: false
      });
    }

    const reportUrl = `/advisor/projects/${id}/report`;
    return NextResponse.json({
      ok: true,
      success: true,
      status: "ready",
      projectId: id,
      reportStatus: "ready",
      hasReportData: true,
      reportData,
      previewUrl: reportUrl,
      reportUrl,
      redirectUrl: reportUrl,
      warnings: readiness.nonBlockingWarnings.map(readinessIssueDto),
      project: safeProjectDetailDto(updatedProject as never)
    });
  } catch (error) {
    console.error("[report/generate] Report generation failed", error);
    return reportError("REPORT_BUILD_FAILED", localizedReportFailure(localeForErrors), 500, {
      details: process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.message : String(error)
    });
  }
}
