"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Calculator, CheckCircle2, Clock3, FileText, Loader2, Send, Sparkles } from "lucide-react";
import { AnswerInput } from "@/components/advisor/AnswerInput";
import { FinancialModelPanel } from "@/components/advisor/FinancialModelPanel";
import { InterviewCompletePanel } from "@/components/advisor/InterviewCompletePanel";
import { MarketDataPanel } from "@/components/advisor/MarketDataPanel";
import { MetricCard } from "@/components/advisor/MetricCard";
import { NextActionsPanel } from "@/components/advisor/NextActionsPanel";
import { ProjectSummaryCard } from "@/components/advisor/ProjectSummaryCard";
import { QuestionCard } from "@/components/advisor/QuestionCard";
import { ReportPreview } from "@/components/advisor/ReportPreview";
import { ReportPrintButton } from "@/components/advisor/ReportPrintButton";
import { RiskDistributionChart } from "@/components/advisor/FinancialProjectionChart";
import { RiskMatrix } from "@/components/advisor/RiskMatrix";
import { ScoreCard } from "@/components/advisor/ScoreCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import { useLocale } from "@/lib/i18n/client";
import { getFreeAnswerPlaceholder, translateBlock } from "@/lib/i18n/interviewLabels";
import { calculateInterviewProgress, calculateScreenProgress, getBlockProgressStatusLabel, progressText } from "@/lib/interview/interviewProgress";
import { buildVisibilityContext, isQuestionVisible, showIfMatches } from "@/lib/interview/interviewValidation";
import { localizeReportData } from "@/lib/report/localizeReport";
import { getReportDestination, isReportGenerationSuccess, shouldShowGenerateReportAction } from "@/lib/report/reportGenerationFlow";
import { hasEnoughDataForCalculation } from "@/lib/services/interviewService";
import type { CurrencyCode, FinancialResult, InterviewQuestion, MoneyValueSnapshot, RiskItem, StructuredProjectData } from "@/lib/types/project";
import { formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { getProjectProfile } from "@/lib/utils/projectClient";

type ProjectRecord = Record<string, any>;
type QuestionResponse = {
  block: string;
  blockId: string;
  blockDescription?: string;
  step: number;
  totalSteps: number;
  mode: "fallback";
  questions: InterviewQuestion[];
  completionPct: number;
  projectProgressPct?: number;
  blockProgressPct?: number;
  missingFields: string[];
  requiredVisibleQuestions?: InterviewQuestion[];
  canAdvance?: boolean;
  nextBlockId?: string | null;
  isInterviewComplete?: boolean;
  isManualBlock?: boolean;
};

function valueByPath(profile: StructuredProjectData, key: string): unknown {
  if (!key.includes(".")) return (profile as Record<string, unknown>)[key];
  const [root, child] = key.split(".");
  const rootValue = (profile as Record<string, unknown>)[root];
  return rootValue && typeof rootValue === "object" ? (rootValue as Record<string, unknown>)[child] : undefined;
}

const hiddenCurrencyQuestionKeys = new Set(["ownContributionCurrency", "requestedLoanCurrency", "requestedLeasingCurrency"]);
const moneyCurrencyKeys: Record<string, keyof StructuredProjectData> = {
  ownContributionAmount: "ownContributionCurrency",
  requestedLoanAmount: "requestedLoanCurrency",
  requestedLeasingAmount: "requestedLeasingCurrency"
};
const moneyUzsKeys: Record<string, keyof StructuredProjectData> = {
  ownContributionAmount: "ownContributionUZS",
  requestedLoanAmount: "requestedLoanUZS",
  requestedLeasingAmount: "requestedLeasingUZS"
};

function isMoneyValue(value: unknown): value is MoneyValueSnapshot & { __money?: true } {
  return value !== null && typeof value === "object" && "sourceAmount" in value && "sourceCurrency" in value;
}

const positiveRequiredNumberKeys = new Set([
  "requestedLoanAmount",
  "requestedLeasingAmount",
  "loanTermMonths",
  "leasingTermMonths",
  "monthlyCapacity",
  "averagePrice"
]);

function requiresPositiveNumber(question: InterviewQuestion) {
  return positiveRequiredNumberKeys.has(question.key);
}

function initialMoneyValue(profile: StructuredProjectData, question: InterviewQuestion): unknown {
  const fromMoneyValues = profile.moneyValues?.[question.key];
  if (fromMoneyValues) return { __money: true, ...fromMoneyValues };
  const currencyKey = moneyCurrencyKeys[question.key];
  const uzsKey = moneyUzsKeys[question.key];
  if (currencyKey && uzsKey) {
    const sourceAmount = valueByPath(profile, question.key);
    if (sourceAmount !== undefined && sourceAmount !== null && sourceAmount !== "") {
      const sourceCurrency = (valueByPath(profile, currencyKey) ?? "UZS") as CurrencyCode;
      const amountUZS = Number(valueByPath(profile, uzsKey) ?? sourceAmount);
      return {
        __money: true,
        sourceAmount: Number(sourceAmount),
        sourceCurrency,
        amountUZS,
        exchangeRateSnapshot: sourceCurrency === "USD" ? profile.exchangeRateSnapshot : undefined
      };
    }
  }
  return valueByPath(profile, question.key);
}

const hostBusinessTrafficFormats = ["one_box_inside_large_service", "one_box_inside_larger_service", "one_box_inside_partner_service", "inside_partner_location"];

function buildLocalVisibilityContext(profile: StructuredProjectData): Record<string, unknown> {
  const autoServiceFormat = String((profile as Record<string, unknown>).autoServiceFormat ?? "");
  const hostTraffic = hostBusinessTrafficFormats.includes(autoServiceFormat) || profile.businessProfile?.operationalModel === "inside_partner_location";
  const operationalModel = hostTraffic
    ? "inside_partner_location"
    : autoServiceFormat === "mobile_service"
      ? "mobile_service"
      : profile.businessProfile?.operationalModel ?? (profile as Record<string, unknown>).operationalModel;
  return buildVisibilityContext({
    answers: { ...profile, operationalModel },
    profile: {
      ...(profile.businessProfile ?? {}),
      operationalModel: operationalModel as any,
      capabilities: {
        ...(profile.businessProfile?.capabilities ?? {}),
        dependsOnHostBusinessTraffic: hostTraffic
      }
    } as any
  });
}

function showIfMatchesLocally(question: InterviewQuestion, profile: StructuredProjectData): boolean {
  return isQuestionVisible(question, buildLocalVisibilityContext(profile));
}

function filterQuestionOptions(question: InterviewQuestion, profile: StructuredProjectData): InterviewQuestion {
  if (!question.options?.length || !question.optionShowIf) return question;
  const context = buildLocalVisibilityContext(profile);
  return {
    ...question,
    options: question.options.filter((option) => {
      const condition = question.optionShowIf?.[option];
      return !condition || showIfMatches({ showIf: condition } as InterviewQuestion, context);
    })
  };
}

function initialAnswersFromProfile(project: ProjectRecord, questions: InterviewQuestion[]) {
  const profile = getProjectProfile(project);
  const nextAnswers: Record<string, unknown> = {};
  for (const question of questions) {
    const value = initialMoneyValue(profile, question);
    if (value !== undefined && value !== null && value !== "") nextAnswers[question.key] = value;
  }
  return nextAnswers;
}

function formatReportGenerationError(errorData: any, fallback: string): string {
  const base = typeof errorData?.message === "string" && errorData.message.trim() ? errorData.message : fallback;
  const lines: string[] = [];
  if (Array.isArray(errorData?.missingFields)) {
    lines.push(...errorData.missingFields.map((field: any) => String(field.message || field.label || field.key || "").trim()).filter(Boolean));
  }
  if (Array.isArray(errorData?.integrityErrors)) lines.push(...errorData.integrityErrors.map((item: any) => String(item).trim()).filter(Boolean));
  else if (Array.isArray(errorData?.errors)) lines.push(...errorData.errors.map((item: any) => String(item).trim()).filter(Boolean));
  if (Array.isArray(errorData?.warnings) && lines.length === 0) {
    lines.push(...errorData.warnings.map((warning: any) => String(warning.message || warning.label || warning.code || "").trim()).filter(Boolean));
  }
  if (typeof errorData?.details === "string" && errorData.details.trim()) lines.push(errorData.details.trim());
  if (lines.length > 0) return `${base}\n${lines.map((line) => `- ${line}`).join("\n")}`;
  if (typeof errorData?.message === "string" && errorData.message.trim()) return errorData.message;
  if (typeof errorData?.error === "string" && errorData.error.trim()) return errorData.error;
  return fallback;
}

function formatValidationError(
  errorData: any,
  fallback: string,
  copy?: { validationRequiredFields?: string; saveTechnicalError?: string }
): string {
  if (errorData?.errorCode === "VALIDATION_FAILED") {
    const labels = Array.isArray(errorData.invalidFields)
      ? errorData.invalidFields.map((field: any) => String(field.label || field.field || "")).filter(Boolean)
      : [];
    if (labels.length > 0) {
      const title = copy?.validationRequiredFields ?? fallback;
      return `${title}\n${labels.map((label: string) => `- ${label}`).join("\n")}`;
    }
  }
  if (errorData?.errorCode === "SAVE_FAILED") {
    const details = typeof errorData.details === "string" && errorData.details.trim() ? `\n${errorData.details}` : "";
    return `${copy?.saveTechnicalError ?? fallback}${details}`;
  }
  return fallback;
}

function isAnswerMissing(question: InterviewQuestion, value: unknown): boolean {
  if (question.optional) return false;
  if (value === undefined || value === null) return true;
  if (isMoneyValue(value)) return requiresPositiveNumber(question) ? Number(value.sourceAmount ?? 0) <= 0 || !value.sourceCurrency : !value.sourceCurrency;
  if (typeof value === "string") return value.trim() === "" || value === "__later__";
  if (Array.isArray(value)) return value.length === 0;
  if (question.type === "number" && requiresPositiveNumber(question)) return Number(value) <= 0;
  if (question.type === "staffPlan") {
    const roles = value && typeof value === "object" && Array.isArray((value as { roles?: unknown[] }).roles)
      ? (value as { roles: Array<Record<string, unknown>> }).roles
      : [];
    return roles.length === 0 || roles.some((role) => !String(role.role ?? "").trim() || Number(role.count ?? 0) <= 0 || Number(role.monthlySalaryAmount ?? 0) <= 0);
  }
  return false;
}

export function InterviewPanel({ initialProject }: { initialProject: ProjectRecord }) {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const [project, setProject] = useState<ProjectRecord>(initialProject);
  const projectRef = useRef<ProjectRecord>(initialProject);
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null);
  const questionResponseRef = useRef<QuestionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const answersRef = useRef<Record<string, unknown>>({});
  const [freeText, setFreeText] = useState("");
  const freeTextRef = useRef("");
  const [isSaving, setSaving] = useState(false);
  const [isTransitioningBlock, setTransitioningBlock] = useState(false);
  const pendingNextBlockIdRef = useRef<string | null | undefined>(undefined);
  const [isCalculating, setCalculating] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasHydratedInitialBlock = useRef(false);
  const [interviewFinished, setInterviewFinished] = useState(Boolean(initialProject.financialResult || initialProject.reportData));
  const lastSavedSignatureRef = useRef("");
  const lastSaveFailedRef = useRef(false);
  const profile = useMemo(() => getProjectProfile(project), [project]);
  const financial = project.financialResult as FinancialResult | null;
  const risks = (project.riskResult as RiskItem[] | null) ?? [];
  const reportLocale = locale;
  const rawReport = project.reportData as any;
  const report = useMemo(() => rawReport ? localizeReportData(rawReport, reportLocale) : null, [rawReport, reportLocale]);
  const tabs = messages.interview.tabs;
  const resultMessages = messages.interviewResult;
  const reportPreviewFallback = locale === "uz"
    ? { title: "Hisobot tayyor, lekin ko‘rib chiqish oynasi ochilmadi", description: "Hisobot maʼlumotlari saqlangan bo‘lishi mumkin, ammo moliyaviy natija yoki hisobot preview hozircha sahifaga kelmadi. Sahifani yangilang yoki hisobotni qayta shakllantiring.", action: "Sahifani yangilash" }
    : locale === "en"
      ? { title: "The report was generated, but the preview is unavailable", description: "The report data may have been saved, but the financial result or preview did not reach this page yet. Refresh the page or generate the report again.", action: "Refresh page" }
      : { title: "Отчёт сформирован, но превью не отобразилось", description: "Данные отчёта могли сохраниться, но финансовый результат или превью пока не попали на страницу. Обновите страницу или сформируйте отчёт повторно.", action: "Обновить страницу" };
  const reportPreviewUnavailable = activeTabIndex === 5 && (!financial || !report);
  const canCalculate = Boolean(questionResponse?.isInterviewComplete || (questionResponse && questionResponse.missingFields.length === 0) || hasEnoughDataForCalculation(profile));
  const activeBlockCopy = questionResponse ? translateBlock(locale, questionResponse.blockId, questionResponse.block, questionResponse.blockDescription) : null;
  const freeAnswerPlaceholder = getFreeAnswerPlaceholder(locale, questionResponse?.blockId) ?? messages.interview.freeAnswerPlaceholder;
  const isFinalInterviewBlock = Boolean(questionResponse && questionResponse.step === questionResponse.totalSteps);

  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { questionResponseRef.current = questionResponse; }, [questionResponse]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { freeTextRef.current = freeText; }, [freeText]);

  const loadQuestions = useCallback(async (nextProject: ProjectRecord, blockId?: string, currentAnswers?: Record<string, unknown>) => {
    const response = await fetch("/api/interview/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: nextProject.id, blockId, currentAnswers })
    });
    if (!response.ok) return;
    const data = await response.json() as QuestionResponse;
    setQuestionResponse(data);
    if (data.nextBlockId !== null) setInterviewFinished(false);
    const hydratedAnswers = { ...initialAnswersFromProfile(nextProject, data.questions), ...(currentAnswers ?? {}) };
    setAnswers(hydratedAnswers);
    const hydratedPayload = data.questions
      .filter((question) => {
        const value = hydratedAnswers[question.key];
        return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
      })
      .map((question) => ({
        key: question.key,
        question: question.question,
        answer: hydratedAnswers[question.key],
        answerType: question.type
      }));
    lastSavedSignatureRef.current = JSON.stringify({ blockId: data.blockId, answers: hydratedPayload, freeText: "" });
    setHasUnsavedChanges(false);
  }, []);

  useEffect(() => {
    if (hasHydratedInitialBlock.current) return;
    hasHydratedInitialBlock.current = true;
    void loadQuestions(projectRef.current, "business_idea");
  }, [loadQuestions]);

  const buildAnswerPayload = useCallback((sourceAnswers = answersRef.current, sourceResponse = questionResponseRef.current) => {
    if (!sourceResponse) return [];
    const sourceProfile = { ...getProjectProfile(projectRef.current), ...sourceAnswers } as StructuredProjectData;
    return sourceResponse.questions
      .filter((question) => showIfMatchesLocally(question, sourceProfile))
      .filter((question) => !hiddenCurrencyQuestionKeys.has(question.key))
      .filter((question) => {
        const value = sourceAnswers[question.key];
        return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
      })
      .map((question) => ({
        key: question.key,
        question: question.question,
        answer: sourceAnswers[question.key] as string | number | boolean | string[] | Record<string, unknown>,
        answerType: question.type
      }));
  }, []);

  const saveCurrentBlock = useCallback(async (options: { advance: boolean; showAdvisorMessage: boolean; includeFreeText: boolean }) => {
    const currentResponse = questionResponseRef.current;
    if (!currentResponse) return projectRef.current;

    const answerPayload = buildAnswerPayload();
    const currentFreeText = options.includeFreeText ? freeTextRef.current.trim() : "";
    const signature = JSON.stringify({ blockId: currentResponse.blockId, answers: answerPayload, freeText: currentFreeText });

    if (!options.advance && signature === lastSavedSignatureRef.current) return projectRef.current;
    if (!options.advance && answerPayload.length === 0 && !currentFreeText) return projectRef.current;

    if (options.advance) setSaving(true);
    setSaveError(null);
    lastSaveFailedRef.current = false;

    // Only free text entered in the open textarea is user-facing free text.
    // Structured answer payload is sent separately and must not be serialized into
    // sectionNotes, otherwise back navigation shows debug dumps such as
    // targetCustomers: ..., averagePrice: {sourceAmount...}.
    const payloadMessage = currentFreeText || "__structured_answers_only__";

    try {
      const response = await fetch("/api/interview/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectRef.current.id,
          blockId: currentResponse.blockId,
          message: payloadMessage || "section completed",
          answers: answerPayload,
          autoSave: !options.advance,
          advance: options.advance
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        lastSaveFailedRef.current = true;
        const errorMessage = formatValidationError(data, messages.interview.saveError, messages.interview);
        setSaveError(errorMessage);
        return projectRef.current;
      }

      if (data.project) {
        projectRef.current = data.project;
        setProject(data.project);
      }
      if (options.advance) pendingNextBlockIdRef.current = data.nextBlockId ?? null;
      lastSavedSignatureRef.current = signature;
      setHasUnsavedChanges(false);
      if (options.showAdvisorMessage && data.advisorMessage) setMessage(data.advisorMessage);
      if (options.includeFreeText) setFreeText("");
      return data.project ?? projectRef.current;
    } finally {
      if (options.advance) setSaving(false);
    }
  }, [buildAnswerPayload, messages.interview]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  async function submitAnswers() {
    if (isSaving || isTransitioningBlock) return;
    pendingNextBlockIdRef.current = undefined;
    setMessage(null);
    setTransitioningBlock(true);
    try {
      const savedProject = await saveCurrentBlock({ advance: true, showAdvisorMessage: true, includeFreeText: true });
      const nextBlockId = pendingNextBlockIdRef.current;
      if (nextBlockId) {
        await loadQuestions(savedProject, nextBlockId);
      } else if (nextBlockId === null) {
        setInterviewFinished(true);
        setQuestionResponse((current) => current ? {
          ...current,
          missingFields: [],
          nextBlockId: null,
          isInterviewComplete: true
        } : current);
        setMessage(messages.interview.reportReady);
      }
    } finally {
      setTransitioningBlock(false);
    }
  }

  async function calculateProject() {
    if (isSaving || isTransitioningBlock) return;
    await saveCurrentBlock({ advance: false, showAdvisorMessage: false, includeFreeText: false });
    setCalculating(true);
    const response = await fetch(`/api/projects/${projectRef.current.id}/calculate`, { method: "POST" });
    if (response.ok) { const data = await response.json(); setProject(data.project); projectRef.current = data.project; setActiveTabIndex(0); setMessage(messages.interview.calculationDone); }
    else setMessage(messages.interview.calculationError);
    setCalculating(false);
  }

  async function generateReport() {
    if (isSaving || isTransitioningBlock || isCalculating || !canCalculate) return;
    setCalculating(true);
    setSaveError(null);
    setMessage(messages.interview.reportGenerating);
    try {
      if (hasUnsavedChanges) {
        pendingNextBlockIdRef.current = undefined;
        await saveCurrentBlock({ advance: true, showAdvisorMessage: false, includeFreeText: true });
        if (lastSaveFailedRef.current) {
          setMessage(messages.interview.saveError);
          return;
        }
      }
      const projectId = projectRef.current.id;
      const response = await fetch(`/api/projects/${projectId}/report/generate`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (response.ok && isReportGenerationSuccess(data)) {
        if (data.project) {
          projectRef.current = data.project;
          setProject(data.project);
        }
        setInterviewFinished(true);
        setActiveTabIndex(5);
        setMessage(messages.interview.reportReady);
        if (!data.project?.reportData) router.push(getReportDestination(data, projectId));
        else router.refresh();
      } else {
        setSaveError(formatReportGenerationError(data, messages.interview.reportGenerationError));
        setMessage(messages.interview.reportGenerationError);
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      setSaveError(`${messages.interview.reportGenerationError}\n${details}`);
      setMessage(messages.interview.reportGenerationError);
    } finally {
      setCalculating(false);
    }
  }

  async function selectInterviewBlock(blockId: string) {
    if (isSaving || isTransitioningBlock) return;
    if (questionResponseRef.current?.blockId === blockId) return;
    setMessage(null);
    if (hasUnsavedChanges && typeof window !== "undefined" && !window.confirm(messages.interview.unsavedLeave)) return;
    const savedProject = hasUnsavedChanges
      ? await saveCurrentBlock({ advance: false, showAdvisorMessage: false, includeFreeText: false })
      : projectRef.current;
    setInterviewFinished(false);
    setFreeText("");
    await loadQuestions(savedProject, blockId);
  }

  const liveProfile = useMemo(() => ({ ...profile, ...answers } as StructuredProjectData), [profile, answers]);
  const visibleQuestions = useMemo(
    () => questionResponse?.questions
      .filter((question) => showIfMatchesLocally(question, liveProfile))
      .filter((question) => !hiddenCurrencyQuestionKeys.has(question.key))
      .map((question) => filterQuestionOptions(question, liveProfile)) ?? [],
    [questionResponse, liveProfile]
  );
  const requiredQuestions = useMemo(() => {
    const requiredKeys = new Set(questionResponse?.requiredVisibleQuestions?.map((question) => question.key) ?? []);
    return visibleQuestions.filter((question) => question.isRequired === true || question.required === true || requiredKeys.has(question.key) || (!questionResponse?.requiredVisibleQuestions?.length && !question.optional));
  }, [visibleQuestions, questionResponse]);
  const missingVisibleRequiredLabels = useMemo(
    () => requiredQuestions.filter((question) => isAnswerMissing(question, answers[question.key])).map((question) => question.label),
    [requiredQuestions, answers]
  );
  const interviewProgress = useMemo(
    () => calculateInterviewProgress({ data: liveProfile, currentBlockId: questionResponse?.blockId, locale }),
    [liveProfile, questionResponse?.blockId, locale]
  );
  const screenProgress = useMemo(
    () => calculateScreenProgress({
      questions: visibleQuestions,
      data: liveProfile,
      requiredQuestionKeys: questionResponse?.requiredVisibleQuestions?.map((question) => question.key)
    }),
    [visibleQuestions, liveProfile, questionResponse?.requiredVisibleQuestions]
  );
  const currentBlockProgress = questionResponse?.blockId
    ? interviewProgress.blocks.find((block) => block.blockId === questionResponse.blockId)
    : interviewProgress.currentBlock;
  const progressCopy = progressText(locale);
  const hasMissingRequired = interviewProgress.project.missing > 0 || screenProgress.missing > 0;
  const dataQualityLabel = hasMissingRequired
    ? progressCopy.dataQualityMissingRequired
    : interviewProgress.dataQualityStatus === "ok"
      ? progressCopy.dataQualityOk
      : progressCopy.dataQualityWarnings;
  const savedStateDetails = currentBlockProgress && currentBlockProgress.missing === 0
    ? `${progressCopy.sectionSaved} ${progressCopy.sectionFullyCompleted} ${progressCopy.requiredAnsweredCount(currentBlockProgress.answered, currentBlockProgress.required)}.${currentBlockProgress.warnings.length ? ` ${progressCopy.dataQualityWarnings}.` : ""}`
    : currentBlockProgress
      ? `${progressCopy.sectionSaved} ${progressCopy.requiredAnsweredCount(currentBlockProgress.answered, currentBlockProgress.required)}. ${progressCopy.savedButIncomplete}`
      : progressCopy.sectionSaved;
  const isCurrentBlockValid = missingVisibleRequiredLabels.length === 0;
  const interviewCompleteForCurrentFlow = Boolean(
    interviewFinished ||
    questionResponse?.isInterviewComplete ||
    (questionResponse?.nextBlockId === null && isFinalInterviewBlock)
  );
  const hasPendingInterviewBlock = Boolean(questionResponse && questionResponse.nextBlockId !== null && questionResponse.nextBlockId !== undefined);
  const shouldShowGenerateReportButton = shouldShowGenerateReportAction({
    interviewCompleteForCurrentFlow,
    hasPendingInterviewBlock,
    hasFinancialResult: Boolean(financial),
    hasUnsavedChanges,
    isCurrentBlockValid,
    canCalculate
  });

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
              </div>
              {!visibleQuestions.length || financial ? (
                <Button onClick={calculateProject} disabled={isCalculating || isSaving || isTransitioningBlock || !canCalculate}>
                  {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  {messages.interview.calculate}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {questionResponse && activeBlockCopy ? <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold"><span>{questionResponse.isManualBlock ? messages.interview.edit : messages.interview.step} {questionResponse.step} {messages.interview.of} {questionResponse.totalSteps}</span><span>{progressCopy.currentStep}: {screenProgress.pct}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-finko-primary" style={{ width: `${screenProgress.pct}%` }} /></div>
              <div className="mt-3 grid gap-1 text-sm text-finko-muted">
                <p>{messages.interview.block}: {activeBlockCopy.name} — {currentBlockProgress?.pct ?? questionResponse.blockProgressPct ?? 0}% ({currentBlockProgress ? getBlockProgressStatusLabel(currentBlockProgress.status, locale) : ""})</p>
                <p>{progressCopy.wholeProject}: {interviewProgress.project.pct}%</p>
                <p>{progressCopy.dataQuality}: {dataQualityLabel}</p>
              </div>
              {activeBlockCopy.description ? <p className="mt-1 text-xs text-finko-muted">{activeBlockCopy.description}</p> : null}
            </div> : null}
            {message ? <p className="mt-4 rounded-2xl bg-finko-primaryLight p-3 text-sm text-finko-primaryDark">{message}</p> : null}
            <div className="mt-4 rounded-2xl border border-finko-border bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${saveError ? "bg-red-50 text-red-600" : hasUnsavedChanges ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {isTransitioningBlock || isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveError ? <AlertCircle className="h-4 w-4" /> : hasUnsavedChanges ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="font-semibold text-finko-text">
                      {isTransitioningBlock ? messages.interview.preparingNextSection : isSaving ? messages.interview.saving : hasUnsavedChanges ? messages.interview.unsaved : messages.interview.savedState}
                    </p>
                    <p className="text-xs text-finko-muted">
                      {hasUnsavedChanges ? (activeBlockCopy ? `${messages.interview.block}: ${activeBlockCopy.name}` : messages.interview.saved) : savedStateDetails}
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-finko-primaryLight px-3 py-1 text-xs font-semibold text-finko-primaryDark">
                  <Sparkles className="h-3.5 w-3.5" />
                  {currentBlockProgress?.pct ?? questionResponse?.blockProgressPct ?? 0}%
                </span>
              </div>
              {saveError ? <p className="mt-3 whitespace-pre-line rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{saveError}</p> : null}
              {!saveError && missingVisibleRequiredLabels.length > 0 ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  {progressCopy.missingRequiredPrefix}: {missingVisibleRequiredLabels.join(", ")}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isTransitioningBlock ? (
          <Card className="border-finko-primary/20 bg-gradient-to-br from-white to-finko-primaryLight/40 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-finko-primary text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-finko-text">{messages.interview.preparingNextSection}</p>
                  <div className="mt-4 grid gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-finko-primary" />
                    </div>
                    <p className="text-xs text-finko-muted">{locale === "uz" ? "AI javoblarni tahlil qiladi, bo‘limni saqlaydi va keyingi blokni maʼlumotlarni yo‘qotmasdan tayyorlaydi." : locale === "en" ? "AI analyzes the answers, saves this section and prepares the next block without losing entered data." : "AI анализирует ответы, сохраняет раздел и подбирает следующий блок без потери введенных данных."}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : visibleQuestions.length ? (
          <div className="grid gap-4">
            {visibleQuestions.map((question) => (
              <QuestionCard key={question.key} question={question}>
                <AnswerInput
                  question={question}
                  value={answers[question.key]}
                  onChange={(value) => {
                    setHasUnsavedChanges(true);
                    setAnswers((current) => {
                      const next = { ...current, [question.key]: value };
                      if (isMoneyValue(value)) {
                        const currencyKey = moneyCurrencyKeys[question.key];
                        const uzsKey = moneyUzsKeys[question.key];
                        if (currencyKey) next[currencyKey] = value.sourceCurrency;
                        if (uzsKey) next[uzsKey] = value.amountUZS;
                      }
                      return next;
                    });
                  }}
                />
              </QuestionCard>
            ))}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">
                  {messages.interview.freeAnswer}
                  <span className="ml-2 align-middle text-xs font-semibold text-finko-muted">• {messages.question.optional}</span>
                </h2>
                <p className="mt-1 text-sm text-finko-muted">{messages.interview.freeAnswerHelp}</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={freeText}
                  onChange={(event) => { setHasUnsavedChanges(true); setFreeText(event.target.value); }}
                  placeholder={freeAnswerPlaceholder}
                />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {!shouldShowGenerateReportButton ? (
                    <Button onClick={submitAnswers} disabled={isSaving || isTransitioningBlock || !isCurrentBlockValid}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {questionResponse?.isManualBlock ? messages.interview.saveSection : messages.interview.save}
                    </Button>
                  ) : null}
                  {shouldShowGenerateReportButton ? (
                    <Button onClick={generateReport} disabled={isCalculating || isSaving || isTransitioningBlock || !canCalculate}>
                      {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      {messages.interview.generateReport}
                    </Button>
                  ) : null}
                </div>
                {!isCurrentBlockValid ? <p className="mt-2 text-xs font-semibold text-amber-700">{messages.interview.incomplete}</p> : null}
              </CardContent>
            </Card>
          </div>
        ) : interviewCompleteForCurrentFlow && !hasPendingInterviewBlock ? (
          <InterviewCompletePanel
            canCalculate={canCalculate}
            isCalculating={isCalculating}
            completionPct={interviewProgress.project.pct}
            sections={project.templateData?.interviewBlocks?.map((block: { id: string; name: string; description?: string }) => ({ id: block.id, name: translateBlock(locale, block.id, block.name, block.description).name, status: "completed" as const })) ?? []}
            onCalculate={generateReport}
            onReview={() => void selectInterviewBlock("business_idea")}
          />
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">
                {locale === "uz" ? "Bo‘limda ko‘rinadigan savollar yo‘q" : locale === "en" ? "No visible questions in this section" : "В этом разделе нет видимых вопросов"}
              </h2>
              <p className="mt-1 text-sm text-finko-muted">
                {locale === "uz"
                  ? "Bu yakuniy bosqich emas. Keyingi majburiy bo‘limga o‘tish uchun davom eting."
                  : locale === "en"
                    ? "This is not the final step. Continue to the next required section."
                    : "Это не конец интервью. Перейдите к следующему обязательному разделу."}
              </p>
            </CardHeader>
            <CardContent>
              <Button onClick={submitAnswers} disabled={isSaving || isTransitioningBlock}>
                {isSaving || isTransitioningBlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {locale === "uz" ? "Keyingi bo‘limga o‘tish" : locale === "en" ? "Continue to next section" : "Перейти к следующему разделу"}
              </Button>
              {questionResponse?.nextBlockId ? (
                <p className="mt-3 text-xs text-finko-muted">
                  {locale === "uz"
                    ? "Keyingi bo‘lim tayyorlanadi."
                    : locale === "en"
                      ? "The next section will be prepared."
                      : "Следующий раздел будет подготовлен автоматически."}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        {financial ? <div className="grid gap-5">
          <div className="no-print flex flex-wrap gap-2">{tabs.map((tab, index) => <Button key={tab} variant={activeTabIndex === index ? "primary" : "outline"} onClick={() => setActiveTabIndex(index)}>{tab}</Button>)}</div>
          {activeTabIndex === 0 ? <div className="grid gap-5"><div className="grid gap-4 md:grid-cols-2"><ScoreCard title={messages.feasibilityScore} score={project.feasibilityScore ?? 0} caption={resultMessages.feasibilityCaption} /><ScoreCard title={messages.bankReadinessScore} score={project.bankReadinessScore ?? 0} caption={profile.creditNeeded === "no" ? resultMessages.bankReadinessNoCredit : resultMessages.bankReadinessDisclaimer} /></div><div className="grid gap-4 md:grid-cols-3"><MetricCard title={resultMessages.investment} value={formatCurrencyCompact(financial.capex.totalCapEx + financial.workingCapital.requiredWorkingCapital, "UZS", locale)} /><MetricCard title={resultMessages.creditLeasing} value={formatCurrencyCompact(financial.financing.loanRequired + financial.financing.leasingRequired, "UZS", locale)} /><MetricCard title="EBITDA" value={formatCurrencyCompact(financial.profitability.monthlyEBITDA, "UZS", locale)} /></div></div> : null}
          {activeTabIndex === 1 ? <FinancialModelPanel financial={financial} /> : null}
          {activeTabIndex === 2 ? <div className="grid gap-5"><Card><CardHeader><h2 className="text-xl font-bold">{resultMessages.riskDistribution}</h2></CardHeader><CardContent><RiskDistributionChart risks={risks} /></CardContent></Card><RiskMatrix risks={risks} conclusion={report?.riskConclusion} /></div> : null}
          {activeTabIndex === 3 ? <div className="grid gap-5"><ScoreCard title={messages.externalFinancingReadiness} score={project.bankReadinessScore ?? 0} caption={resultMessages.financingCaption} />{report?.nextActions ? <NextActionsPanel actions={report.nextActions} /> : null}</div> : null}
          {activeTabIndex === 4 ? <MarketDataPanel data={report?.marketData ?? project.marketDataResult ?? null} /> : null}
          {activeTabIndex === 5 ? (
            <div className="grid gap-4">
              <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/advisor/projects/${project.id}/report`}>
                  <Button>
                    <FileText className="h-4 w-4" />
                    {messages.interview.openReport}
                  </Button>
                </Link>
                <ReportPrintButton projectId={project.id} locale={reportLocale} disabled={!report} />
              </div>
              {report ? <ReportPreview report={report} locale={reportLocale} /> : (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader><h2 className="text-lg font-bold text-amber-950">{reportPreviewFallback.title}</h2></CardHeader>
                  <CardContent className="grid gap-3 text-sm text-amber-900">
                    <p>{reportPreviewFallback.description}</p>
                    <Button variant="outline" onClick={() => router.refresh()}>{reportPreviewFallback.action}</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
          {activeTabIndex === 6 ? (
            <Card>
              <CardHeader><h2 className="text-xl font-bold">{locale === "en" ? "Export" : locale === "uz" ? "Eksport" : "Экспорт"}</h2></CardHeader>
              <CardContent><ReportPrintButton projectId={project.id} locale={reportLocale} disabled={!report} /></CardContent>
            </Card>
          ) : null}
        </div> : reportPreviewUnavailable ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader><h2 className="text-lg font-bold text-amber-950">{reportPreviewFallback.title}</h2></CardHeader>
            <CardContent className="grid gap-3 text-sm text-amber-900">
              <p>{reportPreviewFallback.description}</p>
              <Button variant="outline" onClick={() => router.refresh()}>{reportPreviewFallback.action}</Button>
            </CardContent>
          </Card>
        ) : null}
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{messages.interviewComplete.disclaimer}</p>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start"><ProjectSummaryCard profile={liveProfile} mode={project.aiMode} activeBlockId={questionResponse?.blockId} navigationDisabled={isSaving || isTransitioningBlock} onBlockSelect={selectInterviewBlock} /></aside>
    </div>
  );
}
