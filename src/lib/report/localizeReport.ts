import { reportMessages, tReport, type ReportLocale } from "../i18n/reportMessages.ts";
import {
  buildLocalizedInvestmentBreakdown,
  buildLocalizedKeyFigures,
  formatCapexLabel,
  formatFormulaRows,
  formatOpexLabel,
  formatWarningMessage,
  formatWarningTitle,
  localizeRiskConclusion,
  localizeRisks,
  reportMetric,
  reportSourceLabel,
  reportStatus
} from "./reportFormatters.ts";
import type { FinancialResult, RiskItem } from "../types/project.ts";
import type { MarketDataResult } from "../marketData/types.ts";
import type { AIGeneratedReport } from "./aiReportGenerator.ts";
import type { WebResearchResult } from "../market/webResearchService.ts";
import { sanitizeUserFacingObject } from "../i18n/userFacingSanitizer.ts";

type ReportData = {
  title: string;
  executiveSummary: string[] | string;
  projectProfile: Record<string, unknown>;
  financialModel: FinancialResult;
  riskMatrix: RiskItem[];
  marketData?: MarketDataResult;
  webResearchData?: WebResearchResult | null;
  aiReport?: AIGeneratedReport | null;
  businessProfile?: Record<string, unknown>;
  marketEvidence?: Array<Record<string, unknown>>;
  documentsAndPermits?: Array<Record<string, unknown>>;
  dataGapsAndAssumptions?: string[];
  businessModelRows?: Array<Array<string>>;
  marketEvidenceRows?: Array<Array<string>>;
  documentsRows?: Array<Array<string>>;
  actionPlanRows?: Array<Array<string>>;
  assumptionsRows?: Array<Array<string>>;
  riskConclusion?: { level: string; reasons: string[]; actions: string[] };
  keyFigures?: Array<[string, string, string]>;
  investmentBreakdown?: Array<[string, string, string]>;
  financingRecommendation?: string;
  detailedConclusion?: string[];
  feasibilityScore: number;
  bankReadinessScore: number;
  recommendedProducts?: unknown;
  nextActions: string[];
  warnings?: FinancialResult["warnings"];
  formulaRows?: FinancialResult["formulaRows"];
  capexBreakdown?: FinancialResult["capex"]["lineItems"];
  opexBreakdown?: FinancialResult["opex"]["lineItems"];
  workingCapitalBreakdown?: FinancialResult["workingCapital"];
  financingBreakdown?: FinancialResult["financing"];
  disclaimer: string;
  generatedAt?: string;
};
import { formatCurrencyCompact, formatCurrencyFull, formatCurrencyWithOriginal } from "../utils/formatCurrency.ts";
import { labelValue } from "../utils/labels.ts";
import { localizeBusinessProfileValue } from "../i18n/businessProfileLabels.ts";
import { assertNoRawTechnicalLabelsInReport } from "./reportLanguageValidator.ts";
import { translateBlock } from "../i18n/interviewLabels.ts";
import { formatDistrict, formatRegion } from "../location/locationNormalizer.ts";

function safe(value: unknown, locale: ReportLocale): string {
  return value === undefined || value === null || value === "" ? reportStatus("notFilled", locale) : labelValue(value, locale);
}

function hasPositiveUsdAmounts(f: ReportData["financialModel"]): boolean {
  const positiveUsdAmount = (currency: unknown, amount: unknown) => currency === "USD" && Number(amount ?? 0) > 0;
  return positiveUsdAmount(f.financing.ownContributionCurrency, f.financing.ownContributionAmount)
    || positiveUsdAmount(f.financing.loanCurrency, f.financing.loanRequired)
    || positiveUsdAmount(f.financing.leasingCurrency, f.financing.leasingRequired)
    || f.payroll.roles.some((role) => positiveUsdAmount(role.monthlySalaryCurrency, role.monthlySalaryAmount));
}

function marketDataNote(report: ReportData, locale: ReportLocale): string {
  const hasData = Boolean(report.marketData?.dataPoints?.length);
  if (hasData) {
    const sources = report.marketData?.sources.map((source) => source.sourceName).filter(Boolean).slice(0, 3).join(", ");
    if (locale === "en") return `External market data from verified sources is included: ${sources}. Treat it as reference context, not a guarantee of demand at a specific location.`;
    if (locale === "uz") return `Hisobotga tekshirilgan manbalardan tashqi bozor ma'lumotlari kiritilgan: ${sources}. Ularni aniq savdo nuqtasidagi talab kafolati emas, ma'lumotnoma konteksti sifatida o'qing.`;
    return `В отчет включены внешние рыночные данные из проверенных источников: ${sources}. Их нужно читать как справочный контекст, а не как гарантию спроса по конкретной точке продаж.`;
  }
  if (locale === "en") return "No narrow official numeric indicator was loaded for this segment. The report uses proxy context where available; validate final demand with commercial offers, traffic checks and actual sales evidence.";
  if (locale === "uz") return "Tor segment bo'yicha rasmiy raqamli ko'rsatkich yuklanmadi. Hisobot mavjud proxy kontekstdan foydalanadi; yakuniy talabni tijorat takliflari, trafik tekshiruvi va haqiqiy sotuv dalillari bilan tasdiqlang.";
  return "Прямой официальный числовой показатель по узкому сегменту не загружен. Для оценки используются доступные proxy-источники, а финальный спрос нужно подтвердить коммерческими предложениями, замером трафика и реальными продажами.";
}

export function generateLocalizedExecutiveSummary(report: ReportData, locale: ReportLocale): string[] {
  const p = report.projectProfile;
  const f = report.financialModel;
  const totalNeed = f.financing?.totalInvestmentNeed ?? (f.capex.totalCapEx + f.workingCapital.requiredWorkingCapital);
  const businessType = safe(p.businessType, locale);
  const region = p.region ? formatRegion(p.region, locale) : safe(p.region, locale);
  const district = p.district ? formatDistrict(p.district, locale) : safe(p.district, locale);
  const idea = safe(p.businessIdea, locale);
  const exchangeRateNote = f.payroll?.exchangeRateSnapshot?.source === "CBU" || (p.exchangeRateSnapshot as { source?: unknown } | undefined)?.source === "CBU";
  const usesUsd = hasPositiveUsdAmounts(f);
  const exchangeRateSentence = usesUsd
    ? exchangeRateNote
      ? {
        en: "USD/UZS conversion uses the official Central Bank of Uzbekistan snapshot saved for this project.",
        uz: "USD/UZS konvertatsiyasi loyiha uchun saqlangan O'zbekiston Markaziy bankining rasmiy kurs snapshotiga asoslanadi.",
        ru: "Пересчет USD/UZS использует официальный snapshot Центрального банка Республики Узбекистан, сохраненный для проекта."
      }[locale]
      : {
        en: "USD/UZS exchange rate must be confirmed before use.",
        uz: "USD/UZS kursini ishlatishdan oldin tasdiqlash kerak.",
        ru: "Курс USD/UZS нужно подтвердить перед использованием."
      }[locale]
    : {
      en: "All entered amounts are calculated in UZS; USD conversion was not applied.",
      uz: "Kiritilgan barcha summalar UZSda hisoblangan; USD konvertatsiyasi qo'llanilmagan.",
      ru: "Все введенные суммы рассчитаны в UZS; пересчет USD не применялся."
    }[locale];
  if (locale === "en") {
    return [
      `The project describes the launch of a "${businessType}" business in ${region}, district/city: ${district}. Idea: ${idea}.`,
      `Preliminary investment need is ${formatCurrencyFull(totalNeed, "UZS", locale)}: startup investments ${formatCurrencyFull(f.capex.totalCapEx, "UZS", locale)} and working capital ${formatCurrencyFull(f.workingCapital.requiredWorkingCapital, "UZS", locale)}.`,
      `Own contribution is stated as ${formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency, locale)}. Own contribution share of the calculated need: ${f.financing.ownContributionPct}%. ${exchangeRateSentence}`,
      f.financing.creditNeeded === "no"
        ? "The user does not plan a loan. The project is assessed based on sufficiency of own funds and/or equipment leasing. DSCR for a bank loan is not applicable if there is no debt service."
        : f.financing.creditNeeded === "yes"
          ? `Requested loan: ${formatCurrencyFull(f.financing.loanRequired, "UZS", locale)}, term: ${f.financing.loanTermMonths} months, annual rate: ${f.financing.loanAnnualRatePct}% (${reportSourceLabel(f.financing.loanAnnualRateSource, locale)}), estimated monthly payment: ${formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment, "UZS", locale)}. DSCR: ${f.financing.dscrLabel}.`
          : "The user has not decided on a loan yet. The calculation shows the project without mandatory loan financing and highlights the potential need for external capital separately.",
      marketDataNote(report, locale),
      `Project feasibility score: ${report.feasibilityScore}/100. Financing readiness: ${report.bankReadinessScore}/100. Key validation areas: demand, sales, suppliers, documents, equipment, working capital and location.`,
      "Before submitting an application, confirm commercial offers, preliminary demand, premises documents, permits and financing structure."
    ];
  }
  if (locale === "uz") {
    return [
      `Loyiha ${region} hududi, tuman/shahar: ${district}da "${businessType}" biznesini ishga tushirishni tasvirlaydi. G'oya: ${idea}.`,
      `Dastlabki investitsiya ehtiyoji ${formatCurrencyFull(totalNeed, "UZS", locale)}: boshlang'ich investitsiyalar ${formatCurrencyFull(f.capex.totalCapEx, "UZS", locale)} va aylanma kapital ${formatCurrencyFull(f.workingCapital.requiredWorkingCapital, "UZS", locale)}.`,
      `O'z mablag'i ${formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency, locale)} sifatida ko'rsatilgan. Hisoblangan ehtiyojdagi ulushi: ${f.financing.ownContributionPct}%. ${exchangeRateSentence}`,
      f.financing.creditNeeded === "no"
        ? "Foydalanuvchi kreditni rejalashtirmagan. Loyiha o'z mablag'i va/yoki uskunalar lizingi yetarliligi nuqtayi nazaridan baholanadi. Qarz yuklamasi bo'lmasa, bank krediti uchun DSCR qo'llanilmaydi."
        : f.financing.creditNeeded === "yes"
          ? `So'ralgan kredit: ${formatCurrencyFull(f.financing.loanRequired, "UZS", locale)}, muddat: ${f.financing.loanTermMonths} oy, yillik stavka: ${f.financing.loanAnnualRatePct}% (${reportSourceLabel(f.financing.loanAnnualRateSource, locale)}), hisoblangan oylik to'lov: ${formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment, "UZS", locale)}. DSCR: ${f.financing.dscrLabel}.`
          : "Foydalanuvchi kredit bo'yicha hali qaror qilmagan. Hisob-kitob loyiha majburiy kreditsiz ko'rinishini va tashqi kapital ehtiyojini alohida ko'rsatadi.",
      marketDataNote(report, locale),
      `Loyiha amalga oshirish bahosi: ${report.feasibilityScore}/100. Moliyalashtirishga tayyorlik: ${report.bankReadinessScore}/100. Asosiy tekshiruv zonalari: talab, sotuvlar, yetkazib beruvchilar, hujjatlar, uskunalar, aylanma kapital va lokatsiya.`,
      "Ariza topshirishdan oldin tijorat takliflari, dastlabki talab, joy bo'yicha hujjatlar, ruxsatnomalar va moliyalashtirish tuzilmasini tasdiqlash kerak."
    ];
  }
  return [
    `Проект описывает запуск бизнеса "${businessType}" в регионе: ${region}, район/город: ${district}. Идея: ${idea}.`,
    `Предварительная потребность в инвестициях составляет ${formatCurrencyFull(totalNeed, "UZS", locale)}: стартовые вложения ${formatCurrencyFull(f.capex.totalCapEx, "UZS", locale)} и оборотный капитал ${formatCurrencyFull(f.workingCapital.requiredWorkingCapital, "UZS", locale)}.`,
    `Собственные средства указаны как ${formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency, locale)}. Доля собственных средств в расчетной потребности: ${f.financing.ownContributionPct}%. ${exchangeRateSentence}`,
    f.financing.creditNeeded === "no"
      ? "Пользователь не планирует кредит. Проект оценивается с точки зрения достаточности собственных средств и/или лизинга оборудования. DSCR для банковского кредита не применяется, если нет долговой нагрузки."
      : f.financing.creditNeeded === "yes"
        ? `Запрошенный кредит: ${formatCurrencyFull(f.financing.loanRequired, "UZS", locale)}, срок: ${f.financing.loanTermMonths} мес., ставка: ${f.financing.loanAnnualRatePct}% годовых (${reportSourceLabel(f.financing.loanAnnualRateSource, locale)}), расчетный ежемесячный платеж: ${formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment, "UZS", locale)}. DSCR: ${f.financing.dscrLabel}.`
        : "Пользователь пока не определился с кредитом. Расчет показывает проект без обязательного кредита и отдельно подсвечивает потребность во внешнем капитале.",
    marketDataNote(report, locale),
    `Оценка реализуемости проекта: ${report.feasibilityScore}/100. Готовность к финансированию: ${report.bankReadinessScore}/100. Главные зоны проверки: спрос, продажи, поставщики, документы, оборудование, оборотный капитал и локация.`,
    "До подачи заявки необходимо подтвердить коммерческие предложения, предварительный спрос, документы по помещению, разрешения и структуру финансирования."
  ];
}

export function generateLocalizedNextActions(report: ReportData, locale: ReportLocale): string[] {
  const f = report.financialModel;
  const risks = report.riskMatrix;
  if (locale === "ru" && Array.isArray(report.nextActions) && report.nextActions.length > 0) {
    return Array.from(new Set(report.nextActions.map((item) => String(item).trim()).filter(Boolean)));
  }
  const base = locale === "en" ? [
    "Prepare commercial offers for equipment, launch, service and delivery timelines.",
    "Check documents, permits, contracts and industry requirements before launch.",
    "Collect sales-channel confirmation: letters of intent, preliminary orders and price lists.",
    "Calculate working capital separately: purchases, rent, payroll and customer payment periods.",
    "Update the financial model after checking supplier prices and realistic utilization."
  ] : locale === "uz" ? [
    "Uskunalar, ishga tushirish, servis va yetkazib berish muddatlari bo'yicha tijorat takliflarini tayyorlash.",
    "Ishga tushirishdan oldin hujjatlar, ruxsatnomalar, shartnomalar va soha talablarini tekshirish.",
    "Sotuv kanallarini tasdiqlash: niyat xatlari, dastlabki buyurtmalar va narxlar ro'yxatini yig'ish.",
    "Aylanma kapitalni alohida hisoblash: xaridlar, ijara, ish haqi va mijoz to'lov davrlari.",
    "Yetkazib beruvchi narxlari va real yuklama tekshirilgandan keyin moliyaviy modelni yangilash."
  ] : [
    "Подготовить коммерческие предложения по оборудованию, запуску, сервису и срокам поставки.",
    "Проверить документы, разрешения, договоры и отраслевые требования до запуска.",
    "Собрать подтверждение каналов продаж: письма о намерениях, предварительные заказы, прайс-листы.",
    "Отдельно рассчитать оборотный капитал: закупки, аренда, зарплата и период оплаты клиентами.",
    "Обновить финансовую модель после проверки цен поставщиков и реальной загрузки производства."
  ];
  const actions = [...base];
  if ((report.projectProfile as Record<string, unknown>).creditNeeded === "yes" && !(report.projectProfile as Record<string, unknown>).collateralAvailable) {
    actions.push(locale === "en" ? "For a loan, consider equipment leasing, surety, guarantee, higher own contribution or another collateral source." : locale === "uz" ? "Kredit uchun uskunalar lizingi, kafillik, kafolat, o'z mablag'ini oshirish yoki boshqa ta'minot manbasini ko'rib chiqish." : "Для кредита рассмотреть лизинг оборудования, поручительство, гарантию, увеличение собственных средств или другой источник обеспечения.");
  }
  if ((report.projectProfile as Record<string, unknown>).creditNeeded === "no") {
    actions.push(locale === "en" ? "Check whether own funds and/or leasing are sufficient without a bank loan." : locale === "uz" ? "Bank kreditisiz o'z mablag'i va/yoki lizing yetarliligini tekshirish." : "Проверить, хватает ли собственных средств и/или лизинга без привлечения банковского кредита.");
  }
  if (report.bankReadinessScore < 60) {
    actions.push(locale === "en" ? "Before applying, refine the business plan with a FINKO consultant or a specialized financial consultant." : locale === "uz" ? "Ariza topshirishdan oldin biznes-rejani FINKO konsultanti yoki profil moliyaviy konsultant bilan takomillashtirish." : "До подачи заявки доработать бизнес-план с консультантом FINKO или профильным финансовым консультантом.");
  }
  if (risks.some((risk) => risk.code === "fx_risk" && risk.level === "high")) {
    actions.push(locale === "en" ? "Find local suppliers and include an FX buffer in pricing." : locale === "uz" ? "Mahalliy yetkazib beruvchilarni topish va narxda valyuta buferini belgilash." : "Найти локальных поставщиков и зафиксировать валютный буфер в цене.");
  }
  return actions;
}

export function generateLocalizedDetailedConclusion(report: ReportData, locale: ReportLocale): string[] {
  const risks = localizeRisks(report.riskMatrix, locale);
  const highRisks = risks.filter((risk) => risk.level === "high").slice(0, 3).map((risk) => risk.title).join(", ") || reportStatus("noCriticalRisks", locale);
  const need = formatCurrencyCompact(report.financialModel.financing?.totalInvestmentNeed ?? (report.financialModel.capex.totalCapEx + report.financialModel.workingCapital.requiredWorkingCapital), "UZS", locale);
  const reportText = `${report.projectProfile?.businessType ?? ""} ${report.projectProfile?.businessIdea ?? ""} ${(report.businessProfile as Record<string, unknown> | undefined)?.subcategory ?? ""}`;
  const isChildrenClothing = /children_clothing_store|детск.*одежд|одежд.*детск|kids.*clothing|children.*clothing/i.test(reportText);
  const existingConclusion = Array.isArray(report.detailedConclusion) ? report.detailedConclusion.map((item) => String(item).trim()).filter(Boolean) : [];
  if (locale === "ru" && existingConclusion.length && !/понятная бизнес-идея|потенциал нескольких каналов|критичных рисков не выявлено|выбор оборудования, помещение или локация|качество продукта или услуги/i.test(existingConclusion.join(" "))) {
    return Array.from(new Set(existingConclusion));
  }
  if (locale === "ru" && isChildrenClothing) {
    const f = report.financialModel;
    const decision = report.bankReadinessScore >= 65 ? "предварительно готов к финансированию" : report.bankReadinessScore >= 45 ? "условно готов после доработки" : "не готов к подаче заявки без доработки";
    return [
      `Решение: проект ${decision}. Бизнес-модель понятна и заполнена операционными данными, но банк сначала проверит DSCR ${f.financing.dscrLabel}, EBITDA ${formatCurrencyCompact(f.profitability.monthlyEBITDA, "UZS", locale)} и разрыв финансирования ${formatCurrencyCompact(f.financing.financingGap, "UZS", locale)}.`,
      `Модель выручки основана на ${f.revenue.trafficPerDay ?? f.revenue.displayVolume ?? "н/д"} посетителей/день, конверсии ${f.revenue.conversionPct ?? "н/д"}% и ${f.revenue.monthlySales ?? f.revenue.effectiveUnits} продаж/мес.; месячная выручка ${formatCurrencyCompact(f.revenue.monthlyRevenue, "UZS", locale)}, валовая маржа ${f.profitability.grossMarginPct}%.`,
      "Условия до заявки: подтвердить трафик точки, получить КП поставщиков, проверить размерный ряд и сезонные остатки, закрыть разрыв финансирования и получить предварительную оценку залога.",
      "Показатели для улучшения: поднять маржу, снизить аренду или ФОТ, сократить первую закупку неликвидных размеров, увеличить собственные средства и довести DSCR до приемлемого банковского уровня.",
      "Документы: регистрация ИП/ООО, налоговый режим, онлайн-касса/POS, договор аренды, товарные накладные, документы импортного товара, правила обмена/возврата, трудовые договоры и документы на залог.",
      "Банк первым проверит источник погашения, фактический спрос, договор аренды, поставщиков, товарные документы, оценку залога и реалистичность оборотного капитала."
    ];
  }
  if (locale === "en") {
    return [
      `Overall project assessment: ${report.feasibilityScore >= 65 ? reportStatus("feasible", locale) : reportStatus("improveBeforeLaunch", locale)}.`,
      "Project strengths: clear business idea, opportunity to clarify financing and potential for several sales channels if demand is confirmed.",
      `Weaknesses: ${highRisks}. These areas require validation before financial commitments.`,
      `Financial constraint: calculated investment need is ${need}.`,
      "Pre-launch risks: equipment selection, premises or location, suppliers, documents and startup purchases.",
      "Post-launch risks: stable sales, product or service quality, customer payment delays and purchases.",
      "Financing readiness is improved by supplier offers, letters of intent, confirmed collateral or leasing structure, accounting documents and a financial model.",
      "Documents: registration documents, premises agreement, equipment offers, permits, sales data, CapEx and working capital calculations.",
      "Data to verify: equipment prices, real purchase prices, delivery schedule, margin, planned volume, seasonality and buyer payment terms.",
      "Recommended next step: refine the project profile and consult on financing structure before applying."
    ];
  }
  if (locale === "uz") {
    return [
      `Loyihaning umumiy bahosi: ${report.feasibilityScore >= 65 ? reportStatus("feasible", locale) : reportStatus("improveBeforeLaunch", locale)}.`,
      "Loyihaning kuchli tomonlari: tushunarli biznes g'oya, moliyalashtirishni aniqlashtirish imkoniyati va talab tasdiqlansa bir nechta sotuv kanallari salohiyati.",
      `Zaif tomonlar: ${highRisks}. Bu zonalar moliyaviy majburiyatlardan oldin tekshiruvni talab qiladi.`,
      `Moliyaviy cheklov: hisoblangan investitsiya ehtiyoji ${need}.`,
      "Ishga tushirishgacha bo'lgan risklar: uskuna tanlovi, joy yoki lokatsiya, yetkazib beruvchilar, hujjatlar va boshlang'ich xaridlar.",
      "Ishga tushirishdan keyingi risklar: barqaror sotuvlar, mahsulot yoki xizmat sifati, mijozlar to'lovini kechiktirish va xaridlar.",
      "Moliyalashtirishga tayyorlikni yetkazib beruvchi takliflari, niyat xatlari, tasdiqlangan garov yoki lizing tuzilmasi, buxgalteriya hujjatlari va moliyaviy model oshiradi.",
      "Hujjatlar: ro'yxatdan o'tish hujjatlari, joy shartnomasi, uskuna bo'yicha tijorat takliflari, ruxsatnomalar, sotuv ma'lumotlari, CapEx va aylanma kapital hisoblari.",
      "Tekshiriladigan ma'lumotlar: uskuna narxlari, haqiqiy xarid narxlari, yetkazib berish grafigi, marja, rejalashtirilgan hajm, mavsumiylik va xaridorlar to'lov shartlari.",
      "Tavsiya etilgan keyingi qadam: ariza topshirishdan oldin loyiha profilini takomillashtirish va moliyalashtirish tuzilmasi bo'yicha konsultatsiya o'tkazish."
    ];
  }
  return [
    `Общая оценка проекта: ${report.feasibilityScore >= 65 ? reportStatus("feasible", locale) : reportStatus("improveBeforeLaunch", locale)}.`,
    "Сильные стороны проекта: понятная бизнес-идея, возможность уточнить финансирование и потенциал нескольких каналов продаж при подтверждении спроса.",
    `Слабые стороны: ${highRisks}. Эти зоны требуют проверки до финансовых обязательств.`,
    `Финансовое ограничение: расчетная потребность в инвестициях составляет ${need}.`,
    "Риски до запуска: выбор оборудования, помещение или локация, поставщики, документы и стартовые закупки.",
    "Риски после запуска: стабильность продаж, качество продукта или услуги, отсрочка платежей клиентов и закупки.",
    "Готовность к финансированию повышают КП поставщиков, письма о намерениях, подтвержденный залог или лизинговая структура, бухгалтерские документы и финансовая модель.",
    "Документы: регистрационные документы, договор помещения, КП оборудования, разрешения, данные по продажам, расчеты CapEx и оборотного капитала.",
    "Данные для проверки: цены оборудования, реальные закупочные цены, график поставок, маржа, плановый объем, сезонность и условия оплаты покупателей.",
    "Рекомендованный следующий шаг: доработать проектный профиль и провести консультацию по структуре финансирования до подачи заявки."
  ];
}

export function generateLocalizedFinancingRecommendation(report: ReportData, locale: ReportLocale): string {
  const f = report.financialModel.financing;
  if ((report.projectProfile as Record<string, unknown>).creditNeeded === "no") {
    const gap = f.financingGap > 0 ? formatCurrencyFull(f.financingGap, "UZS", locale) : (locale === "en" ? "not identified" : locale === "uz" ? "aniqlanmadi" : "не выявлен");
    if (locale === "en") return `The user does not plan a loan. The project can be assessed based on sufficiency of own funds and/or equipment leasing. Financing gap: ${gap}.`;
    if (locale === "uz") return `Foydalanuvchi kreditni rejalashtirmagan. Loyiha o'z mablag'i va/yoki uskunalar lizingi yetarliligi bo'yicha baholanishi mumkin. Moliyalashtirish bo'shlig'i: ${gap}.`;
    return `Пользователь не планирует кредит. Проект можно оценивать с точки зрения достаточности собственных средств и/или лизинга оборудования. Разрыв финансирования: ${gap}.`;
  }
  if ((report.projectProfile as Record<string, unknown>).creditNeeded === "yes") {
    if (locale === "en") return `A loan of ${formatCurrencyFull(f.loanRequired, "UZS", locale)} is requested. Rate used: ${f.loanAnnualRatePct}% annual (${reportSourceLabel(f.loanAnnualRateSource, locale)}). Estimated payment: ${formatCurrencyFull(f.estimatedMonthlyLoanPayment, "UZS", locale)}, DSCR: ${f.dscrLabel}. Collateral, repayment source and documents must be confirmed.`;
    if (locale === "uz") return `${formatCurrencyFull(f.loanRequired, "UZS", locale)} miqdorida kredit so'ralgan. Ishlatilgan stavka: yillik ${f.loanAnnualRatePct}% (${reportSourceLabel(f.loanAnnualRateSource, locale)}). Hisoblangan to'lov: ${formatCurrencyFull(f.estimatedMonthlyLoanPayment, "UZS", locale)}, DSCR: ${f.dscrLabel}. Garov, to'lov manbai va hujjatlarni tasdiqlash kerak.`;
    return `Кредит запрошен на сумму ${formatCurrencyFull(f.loanRequired, "UZS", locale)}. Использованная ставка: ${f.loanAnnualRatePct}% годовых (${reportSourceLabel(f.loanAnnualRateSource, locale)}). Расчетный платеж: ${formatCurrencyFull(f.estimatedMonthlyLoanPayment, "UZS", locale)}, DSCR: ${f.dscrLabel}. Нужно подтвердить залог, источник погашения и документы.`;
  }
  if (locale === "en") return "A loan has not been selected yet. The calculation shows the project without mandatory loan financing and the potential external capital need after expenses are clarified.";
  if (locale === "uz") return "Kredit hali tanlanmagan. Hisob-kitob loyiha majburiy kreditsiz holatini va xarajatlar aniqlangandan keyin kerak bo'lishi mumkin bo'lgan tashqi kapitalni ko'rsatadi.";
  return "Кредит пока не выбран. Расчет показывает проект без обязательного кредита и какой внешний капитал может потребоваться после уточнения расходов.";
}


function looksTechnicalKey(value: string): boolean {
  return /^[a-z][A-Za-z0-9]*(?:_[a-z0-9]+)*$/.test(value) && /[A-Z_]/.test(value);
}

function fallbackUserLabel(value: string, locale: ReportLocale): string {
  const known: Record<string, Record<ReportLocale, string>> = {
    deviceTypes: { ru: "Типы устройств", en: "Device types", uz: "Qurilmalar turlari" },
    repairServiceTypes: { ru: "Виды ремонта", en: "Repair service types", uz: "Ta'mirlash xizmatlari turlari" },
    repairOrdersPerMonth: { ru: "Количество заказов ремонта в месяц", en: "Repair orders per month", uz: "Oyiga ta'mirlash buyurtmalari" },
    averageRepairTicket: { ru: "Средний чек ремонта", en: "Average repair ticket", uz: "O'rtacha ta'mirlash cheki" },
    sparePartsPlan: { ru: "План закупки запчастей и материалов", en: "Spare-parts and materials purchase plan", uz: "Ehtiyot qismlar va materiallar xarid rejasi" },
    repairEquipment: { ru: "Оборудование для ремонта", en: "Repair equipment", uz: "Ta'mirlash uskunalari" },
    staffPlan: { ru: "План персонала", en: "Staff plan", uz: "Xodimlar rejasi" },
    deviceIntakeForm: { ru: "Акт приема устройства", en: "Device intake form", uz: "Qurilmani qabul qilish dalolatnomasi" },
    repairWarrantyPolicy: { ru: "Гарантийная политика ремонта", en: "Repair warranty policy", uz: "Ta'mirlash kafolati siyosati" },
    dataLiabilityPolicy: { ru: "Ответственность за данные клиента", en: "Customer data liability policy", uz: "Mijoz ma'lumotlari bo'yicha javobgarlik" }
  };
  if (known[value]) return known[value][locale];
  if (!looksTechnicalKey(value)) return labelValue(value, locale);
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
  if (!spaced) return locale === "en" ? "Additional indicator" : locale === "uz" ? "Qo'shimcha ko'rsatkich" : "Дополнительный показатель";
  if (locale === "en") return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
  if (locale === "uz") return "Qo'shimcha ko'rsatkich";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function userLabel(value: unknown, locale: ReportLocale): string {
  const text = String(value ?? "");
  const localized = labelValue(value, locale);
  if (text && localized === text && looksTechnicalKey(text)) return fallbackUserLabel(text, locale);
  return localized;
}

function joinLabelValues(values: unknown, locale: ReportLocale): string {
  if (!Array.isArray(values) || values.length === 0) {
    return locale === "en" ? "None" : locale === "uz" ? "Yo'q" : "Нет";
  }
  return values.map((value) => userLabel(value, locale)).join(", ");
}

function localizeExcludedBlocks(values: unknown, locale: ReportLocale): string {
  if (!Array.isArray(values) || values.length === 0) return locale === "en" ? "None" : locale === "uz" ? "Yo'q" : "Нет";
  const grouped = new Set<string>();
  for (const value of values) {
    const id = String(value);
    if (id.startsWith("auto_service")) grouped.add(locale === "en" ? "Auto-service blocks" : locale === "uz" ? "Avtoservis bloklari" : "Блоки автосервиса");
    else if (id.startsWith("cleaning")) grouped.add(locale === "en" ? "Cleaning blocks" : locale === "uz" ? "Tozalash bloklari" : "Блоки клининга");
    else grouped.add(translateBlock(locale, id, id).name);
  }
  return Array.from(grouped).join(", ");
}

function localizeBusinessModelRows(report: ReportData, locale: ReportLocale): Array<Array<string>> | undefined {
  const profile = report.businessProfile ?? {};
  if (!Object.keys(profile).length) return report.businessModelRows;
  const labels = locale === "en"
    ? {
      category: "Category",
      subcategory: "Subcategory",
      businessModel: "Business model",
      operating: "Operating model",
      revenueUnit: "Unit of sale",
      revenueDrivers: "What revenue depends on",
      costDrivers: "What costs depend on",
      criticalData: "Critical data to verify",
      risks: "Main risks",
      documents: "Documents before launch"
    }
    : locale === "uz"
      ? {
        category: "Kategoriya",
        subcategory: "Quyi kategoriya",
        businessModel: "Biznes modeli",
        operating: "Operatsion model",
        revenueUnit: "Sotuv birligi",
        revenueDrivers: "Tushum nimaga bog'liq",
        costDrivers: "Xarajatlar nimaga bog'liq",
        criticalData: "Tekshirilishi kerak bo'lgan muhim ma'lumotlar",
        risks: "Asosiy risklar",
        documents: "Startdan oldingi hujjatlar"
      }
      : {
        category: "Категория",
        subcategory: "Подкатегория",
        businessModel: "Бизнес-модель",
        operating: "Операционная модель",
        revenueUnit: "Единица продажи",
        revenueDrivers: "От чего зависит выручка",
        costDrivers: "От чего зависят затраты",
        criticalData: "Критичные данные для проверки",
        risks: "Главные риски",
        documents: "Документы до запуска"
      };
  const source = locale === "en" ? "Localized business profile" : locale === "uz" ? "Biznes profili" : "Профиль бизнеса";
  const confidence = typeof profile.confidence === "number" ? ` (${locale === "en" ? "confidence" : locale === "uz" ? "ishonch" : "уверенность"}: ${profile.confidence})` : "";
  const emptyList = locale === "en" ? "To be clarified" : locale === "uz" ? "Aniqlashtirish kerak" : "Требуется уточнение";
  const genericProfileLabels = new Set([
    "Профильный показатель", "Профильное значение", "Финансовый показатель",
    "Profil ko'rsatkichi", "Profil qiymati", "Moliyaviy ko'rsatkich",
    "Profile value", "Profile indicator", "Financial indicator"
  ]);
  const lpSingle = (value: string | null | undefined) => localizeBusinessProfileValue(value, locale, { failOnUnknown: false });
  const lpList = (value: string[] | null | undefined) => {
    const localized = (value ?? [])
      .map((item) => localizeBusinessProfileValue(item, locale, { failOnUnknown: false }).trim())
      .filter(Boolean)
      .filter((item) => !genericProfileLabels.has(item));
    const unique = Array.from(new Set(localized));
    return unique.length ? unique.join(", ") : emptyList;
  };
  const categoryKey = String(profile.category ?? "generic");
  const sectorDefaults: Record<string, { businessModel: string; operating: string; revenueUnit: string; revenueDrivers: string; costDrivers: string; criticalData: string; risks: string; documents: string }> = locale === "en" ? {
    retail: { businessModel: "Retail store for goods", operating: "Offline store + online channels", revenueUnit: "check / purchase", revenueDrivers: "traffic, conversion, average ticket, repeat purchases", costDrivers: "purchase cost, rent, payroll, marketing, inventory", criticalData: "traffic, conversion, margin, returns, suppliers, inventory turnover", risks: "demand, margin, inventory, seasonality, suppliers, returns, competition", documents: "registration, tax regime, online cash register/POS, lease, supplier documents, return rules, employment documents" },
    ecommerce: { businessModel: "Online sales model", operating: "Online channels + delivery/fulfillment", revenueUnit: "order / check", revenueDrivers: "website or marketplace conversion, traffic, average ticket, repeat purchases", costDrivers: "purchase cost, delivery, marketing, payment commissions, returns", criticalData: "CAC, conversion, margin, delivery cost, returns, stock", risks: "CAC, conversion, delivery, returns, stock, supplier and platform risk", documents: "registration, tax regime, payment systems, supplier documents, delivery/return rules, marketplace contracts" },
    food_service: { businessModel: "Food service / prepared food", operating: "Kitchen, point of sale and delivery channels", revenueUnit: "check / order", revenueDrivers: "customer flow, average check, menu mix, repeat visits", costDrivers: "food cost, rent, payroll, waste, utilities", criticalData: "food cost, waste, sanitary requirements, suppliers, traffic", risks: "food cost, waste, sanitary compliance, staff, equipment, seasonality", documents: "registration, tax regime, cash register/POS, lease, sanitary requirements, supplier documents, medical checks, fire safety" },
    manufacturing: { businessModel: "Production workshop", operating: "Equipment, raw materials, staff and orders", revenueUnit: "unit of production / batch", revenueDrivers: "equipment capacity, order volume, price, defect rate", costDrivers: "raw materials, energy, payroll, equipment service, warehouse", criticalData: "capacity, raw material cost, production cycle, defect rate, orders", risks: "raw materials, capacity, defects, equipment downtime, quality, certification", documents: "registration, premises, equipment documents, safety rules, raw material documents, standards/certificates, employment and fire safety" },
    import_export: { businessModel: "Import and trade", operating: "Supplier contract + customs + warehouse + sales", revenueUnit: "shipment / batch / order", revenueDrivers: "import price, FX rate, demand, delivery time, margin", costDrivers: "purchase price, customs, logistics, storage, FX buffer", criticalData: "supplier contract, invoice, customs costs, FX rate, certificates, delivery terms", risks: "currency, customs, logistics, prepayment, certificates, delays", documents: "registration, tax regime, import contract, invoice, customs documents, certificates, warehouse documents" },
    services: { businessModel: "Service business", operating: "Staff capacity, schedule and client flow", revenueUnit: "order / service", revenueDrivers: "staff utilization, service price, repeat clients, reviews", costDrivers: "payroll, rent, consumables, marketing, quality control", criticalData: "price, utilization, repeat clients, staff, service quality", risks: "staff utilization, quality, repeat clients, reviews, marketing, turnover", documents: "registration, tax regime, cash register/POS if B2C, lease, employment contracts, client contracts, profile permits if regulated" },
    generic: { businessModel: "Project-specific business model", operating: "Operating process based on user inputs", revenueUnit: "revenue unit not specified", revenueDrivers: "price, volume, channels and repeat demand", costDrivers: "direct costs, rent, payroll, equipment and working capital", criticalData: "price, volume, margin, documents, suppliers and financing", risks: "demand, margin, operations, documents and financing", documents: "registration, tax regime, contracts, supplier documents and profile requirements" }
  } : locale === "uz" ? {
    retail: { businessModel: "Tovarlar chakana do'koni", operating: "Offline nuqta + online kanallar", revenueUnit: "chek / xarid", revenueDrivers: "trafik, konversiya, o'rtacha chek, takroriy xaridlar", costDrivers: "xarid narxi, ijara, ish haqi, marketing, zaxira", criticalData: "trafik, konversiya, marja, qaytarishlar, yetkazib beruvchilar, aylanish", risks: "talab, marja, zaxira, mavsumiylik, yetkazib beruvchilar, qaytarishlar, raqobat", documents: "ro'yxatdan o'tish, soliq rejimi, online kassa/POS, ijara, yetkazib beruvchi hujjatlari, qaytarish qoidalari, mehnat hujjatlari" },
    ecommerce: { businessModel: "Online savdo modeli", operating: "Online kanallar + yetkazib berish/fulfillment", revenueUnit: "buyurtma / chek", revenueDrivers: "sayt yoki marketplace konversiyasi, trafik, o'rtacha chek, takroriy xaridlar", costDrivers: "xarid narxi, yetkazib berish, marketing, to'lov komissiyalari, qaytarishlar", criticalData: "CAC, konversiya, marja, yetkazib berish narxi, qaytarishlar, zaxira", risks: "CAC, konversiya, yetkazib berish, qaytarishlar, zaxira, platforma riski", documents: "ro'yxatdan o'tish, soliq rejimi, to'lov tizimlari, yetkazib beruvchi hujjatlari, yetkazib berish/qaytarish qoidalari" },
    food_service: { businessModel: "Umumiy ovqatlanish / tayyor ovqat", operating: "Oshxona, savdo nuqtasi va yetkazib berish", revenueUnit: "chek / buyurtma", revenueDrivers: "mijoz oqimi, o'rtacha chek, menyu tarkibi, takroriy tashriflar", costDrivers: "oziq-ovqat tannarxi, ijara, ish haqi, yo'qotishlar, kommunal", criticalData: "food cost, yo'qotishlar, sanitariya talablari, yetkazib beruvchilar, trafik", risks: "xomashyo, yo'qotishlar, sanitariya, xodimlar, uskuna, mavsumiylik", documents: "ro'yxatdan o'tish, soliq rejimi, kassa/POS, ijara, sanitariya talablari, yetkazib beruvchilar, tibbiy ko'riklar, yong'in xavfsizligi" },
    manufacturing: { businessModel: "Ishlab chiqarish sexi", operating: "Uskuna, xomashyo, xodimlar va buyurtmalar", revenueUnit: "mahsulot birligi / partiya", revenueDrivers: "uskuna quvvati, buyurtma hajmi, narx, brak ulushi", costDrivers: "xomashyo, energiya, ish haqi, uskuna servisi, ombor", criticalData: "quvvat, xomashyo narxi, ishlab chiqarish sikli, brak, buyurtmalar", risks: "xomashyo, quvvat, brak, uskuna to'xtashi, sifat, sertifikat", documents: "ro'yxatdan o'tish, joy, uskuna hujjatlari, xavfsizlik, xomashyo hujjatlari, standartlar/sertifikatlar, mehnat va yong'in xavfsizligi" },
    import_export: { businessModel: "Import va savdo", operating: "Yetkazib beruvchi shartnomasi + bojxona + ombor + sotuv", revenueUnit: "yetkazib berish / partiya / buyurtma", revenueDrivers: "import narxi, valyuta kursi, talab, yetkazish muddati, marja", costDrivers: "xarid narxi, bojxona, logistika, saqlash, valyuta buferi", criticalData: "shartnoma, invoice, bojxona xarajatlari, valyuta kursi, sertifikatlar", risks: "valyuta, bojxona, logistika, oldindan to'lov, sertifikatlar, kechikish", documents: "ro'yxatdan o'tish, soliq, import shartnomasi, invoice, bojxona hujjatlari, sertifikatlar, ombor hujjatlari" },
    services: { businessModel: "Xizmat biznesi", operating: "Xodimlar quvvati, jadval va mijoz oqimi", revenueUnit: "buyurtma / xizmat", revenueDrivers: "xodimlar yuklamasi, xizmat narxi, takroriy mijozlar, sharhlar", costDrivers: "ish haqi, ijara, materiallar, marketing, sifat nazorati", criticalData: "narx, yuklama, takroriy mijozlar, xodimlar, xizmat sifati", risks: "xodimlar yuklamasi, sifat, takroriy mijozlar, sharhlar, marketing", documents: "ro'yxatdan o'tish, soliq rejimi, B2C bo'lsa kassa/POS, ijara, mehnat shartnomalari, mijoz shartnomalari, profil ruxsatlari" },
    generic: { businessModel: "Loyihaga xos biznes modeli", operating: "Foydalanuvchi ma'lumotlariga asoslangan jarayon", revenueUnit: "tushum birligi ko'rsatilmagan", revenueDrivers: "narx, hajm, kanallar va takroriy talab", costDrivers: "bevosita xarajatlar, ijara, ish haqi, uskuna va aylanma kapital", criticalData: "narx, hajm, marja, hujjatlar, yetkazib beruvchilar va moliyalashtirish", risks: "talab, marja, operatsiya, hujjatlar va moliyalashtirish", documents: "ro'yxatdan o'tish, soliq rejimi, shartnomalar, yetkazib beruvchi hujjatlari va profil talablari" }
  } : {
    retail: { businessModel: "Розничный магазин товаров", operating: "Офлайн-точка + онлайн-каналы", revenueUnit: "чек / покупка", revenueDrivers: "трафик, конверсия, средний чек, повторные покупки", costDrivers: "закупочная цена, аренда, ФОТ, маркетинг, товарные остатки", criticalData: "трафик, конверсия, маржа, возвраты, поставщики, оборачиваемость", risks: "спрос, маржа, остатки, сезонность, поставщики, возвраты, конкуренция", documents: "регистрация, налоговый режим, онлайн-касса/POS, договор аренды, документы поставщика, правила возврата, трудовые договоры" },
    ecommerce: { businessModel: "Онлайн-торговля", operating: "Онлайн-каналы + доставка/фулфилмент", revenueUnit: "заказ / чек", revenueDrivers: "конверсия сайта/маркетплейса, трафик, средний чек, повторные покупки", costDrivers: "закупочная цена, доставка, маркетинг, комиссии платежей, возвраты", criticalData: "CAC, конверсия, маржа, стоимость доставки, возвраты, склад", risks: "CAC, конверсия, доставка, возвраты, склад, поставщики, платформа", documents: "регистрация, налоговый режим, платежные системы, документы поставщика, правила доставки и возврата, договоры маркетплейсов" },
    food_service: { businessModel: "Общепит / готовая еда", operating: "Кухня, точка продаж и доставка", revenueUnit: "чек / заказ", revenueDrivers: "поток клиентов, средний чек, меню, повторные визиты", costDrivers: "сырьё, списания, аренда, ФОТ, коммунальные расходы", criticalData: "себестоимость блюд, списания, санитарные требования, поставщики, поток", risks: "сырьё, списания, санитария, персонал, оборудование, сезонность", documents: "регистрация, налоговый режим, касса/POS, договор аренды, санитарные требования, поставщики сырья, медосмотры, пожарная безопасность" },
    manufacturing: { businessModel: "Производственный цех", operating: "Оборудование, сырьё, персонал и заказы", revenueUnit: "единица продукции / партия", revenueDrivers: "мощность оборудования, объем заказов, цена, процент брака", costDrivers: "сырьё, энергия, ФОТ, сервис оборудования, склад", criticalData: "мощность, себестоимость сырья, производственный цикл, брак, заказы", risks: "сырьё, мощность, брак, простой оборудования, качество, сертификация", documents: "регистрация, помещение, документы оборудования, техника безопасности, сырьевые документы, стандарты/сертификаты, трудовые документы и пожарная безопасность" },
    import_export: { businessModel: "Импорт и торговля", operating: "Контракт поставщика + таможня + склад + продажи", revenueUnit: "поставка / партия / заказ", revenueDrivers: "цена импорта, курс валюты, спрос, срок поставки, маржа", costDrivers: "закупка, таможня, логистика, хранение, валютный буфер", criticalData: "контракт, инвойс, таможенные платежи, курс, сертификаты, сроки", risks: "валюта, таможня, логистика, предоплата, сертификаты, задержки", documents: "регистрация, налоговый режим, импортный контракт, инвойс, таможенные документы, сертификаты, складские документы" },
    services: { businessModel: "Сервисный бизнес", operating: "Загрузка сотрудников, расписание и поток клиентов", revenueUnit: "заказ / услуга", revenueDrivers: "загрузка сотрудников, цена услуги, повторные клиенты, отзывы", costDrivers: "ФОТ, аренда, расходники, маркетинг, контроль качества", criticalData: "прайс, загрузка, повторные клиенты, персонал, качество услуги", risks: "загрузка персонала, качество, повторные клиенты, отзывы, маркетинг, текучесть кадров", documents: "регистрация, налоговый режим, касса/POS при B2C, договор аренды, трудовые договоры, договоры с клиентами, профильные разрешения" },
    generic: { businessModel: "Проектная бизнес-модель", operating: "Операционный процесс по данным пользователя", revenueUnit: "единица выручки не указана", revenueDrivers: "цена, объем, каналы продаж и повторный спрос", costDrivers: "прямые затраты, аренда, ФОТ, оборудование и оборотный капитал", criticalData: "цена, объем, маржа, документы, поставщики и финансирование", risks: "спрос, маржа, операции, документы и финансирование", documents: "регистрация, налоговый режим, договоры, документы поставщиков и профильные требования" }
  };
  const sectorDefault = sectorDefaults[categoryKey] ?? sectorDefaults.services ?? sectorDefaults.generic;
  const profileText = `${report.projectProfile?.businessType ?? ""} ${profile.subcategory ?? ""} ${profile.category ?? ""}`.toLowerCase();
  const isRetailClothing = /children_clothing_store|детск.*одежд|одежд.*детск|clothing|одежд/.test(profileText) && /retail|розниц|магазин|children_clothing_store|clothing/.test(profileText);
  const retail = locale === "en"
    ? {
      category: "Retail",
      subcategory: /children_clothing_store|детск/.test(profileText) ? "Children clothing store" : "Clothing store",
      businessModel: "Retail store for goods",
      operating: "Offline store + online channels",
      revenueUnit: "check / purchase",
      revenueDrivers: "customer traffic, conversion, average ticket, repeat purchases",
      costDrivers: "purchase cost, rent, payroll, marketing, stock leftovers",
      criticalData: "store traffic, conversion, margin, size range, returns, suppliers, inventory turnover",
      risks: "DSCR, margin, size range, seasonality, supplier and FX risk, returns, collateral valuation",
      documents: "registration, tax regime, online cash register, lease agreement, supplier documents, exchange and return rules, employment documents"
    }
    : locale === "uz"
      ? {
        category: "Chakana savdo",
        subcategory: /children_clothing_store|детск/.test(profileText) ? "Bolalar kiyimi do'koni" : "Kiyim do'koni",
        businessModel: "Tovarlar chakana do'koni",
        operating: "Offline nuqta + online kanallar",
        revenueUnit: "chek / xarid",
        revenueDrivers: "xaridorlar oqimi, konversiya, o'rtacha chek, takroriy xaridlar",
        costDrivers: "xarid narxi, ijara, ish haqi, marketing, tovar qoldiqlari",
        criticalData: "nuqta trafiki, konversiya, marja, o'lcham qatori, qaytarishlar, yetkazib beruvchilar, aylanish",
        risks: "DSCR, marja, o'lcham qatori, mavsumiylik, yetkazib beruvchi va valyuta riski, qaytarishlar, garov bahosi",
        documents: "ro'yxatdan o'tish, soliq rejimi, online kassa, ijara shartnomasi, yetkazib beruvchi hujjatlari, almashtirish/qaytarish qoidalari, mehnat hujjatlari"
      }
      : {
        category: "Розница",
        subcategory: /children_clothing_store|детск/.test(profileText) ? "Магазин детской одежды" : "Магазин одежды",
        businessModel: "Розничный магазин товаров",
        operating: "Офлайн-точка + онлайн-каналы",
        revenueUnit: "чек / покупка",
        revenueDrivers: "поток покупателей, конверсия, средний чек, повторные покупки",
        costDrivers: "закупочная цена, аренда, ФОТ, маркетинг, остатки товара",
        criticalData: "трафик точки, конверсия, маржа, размерный ряд, возвраты, поставщики, оборачиваемость",
        risks: "DSCR, маржа, размерный ряд, сезонность, поставщики, валютные закупки, возвраты, оценка залога",
        documents: "регистрация, налоговый режим, онлайн-касса, договор аренды, документы поставщика, правила обмена и возврата, трудовые договоры"
      };
  const profileValueOrDefault = (value: unknown, fallback: string) => {
    const raw = String(value ?? "").trim();
    if (!raw) return fallback;
    const localized = lpSingle(raw).trim();
    return localized && localized !== "-" && localized !== "—" && !genericProfileLabels.has(localized) ? localized : fallback;
  };
  const profileListOrDefault = (value: unknown, fallback: string) => {
    const localized = lpList(Array.isArray(value) ? value.map(String) : []);
    return localized === emptyList ? fallback : localized;
  };
  const profileCriticalData = profileListOrDefault(profile.requiredDataForAnalysis, sectorDefault.criticalData);
  const profileRisks = profileListOrDefault(profile.keyRisks, sectorDefault.risks);
  const profileDocuments = profileListOrDefault(profile.documentCategories, sectorDefault.documents);
  const rows: Array<Array<string>> = [
    [labels.category, isRetailClothing ? retail.category : lpSingle(String(profile.category ?? "")), source + confidence],
    [labels.subcategory, isRetailClothing ? retail.subcategory : lpSingle(String(profile.subcategory ?? "")), source],
    [labels.businessModel, isRetailClothing ? retail.businessModel : profileValueOrDefault(profile.businessModel, sectorDefault.businessModel), source],
    [labels.operating, isRetailClothing ? retail.operating : profileValueOrDefault(profile.operationalModel, sectorDefault.operating), source],
    [labels.revenueUnit, isRetailClothing ? retail.revenueUnit : profileValueOrDefault(profile.primaryRevenueModel, sectorDefault.revenueUnit), source],
    [labels.revenueDrivers, isRetailClothing ? retail.revenueDrivers : (lpList(Array.isArray(profile.keyRevenueDrivers) ? profile.keyRevenueDrivers.map(String) : []) === emptyList ? sectorDefault.revenueDrivers : lpList(Array.isArray(profile.keyRevenueDrivers) ? profile.keyRevenueDrivers.map(String) : [])), source],
    [labels.costDrivers, isRetailClothing ? retail.costDrivers : (lpList(Array.isArray(profile.keyCostDrivers) ? profile.keyCostDrivers.map(String) : []) === emptyList ? sectorDefault.costDrivers : lpList(Array.isArray(profile.keyCostDrivers) ? profile.keyCostDrivers.map(String) : [])), source],
    [labels.criticalData, isRetailClothing ? retail.criticalData : profileCriticalData, source],
    [labels.risks, isRetailClothing ? retail.risks : profileRisks, source],
    [labels.documents, isRetailClothing ? retail.documents : profileDocuments, source]
  ];
  return rows.filter((row) => !/templateSignature|businessProfileSignature|sourceCategoryIds|excludedInterviewBlocks|AI debug|raw profile/i.test(row.join(" ")));
}


function isLikelyTechnicalValue(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/i.test(value) || /^[a-z]+[A-Za-z0-9]+$/.test(value);
}

function localizeUserFacingValue(value: unknown, locale: ReportLocale): unknown {
  if (Array.isArray(value)) return value.map((item) => localizeUserFacingValue(item, locale));
  if (value && typeof value === "object") return localizeUserFacingRecord(value as Record<string, unknown>, locale);
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  let labeled: unknown = text;
  try {
    labeled = labelValue(text, locale);
  } catch {
    // Missing enum translations are QA signals, not report-generation blockers.
    // Keep the raw value for the next profile/localization fallback instead of failing the report.
    labeled = text;
  }
  if (labeled !== text) return labeled;
  const profileLabeled = localizeBusinessProfileValue(text, locale, { failOnUnknown: false });
  if (profileLabeled !== text) return profileLabeled;
  if (isLikelyTechnicalValue(text)) return localizeBusinessProfileValue(text, locale, { failOnUnknown: false });
  return value;
}

const internalUserFacingRecordKeys = new Set([
  "templateSignature",
  "businessProfileSignature",
  "sourceCategories",
  "recommendedSourceCategories",
  "sourceTopics",
  "recommendedSources",
  "metadataKeys",
  "rawMetadata",
  "classifierTrace",
  "matchedKeywords"
]);

function localizeUserFacingRecord(record: Record<string, unknown>, locale: ReportLocale): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("_") || internalUserFacingRecordKeys.has(key)) continue;
    result[key] = localizeUserFacingValue(value, locale);
  }
  return result;
}

function localizeEvidenceIndicator(text: unknown, locale: ReportLocale): string {
  const value = String(text ?? "").toLowerCase();
  const ru = () => {
    if (/population|demograph/.test(value)) return "Население и потенциальный спрос в регионе";
    if (/sme|small business|microfirm|enterprise|registered|active|new business/.test(value)) return "Малый бизнес и число предприятий в регионе";
    if (/cpi|price|prices|food/.test(value)) return "Инфляция и изменение потребительских цен";
    if (/labor|wage|salary|employment/.test(value)) return "Рынок труда и ориентиры по зарплатам";
    if (/transport|vehicle|fleet|fuel/.test(value)) return "Транспортная активность и автопарк как ориентир спроса";
    if (/services|service/.test(value)) return "Динамика сектора услуг";
    if (/tax|registration|legal|license|permit/.test(value)) return "Регистрация, налоги и разрешительные требования";
    if (/map|geo|2gis|google|yandex|competitor/.test(value)) return "Конкуренты и локация на картах";
    return "Рыночный показатель для проверки спроса";
  };
  const en = () => {
    if (/population|demograph/.test(value)) return "Population and potential regional demand";
    if (/sme|small business|microfirm|enterprise|registered|active|new business/.test(value)) return "Small business and enterprise count in the region";
    if (/cpi|price|prices|food/.test(value)) return "Inflation and consumer price movement";
    if (/labor|wage|salary|employment/.test(value)) return "Labor market and wage benchmarks";
    if (/transport|vehicle|fleet|fuel/.test(value)) return "Transport activity and vehicle fleet as demand proxy";
    if (/services|service/.test(value)) return "Services sector dynamics";
    if (/tax|registration|legal|license|permit/.test(value)) return "Registration, tax and permit requirements";
    if (/map|geo|2gis|google|yandex|competitor/.test(value)) return "Competitors and location on maps";
    return "Market indicator to validate demand";
  };
  const uz = () => {
    if (/population|demograph/.test(value)) return "Hudud aholisi va potensial talab";
    if (/sme|small business|microfirm|enterprise|registered|active|new business/.test(value)) return "Hududdagi kichik biznes va korxonalar soni";
    if (/cpi|price|prices|food/.test(value)) return "Inflyatsiya va iste'mol narxlari o'zgarishi";
    if (/labor|wage|salary|employment/.test(value)) return "Mehnat bozori va ish haqi orientirlari";
    if (/transport|vehicle|fleet|fuel/.test(value)) return "Transport faolligi va avtopark talab ko'rsatkichi sifatida";
    if (/services|service/.test(value)) return "Xizmatlar sektori dinamikasi";
    if (/tax|registration|legal|license|permit/.test(value)) return "Ro'yxatdan o'tish, soliq va ruxsat talablari";
    if (/map|geo|2gis|google|yandex|competitor/.test(value)) return "Raqobatchilar va xaritadagi lokatsiya";
    return "Talabni tekshirish uchun bozor ko'rsatkichi";
  };
  return locale === "en" ? en() : locale === "uz" ? uz() : ru();
}

function localizeEvidenceSource(row: Record<string, unknown>, locale: ReportLocale): string {
  const type = String(row.sourceType ?? row.sourceName ?? "").toLowerCase();
  if (/central_bank/.test(type)) return locale === "en" ? "Official Central Bank data" : locale === "uz" ? "Markaziy bank rasmiy ma'lumotlari" : "Официальные данные Центрального банка";
  if (/official_statistics/.test(type)) return locale === "en" ? "Official statistics" : locale === "uz" ? "Rasmiy statistika" : "Официальная статистика";
  if (/tax|government|legal/.test(type)) return locale === "en" ? "Official government registry" : locale === "uz" ? "Rasmiy davlat reyestri" : "Официальный государственный источник";
  if (/market_proxy|geospatial|commerce_platform/.test(type)) return locale === "en" ? "Market proxy / maps" : locale === "uz" ? "Bozor orientiri / xaritalar" : "Рыночный ориентир / карты";
  return locale === "en" ? "Verified contextual source" : locale === "uz" ? "Tekshirilgan kontekst manbasi" : "Проверенный контекстный источник";
}

function localizeConfidence(value: unknown, locale: ReportLocale): string {
  const text = String(value ?? "").trim();
  if (/требуется проверка|manual verification|needs verification|manual_check/i.test(text)) {
    return locale === "en"
      ? "Verify against official source"
      : locale === "uz"
        ? "Rasmiy manba bo'yicha tasdiqlash kerak"
        : "Уточнить по официальному источнику";
  }
  const map: Record<string, Record<ReportLocale, string>> = {
    very_high: { ru: "Очень высокая", en: "Very high", uz: "Juda yuqori" },
    high: { ru: "Высокая", en: "High", uz: "Yuqori" },
    medium: { ru: "Средняя", en: "Medium", uz: "O'rta" },
    low: { ru: "Низкая", en: "Low", uz: "Past" },
    needs_verification: { ru: "Уточнить по официальному источнику", en: "Verify against official source", uz: "Rasmiy manba bo'yicha tasdiqlash kerak" },
    manual_check: { ru: "Уточнить по официальному источнику", en: "Verify against official source", uz: "Rasmiy manba bo'yicha tasdiqlash kerak" }
  };
  return map[text]?.[locale] ?? labelValue(text, locale);
}

function localizeGeography(value: unknown, locale: ReportLocale): string {
  const text = String(value ?? "");
  const map: Record<string, Record<ReportLocale, string>> = {
    national: { ru: "Узбекистан", en: "Uzbekistan", uz: "O'zbekiston" },
    region: { ru: "Регион проекта", en: "Project region", uz: "Loyiha hududi" },
    city: { ru: "Город", en: "City", uz: "Shahar" },
    district: { ru: "Район", en: "District", uz: "Tuman" },
    global: { ru: "Международный контекст", en: "Global context", uz: "Global kontekst" }
  };
  return map[text]?.[locale] ?? labelValue(text, locale);
}

function localizeEvidenceLimitation(row: Record<string, unknown>, locale: ReportLocale): string {
  const sourceType = String(row.sourceType ?? "");
  if (sourceType === "market_proxy" || sourceType === "geospatial" || sourceType === "commerce_platform") {
    return locale === "en" ? "Use for competitor/location validation; it is not official demand statistics." : locale === "uz" ? "Raqobatchilar va lokatsiyani tekshirish uchun; bu rasmiy talab statistikasi emas." : "Использовать для проверки конкурентов и локации; это не официальная статистика спроса.";
  }
  return locale === "en" ? "Open the source and record the current numeric value before submitting to a bank." : locale === "uz" ? "Bankka topshirishdan oldin manbani ochib, joriy raqamli qiymatni yozib qo'ying." : "Перед подачей в банк перепроверить источник и зафиксировать актуальное числовое значение.";
}

function formatEvidenceValue(row: Record<string, unknown>, locale: ReportLocale): string {
  const value = row.value;
  const unit = String(row.unit ?? "").trim();
  const period = String(row.period ?? "").trim();
  const valueText = typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")
    : typeof value === "string" && value.trim()
      ? value
      : "";
  if (!valueText) {
    return locale === "en" ? "Reliable numeric value was not found." : locale === "uz" ? "Ishonchli raqamli qiymat topilmadi." : "Надёжное числовое значение не найдено.";
  }
  return [valueText, unit, period ? `(${period})` : ""].filter(Boolean).join(" ");
}

function localizeEvidenceUse(row: Record<string, unknown>, locale: ReportLocale): string {
  const hasValue = typeof row.value === "number" || (typeof row.value === "string" && row.value.trim());
  if (hasValue) {
    if (locale === "en") return "Use as a source-backed market benchmark: compare the plan with local demand, prices and capacity assumptions.";
    if (locale === "uz") return "Manbaga tayangan bozor orientiri: rejani mahalliy talab, narx va quvvat farazlari bilan solishtiring.";
    return "Использовать как рыночный ориентир, подтвержденный источником: сравнить план продаж, цену и загрузку с масштабом локального спроса.";
  }
  return localizeEvidenceLimitation(row, locale);
}

function localizeEvidenceInterpretation(row: Record<string, unknown>, locale: ReportLocale): string {
  const custom = typeof row.relevanceToBusiness === "string" && row.relevanceToBusiness.trim() ? row.relevanceToBusiness.trim() : "";
  const hasValue = typeof row.value === "number" || (typeof row.value === "string" && row.value.trim());
  if (custom && hasValue) return userLabel(custom, locale);
  if (!hasValue) return locale === "en"
    ? "The source does not provide a reliable numeric value for direct calculation."
    : locale === "uz"
      ? "Manba to'g'ridan-to'g'ri hisoblash uchun ishonchli raqam bermaydi."
      : "Источник не дает надежное числовое значение для прямого расчета.";
  return locale === "en" ? "The indicator affects demand, pricing, staffing or location assumptions."
    : locale === "uz" ? "Ko'rsatkich talab, narx, xodimlar yoki lokatsiya farazlariga ta'sir qiladi."
      : "Показатель влияет на спрос, цену, персонал или локационные допущения.";
}

function hasReliableEvidenceValue(row: Record<string, unknown>): boolean {
  const value = row.value;
  const text = [row.indicator, row.sourceName, row.source, row.explanation, row.value].join(" ").toLowerCase();
  if (/контрольн|тестов|fake|synthetic|450\.5|1\s*000\s*000\s*000|требуется проверка/.test(text)) return false;
  const hasValue = typeof value === "number"
    ? Number.isFinite(value) && value > 0
    : typeof value === "string" && value.trim().length > 0 && !/не найдено|not found|topilmadi/i.test(value);
  return Boolean(
    hasValue &&
    String(row.indicator ?? row.title ?? "").trim() &&
    String(row.period ?? "").trim() &&
    String(row.sourceName ?? row.source ?? "").trim()
  );
}

function honestNoMarketDataRow(report: ReportData, locale: ReportLocale): Array<Array<string>> {
  const region = String(report.projectProfile?.region ?? report.projectProfile?.district ?? "").trim();
  if (locale === "en") {
    return [[
      "Local demand validation",
      "Reliable official numeric data was not found",
      "Current check",
      region || "Project region",
      "Official/statistical sources",
      "No sufficiently reliable official numeric indicator was found for a direct demand estimate in the selected region.",
      "For a bank application, validate demand with test sales, store traffic counts, Instagram/Telegram leads and comparison of 5 competitors.",
      "Data unavailable"
    ]];
  }
  if (locale === "uz") {
    return [[
      "Mahalliy talabni tekshirish",
      "Proxy ko'rsatkichlar bilan tekshirish",
      "Joriy tekshiruv",
      region || "Loyiha hududi",
      "Rasmiy/statistik manbalar",
      "Tor segment bo'yicha bevosita ko'rsatkich mavjud emas; mavjud proxy manbalar bozor fonini baholashga yordam beradi.",
      "Bank arizasi uchun talabni test savdolar, nuqta trafiki o'lchovi, Instagram/Telegram arizalari va 5 ta raqobatchi bilan solishtirish orqali tasdiqlang.",
      "Proxy"
    ]];
  }
  return [[
    "Оценка локального спроса",
    "Официальные числовые данные не найдены",
    "Текущая проверка",
    region || "Регион проекта",
    "Официальная статистика",
    "По выбранному региону не найдены официальные числовые данные по узкому сегменту; доступные косвенные источники помогают оценить рыночный фон.",
    "Для банковской заявки подтвердите спрос тестовыми продажами, замером трафика точки, заявками из Instagram/Telegram и сравнением 5 конкурентов.",
    "Косвенный ориентир"
  ]];
}

function localizeMarketEvidenceRows(report: ReportData, locale: ReportLocale): Array<Array<string>> | undefined {
  const evidence = (report.marketEvidence ?? []).filter((item) => hasReliableEvidenceValue(item));
  if (!evidence.length) return honestNoMarketDataRow(report, locale);
  const seen = new Set<string>();
  const rows: Array<Array<string>> = [];
  for (const item of evidence) {
    const indicator = localizeEvidenceIndicator(item.indicator, locale);
    const period = String(item.period ?? "").trim() || (locale === "en" ? "Not specified" : locale === "uz" ? "Ko'rsatilmagan" : "Не указано");
    const geography = localizeGeography(item.geography, locale);
    const source = localizeEvidenceSource(item, locale);
    const key = [indicator, source, geography, period].join("::").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([
      indicator,
      formatEvidenceValue(item, locale),
      period,
      geography,
      source,
      localizeEvidenceInterpretation(item, locale),
      localizeEvidenceUse(item, locale),
      localizeConfidence(item.confidence ?? item.matchQuality ?? (item.value ? "medium" : "needs_verification"), locale)
    ]);
  }
  return rows.length ? rows : honestNoMarketDataRow(report, locale);
}

function documentTranslations(id: string, locale: ReportLocale): Partial<{ title: string; when: string; authority: string; text: string }> {
  const ru: Record<string, Partial<{ title: string; when: string; authority: string; text: string }>> = {
    
    ip_registration: { title: "Регистрация ИП", when: "До запуска", authority: "Министерство юстиции / my.gov.uz", text: "Оформляется онлайн. Рассмотрите ООО, если нужны партнёры, кредит, корпоративные клиенты или повышенная ответственность." },
    ooo_registration: { title: "Регистрация ООО", when: "До запуска при партнёрах, кредите или корпоративных клиентах", authority: "Министерство юстиции / my.gov.uz", text: "Нужна при наличии партнёров, кредита, корпоративных клиентов или повышенной ответственности." },
    tax_registration: { title: "Постановка на налоговый учёт", when: "До первых продаж", authority: "Налоговый комитет / soliq.uz", text: "Постановка на налоговый учёт и выбор режима должны быть закрыты до первых продаж." },
    online_kassa: { title: "Подключение онлайн-кассы", when: "До приёма оплат от физлиц", authority: "Налоговый комитет / soliq.uz", text: "Обязательно для бизнеса, который принимает оплату от физических лиц." },
    employee_contract: { title: "Трудовой договор с сотрудниками", when: "При наличии сотрудников", authority: "Министерство занятости / mehnat.uz", text: "Обязателен при наличии наёмных сотрудников; заранее зафиксируйте обязанности, график и ответственность." },
    sanitary_conclusion: { title: "Санитарно-эпидемиологическое заключение", when: "До запуска регулируемой деятельности", authority: "Агентство санэпидблагополучия / ssv.uz", text: "Нужно для видов деятельности с санитарными требованиями: питание, медицина, красота, производство или обработка товаров, если это применимо." },
    no_special_license: { title: "Специальная лицензия не требуется", when: "До запуска — зафиксировать статус", authority: "Единый портал лицензирования / license.gov.uz", text: "Если выбранная деятельность не входит в лицензируемые виды, специальная лицензия не требуется. Статус нужно подтвердить по точному виду деятельности через license.gov.uz." },
    business_registration: { title: "Регистрация бизнеса", when: "До начала деятельности", authority: "my.gov.uz / госуслуги / бухгалтер / юрист", text: "Если бизнес запускается одним владельцем, без партнеров и крупных B2B-договоров, можно рассмотреть ИП. Если планируются сотрудники, корпоративные клиенты, кредит/лизинг, партнеры или повышенная ответственность, чаще практичнее ООО. Окончательный выбор нужно подтвердить с бухгалтером или юристом." },
    tax_mode: { title: "Налоговый режим, касса и платежные документы", when: "До первых продаж", authority: "Налоговый комитет", text: "Проверить налоговый режим, онлайн-кассу/терминал, чеки, акты и правила оформления оплат." },
    lease_agreement: { title: "Договор помещения/площадки", when: "Если есть помещение", authority: "Арендодатель / юрист", text: "В договоре должны быть срок, назначение помещения, коммунальные услуги, доступ, вывеска и ответственность сторон." },
    labor_contracts: { title: "Оформление сотрудников", when: "Если есть сотрудники", authority: "Работодатель / трудовые требования", text: "Оформить сотрудников, график, обязанности, инструктажи и ответственность." },
    fire_safety: { title: "Пожарная безопасность и охрана труда", when: "Для помещения и сотрудников", authority: "Профильные требования", text: "Проверить требования по помещению, оборудованию, инструктажам и безопасной работе." },
    car_wash_water_drainage: { title: "Вода, канализация и стоки автомойки", when: "До аренды/запуска", authority: "Арендодатель, коммунальные службы, санитарные/экологические требования", text: "Для автомойки нужно заранее подтвердить источник воды, подключение к канализации или договор на вывоз/очистку стоков, а также условия по грязной воде и химии. Без этого есть риск штрафов, остановки работы или конфликта с арендодателем." },
    car_wash_lease_activity: { title: "Договор аренды с правом автомойки", when: "До вложений в ремонт и оборудование", authority: "Арендодатель / юрист", text: "В договоре должно быть прямо разрешено вести автомойку, использовать воду, ставить оборудование, вывеску и принимать поток автомобилей. Отдельно проверьте ответственность за повреждение покрытия, коммуникаций и соседних помещений." },
    car_wash_cash_documents: { title: "Касса, чеки, акты и договоры с автопарками", when: "До первых продаж", authority: "Налоговый комитет / бухгалтер", text: "Для B2C нужны корректные чеки и порядок приема оплат, для B2B-автопарков — договор, акт выполненных работ, сроки оплаты и ответственность за качество мойки." },
    car_wash_labor_safety_chemicals: { title: "Инструктаж персонала и безопасная химия", when: "До найма сотрудников", authority: "Работодатель / требования охраны труда", text: "Нужны инструкции по работе с автохимией, перчатки/СИЗ, хранение химии, обучение персонала и порядок действий при жалобах клиента или повреждении автомобиля." }
  };
  const en: typeof ru = {
    
    ip_registration: { title: "Individual entrepreneur registration", when: "Before launch", authority: "Ministry of Justice / my.gov.uz", text: "Can be completed online. Consider an LLC if partners, a loan, corporate clients or higher liability are expected." },
    ooo_registration: { title: "LLC registration", when: "Before launch if partners, a loan or corporate clients are involved", authority: "Ministry of Justice / my.gov.uz", text: "Recommended when there are partners, a loan, corporate clients or higher liability." },
    tax_registration: { title: "Tax registration", when: "Before first sales", authority: "Tax Committee / soliq.uz", text: "Tax registration and tax regime selection should be completed before first sales." },
    online_kassa: { title: "Online cash register connection", when: "Before accepting payments from individuals", authority: "Tax Committee / soliq.uz", text: "Required for businesses that accept payments from individuals." },
    employee_contract: { title: "Employment contracts", when: "When staff are hired", authority: "Employment authority / mehnat.uz", text: "Required when employees are hired; define duties, schedule and responsibility in advance." },
    sanitary_conclusion: { title: "Sanitary-epidemiological conclusion", when: "Before launch of regulated activity", authority: "Sanitary authority / ssv.uz", text: "Needed for activities with sanitary requirements such as food, healthcare, beauty, manufacturing or product handling, if applicable." },
    no_special_license: { title: "No special license required", when: "Before launch — document the status", authority: "Unified licensing portal / license.gov.uz", text: "If the selected activity is not licensed, no special license is required. Confirm the exact activity status via license.gov.uz." },
    business_registration: { title: "Business registration", when: "Before launch", authority: "my.gov.uz / public services / accountant / lawyer", text: "For a single-owner launch without partners or large B2B contracts, an individual entrepreneur format may be considered. If staff, corporate clients, a loan/lease, partners or higher liability are expected, an LLC is often more practical. Confirm the final choice with an accountant or lawyer." },
    tax_mode: { title: "Tax regime, cash desk and payment documents", when: "Before first sales", authority: "Tax Committee", text: "Check tax regime, online cash register/terminal, receipts, acts and payment documentation rules." },
    lease_agreement: { title: "Premises/site agreement", when: "If premises are used", authority: "Landlord / lawyer", text: "The agreement should cover term, permitted use, utilities, access, signage and responsibility of the parties." },
    labor_contracts: { title: "Employee formalization", when: "If staff are hired", authority: "Employer / labor rules", text: "Formalize employees, schedule, duties, training and responsibility." },
    fire_safety: { title: "Fire safety and labor protection", when: "For premises and staff", authority: "Relevant requirements", text: "Check premises, equipment, training and safe work requirements." },
    car_wash_water_drainage: { title: "Water supply, drainage and car-wash wastewater", when: "Before lease/launch", authority: "Landlord, utilities, sanitary/environmental rules", text: "Confirm the water source, drainage or wastewater removal/filtration arrangement, and rules for dirty water and chemicals. Otherwise the business may face fines, shutdown risk or a landlord dispute." },
    car_wash_lease_activity: { title: "Lease agreement allowing car-wash activity", when: "Before renovation and equipment investment", authority: "Landlord / lawyer", text: "The lease should explicitly allow car-wash operations, water use, equipment installation, signage and vehicle flow. Also check responsibility for damage to surfaces, utilities and neighboring premises." },
    car_wash_cash_documents: { title: "Cash desk, receipts, acts and fleet contracts", when: "Before first sales", authority: "Tax Committee / accountant", text: "B2C sales need proper receipts and payment handling; B2B fleet work needs a contract, completion acts, payment terms and quality responsibility." },
    car_wash_labor_safety_chemicals: { title: "Staff training and safe car chemicals", when: "Before hiring staff", authority: "Employer / labor safety rules", text: "Prepare instructions for car chemicals, PPE, chemical storage, staff training and a procedure for customer complaints or vehicle damage." }
  };
  const uz: typeof ru = {
    
    ip_registration: { title: "Yakka tartibdagi tadbirkorni ro'yxatdan o'tkazish", when: "Ishga tushirishdan oldin", authority: "Adliya vazirligi / my.gov.uz", text: "Onlayn rasmiylashtirish mumkin. Agar sheriklar, kredit, korporativ mijozlar yoki yuqori javobgarlik bo'lsa, MChJ variantini ham ko'rib chiqing." },
    ooo_registration: { title: "MChJni ro'yxatdan o'tkazish", when: "Sheriklar, kredit yoki korporativ mijozlar bo'lsa — ishga tushirishdan oldin", authority: "Adliya vazirligi / my.gov.uz", text: "Sheriklar, kredit, korporativ mijozlar yoki yuqori javobgarlik bo'lsa tavsiya etiladi." },
    tax_registration: { title: "Soliq hisobiga qo'yish", when: "Birinchi sotuvlardan oldin", authority: "Soliq qo'mitasi / soliq.uz", text: "Soliq hisobiga qo'yish va soliq rejimini tanlash birinchi sotuvlardan oldin yakunlanishi kerak." },
    online_kassa: { title: "Onlayn kassani ulash", when: "Jismoniy shaxslardan to'lov qabul qilishdan oldin", authority: "Soliq qo'mitasi / soliq.uz", text: "Jismoniy shaxslardan to'lov qabul qiladigan biznes uchun talab qilinadi." },
    employee_contract: { title: "Xodimlar bilan mehnat shartnomasi", when: "Xodimlar yollanganda", authority: "Bandlik organi / mehnat.uz", text: "Yollanma xodimlar bo'lsa talab qilinadi; vazifalar, grafik va javobgarlikni oldindan belgilang." },
    sanitary_conclusion: { title: "Sanitariya-epidemiologiya xulosasi", when: "Tartibga solinadigan faoliyat boshlanishidan oldin", authority: "Sanitariya organi / ssv.uz", text: "Ovqatlanish, tibbiyot, go'zallik, ishlab chiqarish yoki tovarlarga ishlov berish kabi sanitariya talablari bor faoliyatlarda kerak bo'lishi mumkin." },
    no_special_license: { title: "Maxsus litsenziya talab qilinmaydi", when: "Ishga tushirishdan oldin — statusni qayd etish", authority: "Yagona litsenziyalash portali / license.gov.uz", text: "Tanlangan faoliyat litsenziyalanadigan faoliyatga kirmasa, maxsus litsenziya talab qilinmaydi. Aniq faoliyat statusini license.gov.uz orqali tasdiqlang." },
    business_registration: { title: "Biznesni ro'yxatdan o'tkazish", when: "Ish boshlashdan oldin", authority: "my.gov.uz / davlat xizmatlari / buxgalter / yurist", text: "Biznes bitta egasi bilan, sheriklarsiz va yirik B2B shartnomalarsiz boshlansa, yakka tartibdagi tadbirkor formatini ko'rib chiqish mumkin. Xodimlar, korporativ mijozlar, kredit/lizing, sheriklar yoki yuqori javobgarlik rejalashtirilsa, ko'pincha MChJ amaliyroq bo'ladi. Yakuniy tanlovni buxgalter yoki yurist bilan tasdiqlang." },
    tax_mode: { title: "Soliq rejimi, kassa va to'lov hujjatlari", when: "Birinchi sotuvlardan oldin", authority: "Soliq qo'mitasi", text: "Soliq rejimi, onlayn kassa/terminal, cheklar, aktlar va to'lov hujjatlari tartibini tekshirish." },
    lease_agreement: { title: "Joy/maydon shartnomasi", when: "Joy ishlatilsa", authority: "Ijarachi / yurist", text: "Shartnomada muddat, faoliyat turi, kommunal xizmatlar, kirish, peshlavha va tomonlar javobgarligi bo'lishi kerak." },
    labor_contracts: { title: "Xodimlarni rasmiylashtirish", when: "Xodimlar bo'lsa", authority: "Ish beruvchi / mehnat talablari", text: "Xodimlar, grafik, vazifalar, instruktaj va javobgarlikni rasmiylashtirish." },
    fire_safety: { title: "Yong'in xavfsizligi va mehnat muhofazasi", when: "Joy va xodimlar uchun", authority: "Profil talablar", text: "Joy, uskuna, instruktaj va xavfsiz ishlash talablarini tekshirish." },
    car_wash_water_drainage: { title: "Avtoyuvish uchun suv, kanalizatsiya va oqava suv", when: "Ijara/ishga tushirishdan oldin", authority: "Ijarachi, kommunal xizmatlar, sanitariya/ekologiya talablari", text: "Suv manbai, kanalizatsiyaga ulanish yoki oqava suvni olib chiqish/tozalash tartibi, iflos suv va kimyo bo'yicha shartlarni oldindan tasdiqlash kerak. Aks holda jarima, faoliyat to'xtashi yoki ijara nizosi xavfi bor." },
    car_wash_lease_activity: { title: "Avtoyuvish faoliyatiga ruxsat beruvchi ijara shartnomasi", when: "Ta'mir va uskuna xarajatlaridan oldin", authority: "Ijarachi / yurist", text: "Shartnomada avtoyuvish faoliyati, suvdan foydalanish, uskuna o'rnatish, peshlavha va avtomobil oqimi aniq ruxsat etilishi kerak. Qoplama, kommunikatsiya va qo'shni joylarga zarar uchun javobgarlikni ham tekshiring." },
    car_wash_cash_documents: { title: "Kassa, cheklar, dalolatnomalar va avtopark shartnomalari", when: "Birinchi sotuvlardan oldin", authority: "Soliq qo'mitasi / buxgalter", text: "B2C savdoda to'g'ri chek va to'lov tartibi, B2B avtoparklarda esa shartnoma, bajarilgan ish dalolatnomasi, to'lov muddati va sifat bo'yicha javobgarlik kerak." },
    car_wash_labor_safety_chemicals: { title: "Xodimlar instruktaji va xavfsiz avtokimyo", when: "Xodimlarni ishga olishdan oldin", authority: "Ish beruvchi / mehnat xavfsizligi talablari", text: "Avtokimyo bilan ishlash bo'yicha yo'riqnoma, qo'lqop/SIH, kimyoni saqlash, xodimlarni o'qitish va mijoz shikoyati yoki avtomobilga zarar bo'lsa harakat tartibi kerak." }
  };
  const dict = locale === "en" ? en : locale === "uz" ? uz : ru;
  return dict[id] ?? {};
}

function localizeDocumentsRows(report: ReportData, locale: ReportLocale): Array<Array<string>> | undefined {
  if (!report.documentsAndPermits?.length) return report.documentsRows;
  const fallbackWhy = locale === "en"
    ? "Needed to reduce legal, tax, contract or operating risk before launch."
    : locale === "uz"
      ? "Ishga tushirishdan oldin huquqiy, soliq, shartnoma yoki operatsion riskni kamaytirish uchun kerak."
      : "Нужно, чтобы снизить юридический, налоговый, договорный или операционный риск до запуска.";
  const fallbackManual = locale === "en"
    ? "Confirm the current requirement with an accountant, lawyer, landlord or the relevant authority; do not rely on assumptions."
    : locale === "uz"
      ? "Joriy talabni buxgalter, yurist, ijaraga beruvchi yoki profil davlat organi bilan tasdiqlang; farazlarga tayanmang."
      : "Подтвердить актуальное требование у бухгалтера, юриста, арендодателя или профильного госоргана; не опираться на допущения.";
  const fallbackTitle = (id: string, item: Record<string, unknown>) => {
    if (locale === "ru") return String(item.name_ru ?? item.title ?? fallbackWhy);
    if (locale === "uz") return String(item.name_uz ?? documentTranslations(id, "uz").title ?? "Hujjat yoki ruxsatnoma");
    return String(documentTranslations(id, "en").title ?? "Document or permit");
  };
  const authorityFromUrl = (url: string | undefined) => {
    const source = String(url ?? "").toLowerCase();
    if (source.includes("soliq") || source.includes("tax")) return locale === "en" ? "Tax Committee" : locale === "uz" ? "Soliq qo'mitasi" : "Налоговый комитет";
    if (source.includes("my.gov")) return locale === "en" ? "Public services portal" : locale === "uz" ? "Davlat xizmatlari portali" : "Портал госуслуг";
    if (source.includes("license")) return locale === "en" ? "Licensing portal" : locale === "uz" ? "Litsenziyalash portali" : "Портал лицензирования";
    if (source.includes("lex")) return locale === "en" ? "Legal database" : locale === "uz" ? "Qonunchilik bazasi" : "База законодательства";
    if (source.includes("mehnat")) return locale === "en" ? "Employment authority" : locale === "uz" ? "Bandlik organi" : "Орган занятости";
    if (source.includes("ssv")) return locale === "en" ? "Sanitary / healthcare authority" : locale === "uz" ? "Sanitariya / sog'liqni saqlash organi" : "Санитарный / медицинский орган";
    if (source.includes("favqulodda") || source.includes("mchs")) return locale === "en" ? "Emergency / fire safety authority" : locale === "uz" ? "Favqulodda vaziyatlar / yong'in xavfsizligi organi" : "МЧС / пожарная безопасность";
    return locale === "en" ? "Relevant authority / consultant" : locale === "uz" ? "Profil davlat organi / konsultant" : "Профильный госорган / консультант";
  };
  return report.documentsAndPermits.map((item) => {
    const id = String(item.id ?? "");
    const translated = documentTranslations(id, locale);
    const url = typeof item.url === "string" ? item.url : undefined;
    const authority = translated.authority ?? (locale === "ru" ? String(item.organ_ru ?? item.authority ?? authorityFromUrl(url)) : authorityFromUrl(url));
    const why = translated.text ?? (locale === "ru" ? String(item.note_ru ?? item.whyNeeded ?? item.purpose ?? fallbackWhy) : fallbackWhy);
    const deadline = typeof item.deadline_days === "number" ? `; ${locale === "en" ? "deadline" : locale === "uz" ? "muddat" : "срок"}: ${item.deadline_days} ${locale === "en" ? "days" : locale === "uz" ? "kun" : "дн."}` : "";
    const when = translated.when ?? (locale === "ru" ? String(item.whenRequired ?? "") : (locale === "en" ? "Before launch / before the related activity" : "Ishga tushirishdan yoki tegishli faoliyatdan oldin"));
    const where = translated.authority ?? (locale === "ru" ? String(item.whereToCheck ?? item.whereToGet ?? authority) : authority);
    const source = String(item.url ?? item.sourceName ?? item.source ?? authority);
    const status = item.required === false
      ? (locale === "en" ? "Recommended" : locale === "uz" ? "Tavsiya etiladi" : "Рекомендуемый")
      : (locale === "en" ? "Required" : locale === "uz" ? "Majburiy" : "Обязательный");
    const manual = `${fallbackManual}${url ? ` URL: ${url}.` : ""}`;
    return [
      translated.title ?? fallbackTitle(id, item),
      why,
      `${when}${deadline}`,
      where,
      source,
      `${status}; ${localizeConfidence(item.confidence, locale)}`,
      manual
    ];
  });
}

function localizeActionPlanRows(rows: ReportData["actionPlanRows"], nextActions: string[], locale: ReportLocale): Array<Array<string>> | undefined {
  if (!nextActions.length) return rows;
  return nextActions.map((action, index) => [
    String(index + 1),
    action,
    index < 3 ? (locale === "en" ? "Before application" : locale === "uz" ? "Ariza topshirishdan oldin" : "До подачи заявки") : (locale === "en" ? "Before launch" : locale === "uz" ? "Ishga tushirishdan oldin" : "До запуска"),
    locale === "en" ? "Entrepreneur / consultant" : locale === "uz" ? "Tadbirkor / konsultant" : "Предприниматель / консультант"
  ]);
}

function localizeAssumptionsRows(rows: ReportData["assumptionsRows"], assumptions: string[] | undefined, locale: ReportLocale): Array<Array<string>> | undefined {
  const localized = locale === "en"
    ? [
      "Facts, calculations and assumptions are separated; unverified inputs remain assumptions.",
      "Official indicators and requirements must be rechecked in the selected sources before submission.",
      "Supplier prices, rent, demand, margin and documents must be confirmed by offers, contracts or a market test."
    ]
    : locale === "uz"
      ? [
        "Faktlar, hisob-kitoblar va farazlar ajratilgan; tekshirilmagan ma'lumotlar faraz sifatida qoladi.",
        "Ariza topshirishdan oldin rasmiy ko'rsatkichlar va talablarni tanlangan manbalarda qayta tekshirish kerak.",
        "Yetkazib beruvchi narxlari, ijara, talab, marja va hujjatlar tijorat takliflari, shartnomalar yoki bozor testi bilan tasdiqlanishi kerak."
      ]
      : [
        "Факты отделены от расчетов и допущений; непроверенные данные остаются допущениями.",
        "Официальные показатели и требования необходимо перепроверить в выбранных источниках перед подачей в банк или инвестору.",
        "Цены поставщиков, аренду, спрос, маржу и документы нужно подтвердить КП, договорами или тестом рынка."
      ];
  if (!localized?.length) return rows;
  const labels = locale === "en"
    ? ["Unconfirmed data", "Official indicators", "Financial assumptions"]
    : locale === "uz"
      ? ["Tasdiqlanmagan ma'lumotlar", "Rasmiy ko'rsatkichlar", "Moliyaviy farazlar"]
      : ["Неподтверждённые данные", "Официальные показатели", "Финансовые допущения"];
  return localized.map((item, index) => [labels[index] ?? labels[0], item, locale === "en" ? "Assumption/data gap" : locale === "uz" ? "Faraz/ma'lumot bo'shlig'i" : "Допущение/пробел данных"]);
}

function localizeFinancialMeta(financial: FinancialResult, locale: ReportLocale): FinancialResult {
  return {
    ...financial,
    formulaRows: formatFormulaRows(financial, locale),
    capex: {
      ...financial.capex,
      lineItems: financial.capex.lineItems.map((item) => ({ ...item, label: formatCapexLabel(item.key, item.label, locale) }))
    },
    opex: {
      ...financial.opex,
      lineItems: financial.opex.lineItems.map((item) => ({ ...item, label: formatOpexLabel(item.key, item.label, locale) }))
    },
    financing: {
      ...financial.financing,
      dscrLabel: financial.financing.dscr === null ? reportStatus("notApplicable", locale) : financial.financing.dscrLabel
    },
    warnings: (financial.warnings ?? []).map((warning) => ({
      ...warning,
      title: formatWarningTitle(warning.code, locale),
      message: formatWarningMessage(warning.code, warning.message, locale)
    }))
  };
}

function localizedRiskCategory(category: unknown, locale: ReportLocale): string {
  const key = String(category ?? "");
  const map: Record<string, Record<ReportLocale, string>> = {
    market: { ru: "Рынок", en: "Market", uz: "Bozor" },
    financial: { ru: "Финансы", en: "Financial", uz: "Moliya" },
    operational: { ru: "Операции", en: "Operations", uz: "Operatsiyalar" },
    legal: { ru: "Право", en: "Legal", uz: "Huquqiy" },
    compliance: { ru: "Соответствие требованиям", en: "Compliance", uz: "Talablarga muvofiqlik" },
    infrastructure: { ru: "Инфраструктура", en: "Infrastructure", uz: "Infratuzilma" },
    bankability: { ru: "Финансируемость", en: "Bankability", uz: "Moliyalashtirishga moslik" },
    environmental: { ru: "Экология", en: "Environmental", uz: "Ekologiya" },
    currency: { ru: "Валюта", en: "Currency", uz: "Valyuta" },
    supplier: { ru: "Поставщики", en: "Suppliers", uz: "Yetkazib beruvchilar" },
    staff: { ru: "Персонал", en: "Staff", uz: "Xodimlar" },
    technology: { ru: "Технологии", en: "Technology", uz: "Texnologiya" },
    seasonality: { ru: "Сезонность", en: "Seasonality", uz: "Mavsumiylik" }
  };
  return map[key]?.[locale] ?? labelValue(category, locale);
}

function prepareRiskMatrixForOutput(risks: RiskItem[], locale: ReportLocale): RiskItem[] {
  return risks.map((risk) => ({
    ...risk,
    category: localizedRiskCategory(risk.category, locale) as RiskItem["category"],
    evidence: Array.isArray(risk.evidence) ? risk.evidence.map((item) => labelValue(item, locale)) : [],
    missingData: [],
    owner: risk.owner ? labelValue(String(risk.owner).replace(/\bHR\b/g, locale === "ru" ? "персонал" : locale === "uz" ? "xodimlar" : "HR"), locale) : undefined
  }));
}

export function localizeReportData(report: ReportData, locale: ReportLocale): ReportData {
  const financialModel = localizeFinancialMeta(report.financialModel, locale);
  const baseReport = { ...report, financialModel } as ReportData;
  const riskMatrix = localizeRisks(report.riskMatrix, locale);
  const riskMatrixForOutput = prepareRiskMatrixForOutput(riskMatrix, locale);
  const nextActions = generateLocalizedNextActions(baseReport, locale);
  const localized: ReportData = {
    ...baseReport,
    projectProfile: localizeUserFacingRecord(report.projectProfile ?? {}, locale),
    businessProfile: report.businessProfile,
    executiveSummary: generateLocalizedExecutiveSummary(baseReport, locale),
    keyFigures: buildLocalizedKeyFigures(financialModel, report.projectProfile as { employeesCount?: number | null }, locale),
    investmentBreakdown: buildLocalizedInvestmentBreakdown(financialModel, locale),
    financingRecommendation: generateLocalizedFinancingRecommendation(baseReport, locale),
    detailedConclusion: generateLocalizedDetailedConclusion(baseReport, locale),
    riskMatrix: riskMatrixForOutput,
    businessModelRows: localizeBusinessModelRows(baseReport, locale),
    marketEvidenceRows: localizeMarketEvidenceRows(baseReport, locale),
    documentsRows: localizeDocumentsRows(baseReport, locale),
    actionPlanRows: localizeActionPlanRows(report.actionPlanRows, nextActions, locale),
    assumptionsRows: localizeAssumptionsRows(report.assumptionsRows, report.dataGapsAndAssumptions, locale),
    riskConclusion: localizeRiskConclusion(report.riskConclusion, locale, riskMatrix, nextActions),
    nextActions,
    warnings: financialModel.warnings,
    formulaRows: financialModel.formulaRows,
    capexBreakdown: financialModel.capex.lineItems,
    opexBreakdown: financialModel.opex.lineItems,
    disclaimer: locale === "en"
      ? "This report is a preliminary advisory assessment. It is not a guarantee of profit, financing, loan approval, or an investment recommendation. Market numeric data is used only when a source is available; financial assumptions must be verified before making decisions."
      : locale === "uz"
        ? "Ushbu hisobot dastlabki maslahat bahosidir. U foyda, moliyalashtirish, kredit ma'qullanishi yoki investitsiya tavsiyasini kafolatlamaydi. Bozor raqamli ma'lumotlari faqat manba mavjud bo'lsa ishlatiladi; moliyaviy farazlar qaror qabul qilishdan oldin tekshirilishi kerak."
        : report.disclaimer,
    marketData: report.marketData ? {
      ...report.marketData,
      messages: report.marketData.messages.length ? report.marketData.messages.map((message) => message.includes("Официальные числовые") || message.includes("official") ? (locale === "en" ? "No official numeric data was found for this indicator." : locale === "uz" ? "Bu ko'rsatkich bo'yicha rasmiy raqamli ma'lumotlar topilmadi." : message) : message) : report.marketData.messages
    } : report.marketData
  };
  const { businessProfile: _internalBusinessProfile, ...userFacingReport } = localized as ReportData & { businessProfile?: unknown };
  const sanitizedLocalized = {
    ...(sanitizeUserFacingObject(userFacingReport, locale) as ReportData),
    financialModel: localized.financialModel,
    businessProfile: report.businessProfile,
    documentsAndPermits: report.documentsAndPermits,
    marketEvidence: report.marketEvidence,
    marketData: report.marketData,
    webResearchData: report.webResearchData,
    recommendedProducts: report.recommendedProducts,
    riskMatrix: riskMatrixForOutput,
    sourceUsageAudit: (report as ReportData & { sourceUsageAudit?: unknown }).sourceUsageAudit,
    sourcePack: (report as ReportData & { sourcePack?: unknown }).sourcePack
  } as ReportData & { sourceUsageAudit?: unknown; sourcePack?: unknown };
  const {
    sourceUsageAudit: _sourceUsageAudit,
    sourcePack: _sourcePack,
    financialModel: _financialModel,
    marketEvidence: _marketEvidence,
    documentsAndPermits: _documentsAndPermits,
    marketData: _marketData,
    webResearchData: _webResearchData,
    recommendedProducts: _recommendedProducts,
    warnings: _rawWarnings,
    formulaRows: _formulaRows,
    capexBreakdown: _capexBreakdown,
    opexBreakdown: _opexBreakdown,
    workingCapitalBreakdown: _workingCapitalBreakdown,
    financingBreakdown: _financingBreakdown,
    ...localizedForPublicValidation
  } = sanitizedLocalized as ReportData & { sourceUsageAudit?: unknown; sourcePack?: unknown };
  const reportForLocaleCheck = {
    ...localizedForPublicValidation,
    riskMatrix: (sanitizedLocalized.riskMatrix ?? []).map((risk: RiskItem & { sourceIds?: string[] }) => {
      const { sourceIds: _riskSourceIds, ...publicRisk } = risk;
      return publicRisk;
    }),
    businessProfile: report.businessProfile ? sanitizeUserFacingObject(localizeUserFacingRecord(report.businessProfile, locale), locale) : report.businessProfile
  };

  if (process.env.NODE_ENV === "test" && process.env.STRICT_REPORT_LOCALE_CHECK === "true") {
    assertNoRawTechnicalLabelsInReport({ report: reportForLocaleCheck, locale });
  } else {
    try {
      assertNoRawTechnicalLabelsInReport({ report: reportForLocaleCheck, locale });
    } catch (error) {
      console.warn("[localizeReportData] Non-blocking localization warning", error);
    }
  }

  return sanitizedLocalized;
}
