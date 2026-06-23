import { en } from "./en.ts";
import { ru } from "./ru.ts";
import { uz } from "./uz.ts";

export type AppLocale = "ru" | "uz" | "en";
export type AppMessages = {
  header: {
    nav: ReadonlyArray<string>;
    login: string;
  };
  footer: {
    description: string;
  };
  authLogin: {
    title: string;
    adminTitle: string;
    label: string;
    button: string;
    error: string;
    userAuto: string;
  };
  privacy: {
    title: string;
    intro: string;
    ai: string;
    disclaimer: string;
    deletion: string;
    backToForm: string;
    lead: string;
    items: ReadonlyArray<{ title: string; text: string }>;
    note: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    start: string;
    demo: string;
    panelEyebrow: string;
    panelTitle: string;
    panelText: string;
    features: ReadonlyArray<{ title: string; text: string }>;
  };
  homeChecks: {
    title: string;
    financeTitle: string;
    financeText: string;
    riskTitle: string;
    riskText: string;
  };
  advisorStart: {
    eyebrow: string;
    title: string;
    benefits: ReadonlyArray<string>;
    start: string;
    howTitle: string;
    stepLabel: string;
    steps: ReadonlyArray<string>;
  };
  newProject: {
    eyebrow: string;
    title: string;
    description: string;
    businessType: string;
    businessTypePlaceholder: string;
    businessIdea: string;
    businessIdeaPlaceholder: string;
    region: string;
    regionPlaceholder: string;
    district: string;
    districtPlaceholder: string;
    plannedStart: string;
    plannedStartPlaceholder: string;
    consentText: string;
    privacyLink: string;
    submit: string;
    error: string;
  };
  interview: {
    calculate: string;
    calculateReady: string;
    generateReport: string;
    reportReady: string;
    reportGenerating: string;
    calculationDone: string;
    calculationError: string;
    reportGenerationError: string;
    saveError: string;
    validationRequiredFields: string;
    saveTechnicalError: string;
    saved: string;
    step: string;
    edit: string;
    of: string;
    block: string;
    freeAnswer: string;
    freeAnswerHelp: string;
    freeAnswerPlaceholder: string;
    save: string;
    saveSection: string;
    completed: string;
    completedDescription: string;
    reviewAnswers: string;
    optionalCallout: string;
    tabs: ReadonlyArray<string>;
    incomplete: string;
    saving: string;
    preparingNextSection: string;
    unsaved: string;
    savedState: string;
    openReport: string;
    unsavedLeave: string;
  };
  answerInput: {
    select: string;
    later: string;
    other: string;
    role: string;
    count: string;
    salary: string;
    currency: string;
    addRole: string;
    loadingRate: string;
    usdHint: string;
  };
  interviewComplete: {
    title: string;
    description: string;
    summaryTitle: string;
    statusCompleted: string;
    disclaimerTitle: string;
    disclaimer: string;
  };
  interviewResult: {
    feasibilityCaption: string;
    bankReadinessNoCredit: string;
    bankReadinessDisclaimer: string;
    investment: string;
    creditLeasing: string;
    riskDistribution: string;
    financingCaption: string;
  };
  projectSummaryCard: {
    filled: string;
    sections: string;
    ownContribution: string;
    lockedTooltip: string;
    fields: Record<string, string>;
  };
  question: {
    optional: string;
  };
  projectSummary: string;
  financialModel: string;
  riskMatrix: string;
  feasibilityScore: string;
  bankReadinessScore: string;
  externalFinancingReadiness: string;
  aiMode: string;
  demoFallbackMode: string;
  financePanel: {
    [key: string]: any;
    tips: { [key: string]: string };
  };
  riskPanel: { [key: string]: string };
  report: {
    [key: string]: string;
  };
};

const dictionaries: Record<AppLocale, AppMessages> = {
  ru,
  uz,
  en
};

export function normalizeLocale(value: unknown): AppLocale {
  if (typeof value !== "string") return "ru";
  const normalized = value.trim().toLowerCase();
  if (normalized === "en" || normalized === "english") return "en";
  if (normalized === "uz" || normalized === "uz-latn" || normalized === "uz_latn" || normalized === "uz-cyrl" || normalized === "uz_cyrl" || normalized === "uzbek") return "uz";
  return "ru";
}

export function getTranslations(locale: unknown): AppMessages {
  return dictionaries[normalizeLocale(locale)];
}
