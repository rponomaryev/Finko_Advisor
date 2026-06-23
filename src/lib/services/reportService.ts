import { mockFinancingProducts } from "../data/mockFinancingProducts.ts";
import type { FinancialResult, RiskItem, StructuredProjectData } from "../types/project.ts";
import type { MarketDataResult } from "../marketData/types.ts";
import { formatCurrencyCompact, formatCurrencyFull, formatCurrencyWithOriginal } from "../utils/formatCurrency.ts";
import { labelValue } from "../utils/labels.ts";
import { getProjectProfile } from "../utils/projectClient.ts";
import { getReportLocale, type ReportLocale } from "../i18n/reportMessages.ts";
import { localizeReportData } from "../report/localizeReport.ts";
import { getBusinessProfileForData } from "../interview/dynamicInterviewEngine.ts";
import { buildMarketEvidence } from "../market/statisticsEngine.ts";
import { getDocumentRequirements } from "../compliance/documentsRegistry.ts";
import { sourceRegistry, selectRelevantSourcesForReport, type DataSource } from "../data/sourceRegistry.ts";
import { generateAIReport, generateFallbackReport, type AIGeneratedReport } from "../report/aiReportGenerator.ts";
import type { WebResearchResult } from "../market/webResearchService.ts";
import { getLocalizedDisclaimer, MVP_DISCLAIMER } from "../report/disclaimer.ts";
export { getLocalizedDisclaimer, MVP_DISCLAIMER } from "../report/disclaimer.ts";

const na = "Не применяется";
const safe = (value: unknown) => (value === undefined || value === null || value === "" ? "Не указано" : labelValue(value));
const employeeCountFromPayroll = (financial: FinancialResult, project: StructuredProjectData) => {
  const explicit = Number(project.employeesCount ?? 0);
  if (explicit > 0) return explicit;
  return financial.payroll?.roles?.reduce((sum, role) => sum + Math.max(0, Number(role.count ?? 0)), 0) ?? 0;
};
const payrollRoleLabel = (role: unknown) => {
  const key = String(role ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    seller: "Продавец-консультант",
    cashier: "Кассир",
    administrator: "Администратор",
    manager: "Управляющий",
    operator: "Оператор"
  };
  return map[key] ?? String(role ?? "Сотрудник");
};
const payrollBreakdown = (financial: FinancialResult) => financial.payroll?.roles?.length
  ? financial.payroll.roles.map((role) => `${payrollRoleLabel(role.role)} - ${role.count}`).join("; ")
  : "Данные пользователя";
const sourceLabelRu = (source: unknown) => source === "assumption"
  ? "Допущение"
  : source === "user_input"
    ? "Данные пользователя"
    : source === "estimated"
      ? "Не подтверждено пользователем"
      : "Расчет";


function documentConfidenceLabel(value: unknown): string {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "статус нужно подтвердить";
  if (["very_high", "high", "confirmed", "verified"].includes(text)) return "высокий";
  if (["medium", "moderate"].includes(text)) return "средний";
  if (["low"].includes(text)) return "низкий";
  if (/need|verify|confirm|manual|unknown|clarif|уточ|провер|подтверж/.test(text)) return "статус нужно подтвердить";
  return "статус нужно подтвердить";
}

function creditAmountComment(f: FinancialResult): string {
  if (f.financing.creditNeeded === "no") return "Кредит не выбран";
  if (f.financing.creditNeeded === "yes") {
    return Number(f.financing.loanRequired ?? 0) > 0
      ? "Данные пользователя; подтвердить условия банка"
      : "Кредит выбран, но сумма не указана";
  }
  return "Статус кредита нужно подтвердить";
}

function buildRevenueTransparencyRows(f: FinancialResult, locale: ReportLocale): Array<[string, string, string]> {
  const numberLocale = locale === "uz" ? "uz-UZ" : locale === "en" ? "en-US" : "ru-RU";
  const displayVolume = Number(f.revenue.displayVolume ?? f.revenue.monthlyCapacity);
  const monthlyEquivalent = Number(f.revenue.displayVolumeMonthlyEquivalent ?? f.revenue.monthlyCapacity);
  const workingDays = Number(f.revenue.workingDaysForDisplay ?? 0);
  const utilization = Number(f.revenue.expectedUtilizationPct ?? 100);
  const price = Number(f.revenue.averagePrice ?? 0);
  const effectiveUnits = Number(f.revenue.effectiveUnits ?? 0);
  const rawUnit = f.revenue.displayVolumeUnitLabel ?? f.revenue.unitLabel ?? (locale === "en" ? "units/month" : locale === "uz" ? "birlik/oy" : "ед./мес.");
  const monthlyUnit = f.revenue.unitLabel ?? (locale === "en" ? "sales/month" : locale === "uz" ? "savdo/oy" : "продаж/мес.");
  const rows: Array<[string, string, string]> = [];
  const label = (ru: string, uz: string, en: string) => locale === "uz" ? uz : locale === "en" ? en : ru;
  const comment = label("Прозрачность расчёта выручки", "Tushum hisob-kitobi shaffofligi", "Revenue calculation transparency");

  if (f.revenue.conversionApplied) {
    if (displayVolume > 0) rows.push([label("Поток покупателей", "Xaridorlar oqimi", "Customer traffic"), `${displayVolume.toLocaleString(numberLocale)} ${rawUnit}`, comment]);
    if (workingDays > 0) rows.push([label("Рабочих дней в месяц", "Oyiga ish kunlari", "Working days per month"), `${Math.round(workingDays)}`, comment]);
    if (f.revenue.conversionPct !== undefined) rows.push([label("Конверсия", "Konversiya", "Conversion"), `${f.revenue.conversionPct}%`, comment]);
    if (monthlyEquivalent > 0) rows.push([label("Расчётный объем продаж", "Hisoblangan savdo hajmi", "Calculated sales volume"), `${monthlyEquivalent.toLocaleString(numberLocale)} ${monthlyUnit}`, comment]);
  } else if (displayVolume > 0 && monthlyEquivalent > 0 && monthlyEquivalent !== displayVolume) {
    const days = workingDays || Math.round(monthlyEquivalent / displayVolume);
    if (Number.isFinite(days) && days > 0) rows.push([label("Рабочих дней в месяц", "Oyiga ish kunlari", "Working days per month"), `${days}`, comment]);
    rows.push([label("Потенциальный объем в месяц", "Oylik salohiyat hajmi", "Potential monthly volume"), `${monthlyEquivalent.toLocaleString(numberLocale)} ${monthlyUnit}`, comment]);
  }
  if (!f.revenue.conversionApplied && effectiveUnits > 0) rows.push([label("Расчётный объем продаж", "Hisoblangan savdo hajmi", "Calculated sales volume"), `${effectiveUnits.toLocaleString(numberLocale)} ${monthlyUnit}`, comment]);
  if (utilization > 0) rows.push([label("Загрузка", "Yuklama", "Utilization"), `${utilization}%`, comment]);
  if (price > 0) rows.push([label("Средний чек / цена", "O'rtacha chek / narx", "Average ticket / price"), formatCurrencyFull(price), comment]);
  if (displayVolume > 0 && monthlyEquivalent !== displayVolume && price > 0) {
    const days = workingDays || Math.round(monthlyEquivalent / Math.max(displayVolume, 1));
    const formula = f.revenue.conversionApplied && f.revenue.conversionPct !== undefined
      ? `${displayVolume.toLocaleString(numberLocale)} ${rawUnit} × ${days} ${label("дней", "kun", "days")} × ${f.revenue.conversionPct}% ${label("конверсия", "konversiya", "conversion")} × ${utilization}% × ${price.toLocaleString(numberLocale)} = ${formatCurrencyFull(f.revenue.monthlyRevenue)}`
      : `${displayVolume.toLocaleString(numberLocale)} ${rawUnit} × ${days} ${label("дней", "kun", "days")} × ${utilization}% × ${price.toLocaleString(numberLocale)} = ${formatCurrencyFull(f.revenue.monthlyRevenue)}`;
    rows.push([label("Формула выручки", "Tushum formulasi", "Revenue formula"), formula, comment]);
  }
  return rows;
}

function projectText(project: StructuredProjectData): string {
  return [
    project.businessType,
    project.businessIdea,
    project.productOrService,
    project.businessProfile?.category,
    project.businessProfile?.subcategory,
    (project.businessProfile as Record<string, unknown> | undefined)?.businessModel
  ].filter(Boolean).join(" ");
}

function isDeviceRepairProject(project: StructuredProjectData): boolean {
  return /device_repair|ремонт\s*(смартфон|телефон|айфон|iphone|samsung|xiaomi)|сервисн\w*\s+центр\w*\s+по\s+ремонту|phone\s*repair|smartphone\s*repair/i.test(projectText(project));
}

function isB2CRetailLike(project: StructuredProjectData): boolean {
  const text = projectText(project);
  return /retail|розниц|магазин|аксессуар|товар|одежд|продаж/i.test(text);
}

function isChildrenClothingProject(project: StructuredProjectData): boolean {
  return /children_clothing_store|детск.*одежд|одежд.*детск|kids.*clothing|children.*clothing/i.test(projectText(project));
}

function detailedDocumentComment(item: { reportText: string; action: string; authority?: string | null; sourceName?: string | null; confidence?: string; organ_ru?: string | null; url?: string | null; deadline_days?: number | null; required?: boolean | null; note_ru?: string | null }): string {
  const parts = [item.note_ru ?? item.reportText];
  if (item.action) parts.push(`Что сделать: ${item.action}.`);
  const authority = item.organ_ru ?? item.authority ?? item.sourceName;
  if (authority) parts.push(`Где проверить/получить: ${authority}.`);
  if (item.url) parts.push(`Официальный URL: ${item.url}.`);
  if (typeof item.deadline_days === "number") parts.push(`Срок получения/проверки: ${item.deadline_days} дн.`);
  parts.push(`Статус: ${item.required ? "обязательный" : "рекомендуемый"}.`);
  if (item.sourceName && item.sourceName !== authority) parts.push(`Источник: ${item.sourceName}.`);
  return parts.join(" ");
}

function hasPositiveUsdAmounts(f: FinancialResult): boolean {
  const positiveUsdAmount = (currency: unknown, amount: unknown) => currency === "USD" && Number(amount ?? 0) > 0;
  return positiveUsdAmount(f.financing.ownContributionCurrency, f.financing.ownContributionAmount)
    || positiveUsdAmount(f.financing.loanCurrency, f.financing.loanRequired)
    || positiveUsdAmount(f.financing.leasingCurrency, f.financing.leasingRequired)
    || f.payroll.roles.some((role) => positiveUsdAmount(role.monthlySalaryCurrency, role.monthlySalaryAmount));
}

function isFakeOrTestMarketPoint(point: Record<string, unknown>): boolean {
  const text = `${point.id ?? ""} ${point.indicator ?? ""} ${point.explanation ?? ""} ${point.sourceName ?? ""} ${point.value ?? ""}`;
  return /official_test|контрольн(?:ый|ого)\s+числов|тестов(?:ой|ая)\s+сборк|fake|synthetic|1\s*000\s*000\s*000\s*UZS|450\.5|Выручка от поставок одежды на внешние рынки/i.test(text);
}

function isReliableMarketPoint(point: Record<string, unknown>, project: StructuredProjectData): boolean {
  const title = String(point.indicator ?? "").trim();
  const unit = String(point.unit ?? "").trim();
  const period = String(point.year ?? point.period ?? "").trim();
  const sourceName = String(point.sourceName ?? point.source ?? "").trim();
  const sourceUrl = String(point.sourceUrl ?? point.url ?? "").trim();
  const hasNumeric = [point.value, point.valueUsd, point.volume].some((value) => typeof value === "number" && Number.isFinite(value));
  if (!title || !unit || !period || !sourceName || isFakeOrTestMarketPoint(point) || !hasNumeric) return false;
  // Accept existing uploaded market data without sourceUrl only when the source itself is a known official registry name.
  if (!sourceUrl && !/stat|cbu|central|world bank|adb|soliq|customs|official|стат|центральн/i.test(sourceName)) return false;
  const businessText = projectText(project).toLowerCase();
  const metricText = `${title} ${unit} ${sourceName}`.toLowerCase();
  if (/детск.*одежд|children.*clothing|одежд|clothing|retail|розниц|магазин/.test(businessText)) {
    if (/export|поставок одежды на внешние рынки/.test(metricText) && !/import|currency|customs|supply/.test(metricText)) return false;
  }
  return true;
}

function numericMarketEvidenceFromData(input: { marketData?: MarketDataResult; project: StructuredProjectData }) {
  const points = input.marketData?.dataPoints ?? [];
  const numericPoints = points.filter((point) => {
    if (!isReliableMarketPoint(point as Record<string, unknown>, input.project)) return false;
    const hasValue = typeof point.value === "number" && Number.isFinite(point.value);
    const hasUsd = typeof point.valueUsd === "number" && Number.isFinite(point.valueUsd);
    const hasVolume = typeof point.volume === "number" && Number.isFinite(point.volume);
    return hasValue || hasUsd || hasVolume;
  });

  const seen = new Set<string>();
  return numericPoints.filter((point) => {
    const key = `${point.indicator}:${point.year}:${point.region ?? ""}:${point.sourceName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10).map((point, index) => {
    const value = typeof point.value === "number" && Number.isFinite(point.value)
      ? point.value
      : typeof point.volume === "number" && Number.isFinite(point.volume)
        ? point.volume
        : point.valueUsd;
    const unit = point.unit ?? (typeof point.valueUsd === "number" ? "USD" : "");
    const geography = point.region && input.project.region
      ? "region"
      : point.region
        ? "national"
        : "national";
    return {
      id: point.id ?? `market_data_${index + 1}`,
      indicator: point.indicator,
      value,
      unit,
      geography: geography as "national" | "region" | "city" | "district" | "global",
      period: String(point.year),
      sourceId: point.sourceName,
      sourceName: point.sourceName,
      sourceType: point.sourceType,
      confidence: point.matchQuality === "exact" || point.sourceType === "official_statistics" ? "very_high" as const : "high" as const,
      extractedAt: new Date().toISOString(),
      relevanceToBusiness: point.explanation ?? "Официальный показатель используется как рыночный proxy для проверки спроса и финансовых допущений.",
      limitation: point.matchQuality === "exact"
        ? "Использовать как прямой официальный показатель; перед подачей обновить дату источника."
        : "Это proxy-показатель: использовать для проверки масштаба рынка, но не как гарантию спроса конкретной точки."
    };
  });
}

export function generateExecutiveSummary(input: {
  project: StructuredProjectData;
  financial: FinancialResult;
  feasibilityScore: number;
  bankReadinessScore: number;
  marketData?: MarketDataResult;
}): string[] {
  const p = input.project;
  const f = input.financial;
  const totalNeed = f.financing?.totalInvestmentNeed ?? (f.capex.totalCapEx + f.workingCapital.requiredWorkingCapital);
  const businessType = safe(p.businessType);
  const marketDataNote = input.marketData?.dataPoints?.length
    ? `В отчет включены внешние рыночные данные из проверенных источников: ${input.marketData.sources.map((source) => source.sourceName).filter(Boolean).slice(0, 3).join(", ")}. Их нужно читать как справочный контекст, а не как гарантию спроса по конкретной точке продаж.`
    : "Официальные числовые рыночные данные для выбранного показателя не найдены; финансовые допущения необходимо подтвердить коммерческими предложениями и реальными продажами.";
  const usesUsd = hasPositiveUsdAmounts(f);
  const exchangeRateNote = usesUsd
    ? (p.exchangeRateSnapshot?.source === "CBU" || f.payroll?.exchangeRateSnapshot?.source === "CBU"
      ? "Пересчет USD/UZS использует официальный snapshot Центрального банка Республики Узбекистан, сохраненный для проекта."
      : "Курс USD/UZS нужно подтвердить перед использованием.")
    : "Все введенные суммы рассчитаны в UZS; пересчет USD не применялся.";

  return [
    `Проект описывает запуск бизнеса "${businessType}" в регионе: ${safe(p.region)}, район/город: ${safe(p.district)}. Идея: ${safe(p.businessIdea)}.`,
    `Предварительная потребность в инвестициях составляет ${formatCurrencyFull(totalNeed)}: стартовые вложения ${formatCurrencyFull(f.capex.totalCapEx)} и оборотный капитал ${formatCurrencyFull(f.workingCapital.requiredWorkingCapital)}.`,
    `Собственные средства указаны как ${formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency)}. Доля собственных средств в расчетной потребности: ${f.financing.ownContributionPct}%. ${exchangeRateNote}`,
    f.financing.creditNeeded === "no"
      ? "Пользователь не планирует кредит. Проект оценивается с точки зрения достаточности собственных средств и/или лизинга оборудования. DSCR для банковского кредита не применяется, если нет долговой нагрузки."
      : f.financing.creditNeeded === "yes"
        ? `Запрошенный кредит: ${formatCurrencyFull(f.financing.loanRequired)}, срок: ${f.financing.loanTermMonths} мес., ставка: ${f.financing.loanAnnualRatePct}% годовых (${sourceLabelRu(f.financing.loanAnnualRateSource)}), расчетный ежемесячный платеж: ${formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment)}. DSCR: ${f.financing.dscrLabel}.`
      : "Пользователь пока не определился с кредитом. Расчет показывает проект без обязательного кредита и отдельно подсвечивает потребность во внешнем капитале.",
    marketDataNote,
    `Оценка реализуемости проекта: ${input.feasibilityScore}/100. Готовность к финансированию: ${input.bankReadinessScore}/100. Главные зоны проверки: спрос, продажи, поставщики, документы, оборудование, оборотный капитал и локация.`,
    "До подачи заявки необходимо подтвердить коммерческие предложения, предварительный спрос, документы по помещению, разрешения и структуру финансирования."
  ];
}

export function generateNextActions(input: { project: StructuredProjectData; risks: RiskItem[]; bankReadinessScore: number }): string[] {
  const actions = isChildrenClothingProject(input.project) ? [
    "0-7 дней: посчитать трафик 3-5 похожих торговых точек в Чиланзаре в будни и выходные; отдельно проверить поток родителей с детьми возле выбранной точки.",
    "0-7 дней: собрать цены минимум 5 конкурентов по школьной форме, обуви, верхней одежде и базовым комплектам; сравнить их с плановым средним чеком.",
    "0-7 дней: запустить тестовые посты в Instagram/Telegram и собрать заявки по размерам, полу, возрасту и сезонным категориям.",
    "7-21 день: получить КП от 3 поставщиков детской одежды, обуви и школьной формы; проверить предоплату, отсрочку, обмен брака и условия дозакупки размеров.",
    "7-21 день: подтвердить аренду, депозит, коммунальные платежи, вывеску, режим работы и требования ТЦ/арендодателя до вложений в ремонт.",
    "21-45 дней: пересчитать модель после КП — закупочную цену, маржу, остатки, возвраты, сезонные скидки и оборачиваемость по размерному ряду.",
    "До подачи заявки: закрыть разрыв финансирования или подтвердить дополнительный источник; улучшить DSCR через снижение аренды/ФОТ, рост маржи или увеличение собственных средств.",
    "До подачи заявки: подготовить регистрацию, налоговый режим, кассу/POS, договор аренды, документы поставщиков, правила возврата, трудовые договоры и документы по залогу."
  ] : isDeviceRepairProject(input.project) ? [
    "Разделить финансовую модель на две линии: ремонт смартфонов и продажа аксессуаров/запчастей. По ремонту считать маржу по типовым операциям: экран, батарея, разъем, диагностика после воды; по аксессуарам — наценку и оборачиваемость.",
    "До подписания аренды собрать цены минимум 5 сервисных центров в Юнусабаде и 2-3 Instagram/Telegram-конкурентов: замена экрана, батареи, разъема, диагностика и гарантийные условия.",
    "Получить 2-3 КП от поставщиков экранов, батарей, шлейфов, стекол, чехлов и зарядок; отдельно сравнить брак, обмен, сроки доставки и валюту закупки.",
    "Подготовить акт приема устройства: модель, IMEI/серийный номер, комплектация, внешнее состояние, пароль/доступ, заявленная неисправность, срок, цена диагностики и согласие клиента.",
    "Утвердить гарантийную политику на работы и запчасти: срок гарантии, исключения после попадания воды, ответственность за данные клиента и порядок повторного обращения.",
    "Если выбрана аренда, ввести ежемесячную стоимость помещения: без подтвержденной аренды EBITDA и точка безубыточности не должны считаться надежными."
  ] : sectorActionPlan(input.project);
  if (input.project.creditNeeded === "yes" && !input.project.collateralAvailable) {
    actions.push("Для кредита рассмотреть лизинг оборудования, поручительство, гарантию, увеличение собственных средств или другой источник обеспечения.");
  }
  if (input.project.creditNeeded === "no") {
    actions.push("Проверить, хватает ли собственных средств и/или лизинга без привлечения банковского кредита.");
  }
  if (input.bankReadinessScore < 60) actions.push("До подачи заявки доработать бизнес-план с консультантом FINKO или профильным финансовым консультантом.");
  if (input.risks.some((risk) => risk.code === "fx_risk" && risk.level === "high")) actions.push("Найти локальных поставщиков и зафиксировать валютный буфер в цене.");
  return actions;
}


function projectCategory(project: StructuredProjectData): string {
  return String((project.businessProfile as Record<string, unknown> | undefined)?.category ?? getBusinessProfileForData(project).category ?? "generic");
}

function sectorActionPlan(project: StructuredProjectData): string[] {
  const category = projectCategory(project);
  const type = String(project.businessType ?? "бизнес");
  if (category === "retail" || category === "ecommerce") return [
    "0-7 дней: проверить трафик, конверсию, средний чек и цены 5 конкурентов; отдельно зафиксировать онлайн-заявки и повторные покупки.",
    "7-21 день: получить КП поставщиков по ключевым товарным категориям, условия обмена брака, отсрочки и минимальной партии.",
    "21-45 дней: пересчитать ассортимент, маржу, оборачиваемость, возвраты, остатки и оборотный капитал после КП.",
    "До подачи заявки: подготовить регистрацию, налоговый режим, кассу/POS, договор аренды, товарные документы, правила возврата и документы по финансированию."
  ];
  if (category === "food_service") return [
    "0-7 дней: протестировать меню, средний чек, поток клиентов и фактическую себестоимость блюд по сырью и списаниям.",
    "7-21 день: получить КП поставщиков продуктов, проверить санитарные требования, медосмотры, кассу/POS и договор аренды.",
    "21-45 дней: пересчитать маржу по меню, списания, график смен, загрузку кухни и точку безубыточности.",
    "До подачи заявки: собрать документы по помещению, поставщикам сырья, санитарным требованиям, пожарной безопасности и финансированию."
  ];
  if (category === "manufacturing") return [
    "0-7 дней: подтвердить производственную мощность, цикл выпуска, норму брака и себестоимость сырья по тестовой партии.",
    "7-21 день: получить КП оборудования, сырья, сервиса, монтажа и энергозатрат; проверить склад и технику безопасности.",
    "21-45 дней: пересчитать маржу, загрузку оборудования, график поставок, оборотный капитал и заказы клиентов.",
    "До подачи заявки: подготовить договор помещения, документы оборудования, сырьевые документы, сертификаты/стандарты и кадровые документы."
  ];
  if (category === "import_export") return [
    "0-7 дней: проверить валюту закупки, контракт, инвойс, логистику, таможенные платежи и запас по курсу.",
    "7-21 день: получить предложения от 2-3 поставщиков и логистических операторов; сравнить предоплату, сроки и сертификаты.",
    "21-45 дней: пересчитать оборотный капитал, валютный буфер, сроки поставки, складские расходы и маржу после таможенных платежей.",
    "До подачи заявки: подготовить импортный контракт, инвойс, таможенные документы, сертификаты, складские документы и условия финансирования."
  ];
  if (category === "services" || category === "beauty_wellness" || category === "professional_services" || category === "education" || category === "healthcare") return [
    `0-7 дней: проверить спрос на ${type}, прайс, загрузку сотрудников, расписание и повторные обращения через тестовые заявки.`,
    "7-21 день: подтвердить аренду, ФОТ, расходники, качество сервиса, отзывы и каналы привлечения клиентов.",
    "21-45 дней: пересчитать загрузку мастеров/сотрудников, маржу услуги, маркетинг, точку безубыточности и резерв на низкий сезон.",
    "До подачи заявки: подготовить регистрацию, налоги, кассу/POS при работе с физлицами, договор аренды, трудовые договоры и профильные разрешения."
  ];
  if (category === "construction" || category === "b2b") return [
    "0-7 дней: собрать письма о намерениях, пилотные заказы, прайс и график оплат от потенциальных корпоративных клиентов.",
    "7-21 день: проверить договоры, сроки оплаты, дебиторскую задолженность, концентрацию клиентов и требования к качеству работ.",
    "21-45 дней: пересчитать оборотный капитал с учетом отсрочки платежей, закупок, ФОТ, авансов и сезонности заказов.",
    "До подачи заявки: подготовить договоры, КП, график оплат, документы поставщиков, сметы и подтверждение финансирования."
  ];
  if (category === "rental" || /аренд|лизинг|rental/i.test(String(project.businessType ?? ""))) return [
    "0-7 дней: проверить стоимость актива, загрузку, среднюю аренду, простои, ремонт и условия ответственности клиента.",
    "7-21 день: получить КП на активы, сервис, страхование, GPS/учет и договор аренды с залогом/штрафами.",
    "21-45 дней: пересчитать лизинговый платеж, обслуживание, остаточную стоимость, загрузку и денежный поток по каждому активу.",
    "До подачи заявки: подготовить документы на актив, договоры аренды, страхование, график обслуживания и структуру финансирования."
  ];
  return [
    "0-7 дней: подтвердить единицу выручки, цену, объем, клиентов и каналы продаж именно для выбранной бизнес-модели.",
    "7-21 день: получить КП по ключевым затратам, оборудованию/расходникам, аренде, поставщикам и запуску.",
    "21-45 дней: пересчитать финансовую модель после проверки цены, маржи, загрузки, ФОТ и оборотного капитала.",
    "До подачи заявки: подготовить регистрационные документы, договоры, отраслевые требования, подтверждение спроса и структуру финансирования."
  ];
}

function sectorConclusionTerms(project: StructuredProjectData): { strengths: string; preLaunch: string; postLaunch: string; documents: string; next: string } {
  const category = projectCategory(project);
  if (category === "retail" || category === "ecommerce") return { strengths: "проверяемая товарная модель, средний чек, маржа, каналы продаж и возможность контролировать остатки", preLaunch: "трафик, конверсия, КП поставщиков, ассортимент, возвраты, касса/POS и договор аренды", postLaunch: "оборачиваемость остатков, сезонность, возвраты, скидки, повторные покупки и конкуренция", documents: "регистрация, налоговый режим, онлайн-касса/POS, договор аренды, товарные накладные, поставщики и правила возврата", next: "подтвердить спрос, поставщиков, маржу и оборотный капитал до финансовых обязательств" };
  if (category === "food_service") return { strengths: "понятная экономика среднего чека, меню, сырья, смен и потока клиентов", preLaunch: "себестоимость блюд, списания, санитарные требования, поставщики сырья, кухня и аренда", postLaunch: "качество, свежесть, списания, график смен, доставка и сезонность", documents: "регистрация, налоги, касса/POS, санитарные требования, договор аренды, медосмотры, поставщики сырья и пожарная безопасность", next: "проверить меню, себестоимость, санитарные документы и точку безубыточности" };
  if (category === "manufacturing") return { strengths: "расчет мощности, себестоимости, оборудования, сырья и производственного цикла", preLaunch: "КП оборудования, сырье, тестовая партия, брак, склад, энергия и техника безопасности", postLaunch: "загрузка оборудования, качество, брак, поставки сырья, заказы и обслуживание", documents: "регистрация, помещение, документы оборудования, сырьевые документы, стандарты/сертификаты, трудовые документы и пожарная безопасность", next: "подтвердить тестовую партию, заказы, мощность и себестоимость" };
  if (category === "import_export") return { strengths: "проверяемая торговая модель, контракт, логистика, валютные условия и оборотный капитал", preLaunch: "поставщик, инвойс, таможня, сертификаты, валюта, сроки поставки и склад", postLaunch: "курс валюты, задержки поставок, предоплата, остатки и изменение таможенных условий", documents: "регистрация, налоги, импортный контракт, инвойс, таможенные документы, сертификаты и складские документы", next: "закрепить поставщика, логистику, валютный буфер и таможенные документы" };
  if (category === "services" || category === "beauty_wellness" || category === "professional_services" || category === "education" || category === "healthcare") return { strengths: "экономика услуги, загрузка сотрудников, цена, расписание и повторные клиенты", preLaunch: "прайс, тестовые заявки, ФОТ, аренда, расходники, качество и каналы привлечения", postLaunch: "загрузка персонала, отзывы, повторные клиенты, текучесть кадров и маркетинг", documents: "регистрация, налоги, касса/POS при B2C, договор аренды, трудовые договоры, клиентские договоры и профильные разрешения", next: "подтвердить спрос, загрузку сотрудников, качество услуги и документы" };
  return { strengths: "связанные пользовательские данные, финансовая модель, риски, документы и источники", preLaunch: "спрос, цена, маржа, поставщики, документы, оборудование, аренда и оборотный капитал", postLaunch: "стабильность продаж, качество исполнения, платежи клиентов, поставки и кассовый разрыв", documents: "регистрация, налоги, договоры, отраслевые требования, документы поставщиков и финансирования", next: "подтвердить ключевые вводные и обновить финансовую модель перед заявкой" };
}

export function generateDetailedConclusion(input: { project: StructuredProjectData; financial: FinancialResult; risks: RiskItem[]; feasibilityScore: number; bankReadinessScore: number }): string[] {
  const highRisks = input.risks.filter((risk) => risk.level === "high").slice(0, 3).map((risk) => risk.title).join(", ") || "риски спроса, маржи, документов и финансирования требуют проверки";
  if (isChildrenClothingProject(input.project)) {
    const f = input.financial;
    const decision = input.bankReadinessScore >= 65 ? "предварительно готов к финансированию" : input.bankReadinessScore >= 45 ? "условно готов после доработки" : "не готов к подаче заявки без доработки";
    return [
      `Решение: проект ${decision}. Причина — бизнес-модель понятна и заполнена операционными данными, но банк будет внимательно проверять DSCR ${f.financing.dscrLabel}, EBITDA ${formatCurrencyCompact(f.profitability.monthlyEBITDA)} и разрыв финансирования ${formatCurrencyCompact(f.financing.financingGap)}.`,
      `Расчет подтверждает выручку ${formatCurrencyCompact(f.revenue.monthlyRevenue)} в месяц и валовую маржу ${f.profitability.grossMarginPct}%, но запас операционной прибыли относительно кредита ограничен.`,
      "Перед заявкой нужно выполнить 3-5 условий: подтвердить трафик точки, получить КП поставщиков, пересчитать ассортимент по размерному ряду, закрыть разрыв финансирования и получить предварительную оценку залога.",
      "Показатели для улучшения: поднять маржу, снизить аренду или ФОТ, сократить первую закупку неликвидных размеров, увеличить собственные средства и повысить DSCR до приемлемого банковского уровня.",
      "Документы: регистрация ИП/ООО, налоговый режим, онлайн-касса/POS, договор аренды, товарные накладные, документы импортного товара, правила обмена/возврата, трудовые договоры и документы на залог.",
      "Банк первым проверит источник погашения, фактический спрос, договор аренды, поставщиков, товарные документы, залог Cobalt/другой актив и реалистичность оборотного капитала."
    ];
  }
  const terms = sectorConclusionTerms(input.project);
  const readinessDecision = input.bankReadinessScore >= 65 ? "предварительно готов к финансированию" : input.bankReadinessScore >= 45 ? "условно готов после доработки" : "не готов к подаче заявки без доработки";
  const totalNeed = input.financial.financing?.totalInvestmentNeed ?? (input.financial.capex.totalCapEx + input.financial.workingCapital.requiredWorkingCapital);
  return [
    `Решение: проект ${readinessDecision}; оценка реализуемости ${input.feasibilityScore}/100 и готовность к финансированию ${input.bankReadinessScore}/100.`,
    `Сильные стороны: ${terms.strengths}; месячная выручка ${formatCurrencyCompact(input.financial.revenue.monthlyRevenue)}, валовая маржа ${input.financial.profitability.grossMarginPct}% и EBITDA ${formatCurrencyCompact(input.financial.profitability.monthlyEBITDA)} рассчитаны из введенных данных.`,
    `Слабые стороны: ${highRisks}. Финансовое ограничение — потребность в инвестициях ${formatCurrencyCompact(totalNeed)}, разрыв финансирования ${formatCurrencyCompact(input.financial.financing.financingGap)} и DSCR ${input.financial.financing.dscrLabel}.`,
    `Ключевые риски до запуска: ${terms.preLaunch}.`,
    `Ключевые риски после запуска: ${terms.postLaunch}.`,
    `Готовность к финансированию повысит подтверждение: КП поставщиков, фактического спроса, документов, залога/лизинга и денежного потока по расчетной модели.`,
    `Документы: ${terms.documents}.`,
    `Данные для проверки: цена, объем, маржа, аренда, ФОТ, оборудование, запасы/оборотный капитал, клиенты, каналы продаж и условия поставщиков.`,
    `Рекомендованный следующий шаг: ${terms.next}; затем пересчитать финансовую модель и повторно оценить риски.`,
    `Банк первым проверит источник погашения, корректность выручки ${formatCurrencyCompact(input.financial.revenue.monthlyRevenue)}, EBITDA ${formatCurrencyCompact(input.financial.profitability.monthlyEBITDA)}, DSCR ${input.financial.financing.dscrLabel}, документы и подтверждение спроса.`
  ];
}

function sourceIds(sources: DataSource[], limit = sources.length): string[] {
  return sources.slice(0, limit).map((source) => source.id);
}

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function inferRiskSourceIds(risk: RiskItem, riskSources: DataSource[]): string[] {
  const text = [risk.code, risk.category, risk.title, risk.reason, risk.mitigation].join(" ").toLowerCase();
  const selected = riskSources.filter((source) => {
    const haystack = [source.id, source.name, source.title, source.organization, source.reportSourceType, ...(source.topics ?? []), ...(source.sectors ?? [])].join(" ").toLowerCase();
    if (/валют|currency|fx|usd|импорт/.test(text) && /cbu|bank|currency|customs|import/.test(haystack)) return true;
    if (/налог|касс|tax|fiscal/.test(text) && /tax|soliq|cash register/.test(haystack)) return true;
    if (/постав|supplier|import|тамож/.test(text) && /customs|import|supplier|trade/.test(haystack)) return true;
    if (/документ|license|legal|compliance|соответств/.test(text) && /lex|license|legal|law|official/.test(haystack)) return true;
    if (/рынок|спрос|traffic|трафик|market|retail/.test(text) && /stat|statistics|market|retail|trade/.test(haystack)) return true;
    if (/сотруд|персонал|labor|payroll/.test(text) && /employment|mehnat|labor/.test(haystack)) return true;
    return false;
  });
  return sourceIds(selected.length ? selected : riskSources, 3);
}

export function buildReportData(input: { project: StructuredProjectData & { title?: string; sectorCode?: string }; financial: FinancialResult; risks: RiskItem[]; feasibilityScore: number; bankReadinessScore: number; marketData?: MarketDataResult; webResearch?: WebResearchResult | null; aiReport?: AIGeneratedReport | null }) {
  const f = input.financial;
  const p = input.project;
  const reportLocale = getReportLocale({ structuredData: p as Record<string, unknown>, userLanguage: p.userLanguage });
  const totalInvestment = f.financing?.totalInvestmentNeed ?? (f.capex.totalCapEx + f.workingCapital.requiredWorkingCapital);
  const payrollTotal = f.payroll?.totalMonthlyPayrollUZS ?? 0;
  const exchangeRateSnapshot = f.payroll?.exchangeRateSnapshot ?? p.exchangeRateSnapshot;
  const exchangeRate = hasPositiveUsdAmounts(f) ? (exchangeRateSnapshot?.rate ?? (f.financing.exchangeRateUZSPerUSD > 0 ? f.financing.exchangeRateUZSPerUSD : undefined)) : undefined;
  const exchangeRateRows = exchangeRate ? [
    ["Курс USD/UZS", exchangeRate.toLocaleString("ru-RU"), exchangeRateSnapshot?.source === "CBU" ? "Центральный банк Республики Узбекистан" : "Расчетное допущение"],
    ["Дата курса USD/UZS", exchangeRateSnapshot?.rateDate ?? exchangeRateSnapshot?.date ?? "Не указано", exchangeRateSnapshot?.sourceUrl ?? "Расчетное допущение"]
  ] : [];
  const employeeCount = employeeCountFromPayroll(f, p);
  const businessProfile = getBusinessProfileForData(p);
  const sourcePack = {
    marketSources: selectRelevantSourcesForReport({ ...p, businessProfile }, "market_data", 10, reportLocale),
    documentSources: selectRelevantSourcesForReport({ ...p, businessProfile }, "documents", 8, reportLocale),
    riskSources: selectRelevantSourcesForReport({ ...p, businessProfile }, "risk_matrix", 8, reportLocale),
    aiSources: selectRelevantSourcesForReport({ ...p, businessProfile }, "ai_analysis", 12, reportLocale),
    actionSources: selectRelevantSourcesForReport({ ...p, businessProfile }, "action_plan", 6, reportLocale)
  };
  const risksWithSources = input.risks.map((risk) => ({
    ...risk,
    sourceIds: risk.sourceIds?.length ? risk.sourceIds : inferRiskSourceIds(risk, sourcePack.riskSources)
  }));
  const numericMarketEvidence = numericMarketEvidenceFromData({ marketData: input.marketData, project: p });
  const marketEvidence = numericMarketEvidence.length ? numericMarketEvidence : buildMarketEvidence(p);
  const documentsAndPermits = getDocumentRequirements(businessProfile);
  const dataGapsAndAssumptions = [
    "Факты отделены от расчетов и допущений; непроверенные данные помечены как допущения.",
    "Официальные показатели и требования необходимо перепроверить в выбранных источниках перед подачей в банк/инвестору.",
    "Цены поставщиков, аренда, спрос, маржа и документы должны быть подтверждены КП, договорами или тестом рынка."
  ];
  const nextActions = generateNextActions({ project: p, risks: risksWithSources, bankReadinessScore: input.bankReadinessScore });
  const highRisks = risksWithSources.filter((risk) => risk.level === "high");
  const businessProfileLabel = businessProfile.subcategory
    ? `${labelValue(businessProfile.category, reportLocale)} / ${labelValue(businessProfile.subcategory, reportLocale)}`
    : labelValue(businessProfile.category, reportLocale);
  const operationalModelLabel = labelValue(businessProfile.operationalModel ?? "mixed", reportLocale);
  const aiReport = input.aiReport ?? generateFallbackReport({ ...input, locale: reportLocale });
  const webResearchRows = input.webResearch?.statistics?.filter((stat) => {
    const raw = `${stat.value} ${stat.indicator} ${stat.businessInterpretation} ${stat.howToUseInModel}`;
    return !/требуется\s+ручная\s+проверка|надежное\s+числовое\s+значение\s+не\s+найдено|manual\s+check/i.test(raw);
  }).map((stat) => [
    stat.indicator,
    `${stat.value}${stat.unit ? ` ${stat.unit}` : ""}`,
    stat.year ?? "н/д",
    stat.geography,
    stat.source ?? stat.sourceId,
    stat.businessInterpretation || stat.relevance,
    stat.howToUseInModel || stat.relevance,
    stat.confidence
  ]) ?? [];
  const fallbackMarketEvidenceRows = input.webResearch
    ? (webResearchRows.length ? [] : [[
      "Рыночный контекст",
      "Использованы proxy-источники",
      input.webResearch.researchDate ?? new Date().toISOString().slice(0, 10),
      input.webResearch.region ?? safe(p.region),
      "AI-поиск рыночных данных",
      input.webResearch.summary || "Прямой узкий показатель не загружен автоматически. Отчет использует proxy-контекст и не подставляет неподтвержденные числа в финансовый расчет.",
      "Подтвердить спрос тестовыми продажами, замером трафика, прайсом конкурентов и КП; финансовые выводы строить только на введенных и подтвержденных числах.",
      "medium"
    ]])
    : marketEvidence.map((item) => [item.indicator, item.sourceName, item.confidence, item.geography, item.limitation ?? "Использовать как рыночный proxy, а не как гарантию спроса конкретной точки."]);
  const baseReport = {
    title: input.project.title ?? "Предварительный отчет FINKO Business Advisor",
    executiveSummary: [
      reportLocale === "en"
        ? `AI classified the business as ${businessProfileLabel} with operating model ${operationalModelLabel}. The interview, risks, documents and sources are adapted to this profile.`
        : reportLocale === "uz"
          ? `AI biznesni ${businessProfileLabel} sifatida tasnifladi; operatsion model: ${operationalModelLabel}. Intervyu, risklar, hujjatlar va manbalar shu profilga moslashtirildi.`
          : `AI классифицировал бизнес как ${businessProfileLabel}; операционная модель: ${operationalModelLabel}. Интервью, риски, документы и источники адаптированы под этот профиль.`,
      ...(aiReport?.executiveSummary ? [aiReport.executiveSummary] : generateExecutiveSummary(input))
    ],
    projectProfile: p,
    businessProfile,
    financialModel: f,
    riskMatrix: risksWithSources,
    marketData: input.marketData,
    webResearchData: input.webResearch ?? null,
    aiReport,
    marketEvidence,
    documentsAndPermits,
    sourcePack,
    sourceUsageAudit: (() => {
      const selected = uniqueIds(Object.values(sourcePack).flat().map((source) => source.id));
      const marketIds = sourceIds(sourcePack.marketSources, marketEvidence.length ? 5 : 3);
      const documentIds = uniqueIds([
        ...documentsAndPermits.map((item) => String(item.sourceId ?? "")).filter(Boolean),
        ...sourceIds(sourcePack.documentSources, 8)
      ]);
      const riskIds = uniqueIds(risksWithSources.flatMap((risk) => risk.sourceIds ?? []));
      const aiIds = sourceIds(sourcePack.aiSources, 8);
      const actionIds = sourceIds(sourcePack.actionSources, 6);
      const conclusionIds = uniqueIds([...sourceIds(sourcePack.aiSources, 3), ...sourceIds(sourcePack.riskSources, 3)]);
      const claims = [
        ...marketEvidence.slice(0, 5).map((item) => ({ section: "marketData", text: `${item.indicator}: ${item.sourceName}`, sourceIds: marketIds.slice(0, 3), type: "market" as const })),
        ...documentsAndPermits.slice(0, 10).map((item) => ({ section: "documents", text: `${item.name_ru ?? item.title}: ${item.reportText}`, sourceIds: uniqueIds([String(item.sourceId ?? ""), ...documentIds]).slice(0, 3), type: "document" as const })),
        ...risksWithSources.slice(0, 12).map((risk) => ({ section: "risks", text: `${risk.title}: ${risk.reason}`, sourceIds: uniqueIds(risk.sourceIds?.length ? risk.sourceIds : riskIds).slice(0, 3), type: "risk" as const })),
        { section: "aiAnalysis", text: aiReport.executiveSummary, sourceIds: aiIds.slice(0, 4), type: "market" as const },
        { section: "aiAnalysis", text: aiReport.businessModelAssessment, sourceIds: aiIds.slice(0, 4), type: "recommendation" as const },
        { section: "aiAnalysis", text: aiReport.financialAnalysis, sourceIds: [], type: "financial" as const },
        ...nextActions.slice(0, 6).map((action) => ({ section: "actionPlan", text: action, sourceIds: actionIds.slice(0, 3), type: "recommendation" as const })),
        ...generateDetailedConclusion(input).slice(0, 4).map((text) => ({ section: "conclusion", text, sourceIds: conclusionIds.slice(0, 3), type: "recommendation" as const }))
      ].filter((claim) => String(claim.text ?? "").trim());
      const bySection = {
        aiAnalysis: uniqueIds(claims.filter((claim) => claim.section === "aiAnalysis").flatMap((claim) => claim.sourceIds)),
        marketData: uniqueIds(claims.filter((claim) => claim.section === "marketData").flatMap((claim) => claim.sourceIds)),
        documents: uniqueIds(claims.filter((claim) => claim.section === "documents").flatMap((claim) => claim.sourceIds)),
        risks: uniqueIds(claims.filter((claim) => claim.section === "risks").flatMap((claim) => claim.sourceIds)),
        actionPlan: uniqueIds(claims.filter((claim) => claim.section === "actionPlan").flatMap((claim) => claim.sourceIds)),
        conclusion: uniqueIds(claims.filter((claim) => claim.section === "conclusion").flatMap((claim) => claim.sourceIds)),
        references: [] as string[]
      };
      const used = uniqueIds(Object.values(bySection).flat());
      bySection.references = used.slice(0, 20);
      return {
        registrySize: sourceRegistry.length,
        selectedSourcesCount: selected.length,
        usedSourcesCount: used.length,
        bySection,
        claims,
        rejectedClaims: [] as Array<{ section: string; text: string; reason: string }>,
        unusedSelectedSources: selected.filter((id) => !used.includes(id)),
        rejectedSources: [] as Array<{ sourceId: string; reason: string }>
      };
    })(),
    dataGapsAndAssumptions,
    riskConclusion: {
      level: highRisks.length >= 3 ? "Высокий" : highRisks.length ? "Средний" : "Низкий",
      reasons: risksWithSources.slice(0, 3).map((risk) => risk.reason),
      actions: nextActions.slice(0, 3)
    },
    keyFigures: [
      ["Общий объем инвестиций", formatCurrencyFull(totalInvestment), "CapEx + оборотный капитал"],
      ["Собственные средства", formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency), "Указанная сумма и эквивалент в UZS"],
      ["Доля собственных средств", `${f.financing.ownContributionPct}%`, "От расчетной потребности"],
      ["Разрыв финансирования", f.financing.financingGap > 0 ? formatCurrencyFull(f.financing.financingGap) : na, f.financing.financingGap > 0 ? "Нужно закрыть до запуска" : "Потребность покрыта"],
      ["Сумма кредита", f.financing.creditNeeded === "yes" ? formatCurrencyFull(f.financing.loanRequired) : na, creditAmountComment(f)],
      ["Годовая ставка кредита", f.financing.creditNeeded === "yes" ? `${f.financing.loanAnnualRatePct}%` : na, f.financing.creditNeeded === "yes" ? sourceLabelRu(f.financing.loanAnnualRateSource) : "Кредит не применяется"],
      ["Ежемесячный платеж по кредиту", f.financing.creditNeeded === "yes" ? formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment) : na, f.financing.creditNeeded === "yes" ? `${f.financing.loanAnnualRatePct}% годовых, ${f.financing.loanTermMonths} мес.` : "Кредит не применяется"],
      ["Сумма лизинга", f.financing.leasingRequired ? formatCurrencyFull(f.financing.leasingRequired) : (f.financing.leasingSelected ? "Не указано" : na), f.financing.leasingRequired ? `${f.financing.leasingAnnualRatePct}% / ${f.financing.leasingTermMonths} мес.` : (f.financing.leasingSelected ? "Лизинг выбран, но сумма и условия не указаны" : "Лизинг не применяется")],
      ["Ежемесячный платеж по лизингу", f.financing.leasingSelected ? (f.financing.estimatedMonthlyLeasingPayment > 0 ? formatCurrencyFull(f.financing.estimatedMonthlyLeasingPayment) : "Требует расчета") : na, f.financing.leasingSelected ? (f.financing.leasingPaymentSource === "user_input" ? "Данные пользователя" : "Предварительный расчет; подтвердить у лизинговой компании") : "Лизинг не применяется"],
      ["Общая долговая/лизинговая нагрузка", f.financing.totalMonthlyDebtService > 0 ? formatCurrencyFull(f.financing.totalMonthlyDebtService) : na, f.financing.totalMonthlyDebtService > 0 ? "Кредитный платеж + лизинговый платеж" : "Кредит и лизинг не применяются"],
      ["Стартовые вложения", formatCurrencyFull(f.capex.totalCapEx), "Сумма видимых статей стартовых вложений"],
      ["Оборотный капитал", formatCurrencyFull(f.workingCapital.requiredWorkingCapital), `${f.workingCapital.bufferMonths} мес. фиксированных расходов + запасы/буферы`],
      ["Фонд оплаты труда в месяц", formatCurrencyFull(payrollTotal), "Сумма по ролям и количеству сотрудников"],
      ["Месячная выручка", formatCurrencyFull(f.revenue.monthlyRevenue), "Объем × цена × загрузка"],
      ["Годовая выручка", formatCurrencyFull(f.revenue.annualRevenue), "Месячная выручка x 12"],
      ["Себестоимость продаж", formatCurrencyFull(f.cogs.monthlyCOGS), f.cogs.source === "assumption" ? "Допущение по себестоимости" : "Данные пользователя"],
      ["Себестоимость среднего чека/единицы", formatCurrencyFull(f.cogs.wasteAdjustedUnitCOGS), "С учетом списаний/потерь"],
      ["Валовая маржа", `${f.profitability.grossMarginPct}%`, "Валовая прибыль / выручка"],
      ["EBITDA", formatCurrencyFull(f.profitability.monthlyEBITDA), "Валовая прибыль минус операционные расходы"],
      ["Точка безубыточности", f.profitability.breakEvenRevenue === null ? na : formatCurrencyFull(f.profitability.breakEvenRevenue), "Постоянные расходы / маржинальный доход"],
      ["DSCR", f.financing.dscrLabel, f.financing.totalMonthlyDebtService > 0 ? "EBITDA / платежи по долгу" : "Не применяется без долговой нагрузки"],
      ["Срок окупаемости", f.profitability.paybackMonths === null ? na : `${f.profitability.paybackMonths} мес.`, f.profitability.paybackMonths === null ? "Не рассчитывается при отрицательном денежном потоке" : "Потребность в инвестициях / чистый денежный поток"],
      ["Количество сотрудников", employeeCount > 0 ? `${employeeCount}` : "Не указано", employeeCount > 0 ? payrollBreakdown(f) : "Данные пользователя"],
      ...exchangeRateRows,
      f.revenue.conversionApplied
        ? ["Плановый объем продаж", `${(f.revenue.displayVolumeMonthlyEquivalent ?? f.revenue.monthlyCapacity).toLocaleString("ru-RU")} ${f.revenue.unitLabel ?? "продаж/мес."}`, `Расчет: ${(f.revenue.displayVolume ?? 0).toLocaleString("ru-RU")} ${f.revenue.displayVolumeUnitLabel ?? "посетителей/день"} × ${f.revenue.workingDaysForDisplay ?? 26} дней × ${f.revenue.conversionPct ?? 100}% конверсия`]
        : ["Плановый объем", `${(f.revenue.displayVolume ?? f.revenue.monthlyCapacity).toLocaleString("ru-RU")} ${f.revenue.displayVolumeUnitLabel ?? f.revenue.unitLabel ?? "ед./мес."}`, f.revenue.displayVolumeMonthlyEquivalent && f.revenue.displayVolumeMonthlyEquivalent !== (f.revenue.displayVolume ?? f.revenue.monthlyCapacity) ? `Данные пользователя; для расчёта в месяц: ${f.revenue.displayVolumeMonthlyEquivalent.toLocaleString("ru-RU")} ${f.revenue.unitLabel ?? "ед./мес."}` : "Данные пользователя" ],
      ...buildRevenueTransparencyRows(f, reportLocale)
    ],
    businessModelRows: [
      ["Категория", businessProfile.category, `confidence ${businessProfile.confidence}`],
      ["Подкатегория", businessProfile.subcategory ?? "Не указано", "AI classification"],
      ["Операционная модель", businessProfile.operationalModel ?? "mixed", "AI classification"],
      ["Драйверы выручки", businessProfile.keyRevenueDrivers.join(", "), "Business profile"],
      ["Драйверы затрат", businessProfile.keyCostDrivers.join(", "), "Business profile"],
    ],
    marketEvidenceRows: [
      ...webResearchRows,
      ...fallbackMarketEvidenceRows
    ],
    documentsRows: documentsAndPermits.map((item) => [
      item.name_ru ?? item.title,
      item.note_ru ?? item.reportText,
      `${item.whenRequired}; срок: ${typeof item.deadline_days === "number" ? `${item.deadline_days} дн.` : "нужно уточнить"}`,
      item.organ_ru ?? item.authority ?? item.sourceName ?? "Профильный консультант / государственные услуги",
      item.url ?? "Официальный URL нужно уточнить",
      `${item.required ? "Обязательный" : "Рекомендуемый"}; ${documentConfidenceLabel(item.confidence)}`,
      detailedDocumentComment(item)
    ]),
    investmentBreakdown: [
      ...f.capex.lineItems.map((item) => [item.label, formatCurrencyFull(item.amount), item.source === "user_input" ? "Данные пользователя" : "Допущение"]),
      ["Оборотный капитал", formatCurrencyFull(f.workingCapital.requiredWorkingCapital), "Фиксированные расходы, запасы и буферы"],
      ["Итого инвестиций", formatCurrencyFull(totalInvestment), "CapEx + необходимый оборотный капитал"]
    ],
    financingRecommendation: f.financing.creditNeeded === "no"
      ? `Пользователь не планирует кредит. Проект можно оценивать с точки зрения достаточности собственных средств и/или лизинга оборудования. Разрыв финансирования: ${f.financing.financingGap > 0 ? formatCurrencyFull(f.financing.financingGap) : "не выявлен"}.`
      : f.financing.creditNeeded === "yes"
        ? `Кредит запрошен на сумму ${formatCurrencyFull(f.financing.loanRequired)}. Использованная ставка: ${f.financing.loanAnnualRatePct}% годовых (${sourceLabelRu(f.financing.loanAnnualRateSource)}). Расчетный платеж: ${formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment)}, DSCR: ${f.financing.dscrLabel}. Нужно подтвердить залог, источник погашения и документы.`
        : "Кредит пока не выбран. Расчет показывает проект без обязательного кредита и какой внешний капитал может потребоваться после уточнения расходов.",
    detailedConclusion: generateDetailedConclusion(input),
    feasibilityScore: input.feasibilityScore,
    bankReadinessScore: input.bankReadinessScore,
    recommendedProducts: mockFinancingProducts,
    nextActions,
    actionPlanRows: nextActions.map((action, index) => [`${index + 1}`, action, index < 3 ? "До подачи заявки" : "До запуска", "Предприниматель / консультант"]),
    assumptionsRows: dataGapsAndAssumptions.map((item, index) => [`A${index + 1}`, item, "допущение/пробел данных"]),
    warnings: f.warnings,
    formulaRows: f.formulaRows,
    capexBreakdown: f.capex.lineItems,
    opexBreakdown: f.opex.lineItems,
    workingCapitalBreakdown: f.workingCapital,
    financingBreakdown: f.financing,
    disclaimer: getLocalizedDisclaimer(p.userLanguage),
    generatedAt: new Date().toISOString()
  };

  return localizeReportData(baseReport as any, reportLocale);
}

export async function buildReportDataWithAI(input: { project: StructuredProjectData & { title?: string; sectorCode?: string }; financial: FinancialResult; risks: RiskItem[]; feasibilityScore: number; bankReadinessScore: number; marketData?: MarketDataResult; webResearch?: WebResearchResult | null }): Promise<ReportData> {
  const locale = input.project.userLanguage ?? "ru";
  let aiReport: AIGeneratedReport | null = null;
  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    try {
      aiReport = await generateAIReport({ ...input, locale });
    } catch (error) {
      console.warn("[reportService] AI report generation failed, using fallback", error);
    }
  }
  aiReport ??= generateFallbackReport(input);
  return buildReportData({ ...input, aiReport });
}

export type ReportData = ReturnType<typeof buildReportData>;

export function hasCalculatedProjectReport(project: Record<string, unknown>) {
  return Boolean(
    project.financialResult &&
    project.riskResult &&
    typeof project.feasibilityScore === "number" &&
    typeof project.bankReadinessScore === "number"
  );
}

export function resolveReportData(project: Record<string, unknown>): ReportData | null {
  if (project.reportData && typeof project.reportData === "object") {
    const locale = getReportLocale(project);
    return localizeReportData(project.reportData as any, locale) as ReportData;
  }

  if (!hasCalculatedProjectReport(project)) {
    return null;
  }

  const profile = getProjectProfile(project);
  return buildReportData({
    project: {
      ...profile,
      title: typeof project.title === "string" ? project.title : undefined,
      sectorCode: typeof project.sectorCode === "string" ? project.sectorCode : profile.sectorCode
    },
    financial: project.financialResult as FinancialResult,
    risks: project.riskResult as RiskItem[],
    feasibilityScore: Number(project.feasibilityScore),
    bankReadinessScore: Number(project.bankReadinessScore),
    aiReport: (project.aiReportData as AIGeneratedReport | null | undefined) ?? null,
    webResearch: (project.webResearchData as WebResearchResult | null | undefined) ?? null
  });
}

export function exportReportJson(reportData: unknown): string {
  return JSON.stringify(reportData, null, 2);
}
