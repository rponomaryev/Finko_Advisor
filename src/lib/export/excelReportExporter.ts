import ExcelJS from "exceljs";
import path from "node:path";
import { accessSync } from "node:fs";
import { prepareReportExport, type PreparedReportExport } from "./reportExportTypes.ts";
import { reportMetric } from "../report/reportFormatters.ts";
import { cleanInlineSourcePlaceholders } from "../report/sourceCitationFormatter.ts";
import { labelValue } from "../utils/labels.ts";
import { formatRiskLevel } from "../risk/riskScoring.ts";
import { replaceForbiddenUserFacingTerms } from "../i18n/userFacingSanitizer.ts";

const BRAND = "FFE11446";
const LIGHT = "FFF4F5F7";
const BORDER = "FFE5E7EB";

function sheetNames(locale: PreparedReportExport["locale"]) {
  if (locale === "ru") {
    return {
      overview: "Сводка",
      businessProfile: "Бизнес-профиль",
      financial: "Финансовая модель",
      sensitivity: "Чувствительность",
      riskMatrix: "Матрица рисков",
      riskRegister: "Реестр рисков",
      documents: "Документы",
      premises: "Помещение",
      readiness: "Финансирование",
      market: "Рыночные данные",
      sources: "Источники",
      assumptions: "Допущения",
      recommendations: "План действий",
      formulas: "Формулы",
      capex: "Стартовые вложения",
      opex: "Опер. расходы",
      financing: "Структура средств",
      glossary: "Глоссарий",
      charts: "Данные для графиков",
      importExport: "Импорт и экспорт"
    };
  }
  if (locale === "uz") {
    return {
      overview: "Xulosa",
      businessProfile: "Biznes profili",
      financial: "Moliyaviy model",
      sensitivity: "Sezgirlik",
      riskMatrix: "Risklar matritsasi",
      riskRegister: "Risklar reyestri",
      documents: "Hujjatlar",
      premises: "Joy",
      readiness: "Moliyalashtirish",
      market: "Bozor ma'lumotlari",
      sources: "Manbalar",
      assumptions: "Farazlar",
      recommendations: "Harakat rejasi",
      formulas: "Formulalar",
      capex: "Boshlang'ich inv.",
      opex: "Operatsion xarajatlar",
      financing: "Mablag' tuzilmasi",
      glossary: "Glossariy",
      charts: "Grafik ma'lumotlari",
      importExport: "Import va eksport"
    };
  }
  return {
    overview: "Summary",
    businessProfile: "Business Profile",
    financial: "Financial Model",
    sensitivity: "Sensitivity",
    riskMatrix: "Risk Matrix",
    riskRegister: "Risk Register",
    documents: "Documents & Permits",
    premises: "Premises & Infrastructure",
    readiness: "Financing Readiness",
    market: "Market Evidence",
    sources: "Sources",
    assumptions: "Assumptions",
    recommendations: "Action Plan",
    formulas: "Formulas",
    capex: "CapEx",
    opex: "OpEx",
    financing: "Financing",
    glossary: "Glossary",
    charts: "Charts",
    importExport: "Import Export"
  };
}


function headers(locale: PreparedReportExport["locale"]) {
  if (locale === "en") {
    return {
      generatedAt: "Generated at",
      keyFindings: "Key findings",
      field: "Field",
      value: "Value",
      interview: ["Section", "Field", "Answer", "Unit", "Required"],
      financial: ["Indicator", "Value", "Unit", "Comment"],
      formula: ["Indicator", "Formula", "Substitution", "Result", "Source", "Input A", "Input B", "Input C", "Excel formula"],
      breakdown: ["Item", "Amount", "Source", "Comment"],
      risks: ["Risk", "Level", "Reason", "Recommendation"],
      market: ["Indicator", "Year", "Region", "Value", "Unit", "Currency", "Source", "Last Updated", "Match quality", "Relevance"],
      importExport: ["Type", "HS Code", "Product Category", "Year", "Country", "Value USD", "Volume", "Unit", "Source"],
      recommendations: ["Area", "Recommendation", "Priority"],
      sources: ["Source Name", "Source Type", "URL", "Year", "Last Updated", "Notes"],
      glossary: ["Term", "Definition"],
      warnings: ["Warning type", "Warning", "Values", "Severity"]
    };
  }
  if (locale === "uz") {
    return {
      generatedAt: "Yaratilgan vaqt",
      keyFindings: "Asosiy xulosalar",
      field: "Maydon",
      value: "Qiymat",
      interview: ["Bo'lim", "Maydon", "Javob", "Birlik", "Majburiy"],
      financial: ["Ko'rsatkich", "Qiymat", "Birlik", "Izoh"],
      formula: ["Ko'rsatkich", "Formula", "Qo'yilgan qiymatlar", "Natija", "Manba", "A", "B", "C", "Excel formula"],
      breakdown: ["Modda", "Summa", "Manba", "Izoh"],
      risks: ["Risk", "Daraja", "Sabab", "Tavsiya"],
      market: ["Ko'rsatkich", "Yil", "Hudud", "Qiymat", "Birlik", "Valyuta", "Manba", "Yangilangan", "Moslik sifati", "Dolzarblik"],
      importExport: ["Tur", "TN VED kodi", "Kategoriya", "Yil", "Davlat", "USD qiymat", "Hajm", "Birlik", "Manba"],
      recommendations: ["Yo'nalish", "Tavsiya", "Ustuvorlik"],
      sources: ["Manba", "Turi", "URL", "Yil", "Yangilangan", "Izoh"],
      glossary: ["Atama", "Izoh"],
      warnings: ["Ogohlantirish turi", "Ogohlantirish", "Qiymatlar", "Muhimlik"]
    };
  }
  return {
    generatedAt: "Сформировано",
    keyFindings: "Ключевые выводы",
    field: "Показатель",
    value: "Значение",
    interview: ["Раздел", "Поле", "Ответ", "Ед.", "Обяз."],
    financial: ["Показатель", "Значение", "Ед.", "Комментарий"],
    formula: ["Показатель", "Формула", "Подстановка", "Результат", "Источник", "Параметр A", "Параметр B", "Параметр C", "Excel-формула"],
    breakdown: ["Статья", "Сумма", "Источник", "Комментарий"],
    risks: ["Риск", "Уровень", "Причина", "Рекомендация"],
    market: ["Показатель", "Год", "Регион", "Значение", "Ед.", "Валюта", "Источник", "Обновлено", "Качество совпадения", "Релевантность"],
    importExport: ["Тип", "Код ТН ВЭД", "Категория продукта", "Год", "Страна", "Стоимость USD", "Объем", "Ед.", "Источник"],
    recommendations: ["Раздел", "Рекомендация", "Приоритет"],
    sources: ["Источник", "Тип", "URL", "Год", "Обновлено", "Примечание"],
    glossary: ["Термин", "Расшифровка"],
    warnings: ["Тип предупреждения", "Предупреждение", "Значения", "Уровень"]
  };
}

function safeCell(value: unknown, locale: PreparedReportExport["locale"] = "ru"): string | number | boolean | ExcelJS.CellRichTextValue | ExcelJS.CellFormulaValue | null {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    if (value === -1) return locale === "en" ? "Not specified" : locale === "uz" ? "Ko'rsatilmagan" : "Не указано";
    return value;
  }
  if (typeof value === "boolean") return value ? (locale === "en" ? "Yes" : locale === "uz" ? "Ha" : "Да") : (locale === "en" ? "No" : locale === "uz" ? "Yo'q" : "Нет");
  if (typeof value === "object") return "";
  if (typeof value === "string") {
    if (["undefined", "null", "NaN", "Infinity", "[object Object]"].includes(value.trim()) || /^-1\s+(сум|UZS)$/i.test(value.trim())) return "";
    const localizedValue = replaceForbiddenUserFacingTerms(value, locale);
    if (/^[=+\-@\t\r]/.test(localizedValue)) return `'${localizedValue}`;
    return localizedValue;
  }
  return String(value);
}

function addSafeRow(sheet: ExcelJS.Worksheet, values: unknown[], locale: PreparedReportExport["locale"] = "ru") {
  return sheet.addRow(values.map((value) => safeCell(value, locale)));
}

function safeReferenceCell(value: unknown, locale: PreparedReportExport["locale"] = "ru"): string | number | boolean | ExcelJS.CellRichTextValue | ExcelJS.CellFormulaValue | null {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (typeof value === "boolean") return value ? (locale === "en" ? "Yes" : locale === "uz" ? "Ha" : "Да") : (locale === "en" ? "No" : locale === "uz" ? "Yo'q" : "Нет");
  if (typeof value === "object") return "";
  if (typeof value === "string") {
    if (["undefined", "null", "NaN", "Infinity", "[object Object]"].includes(value.trim()) || /^-1\s+(сум|UZS)$/i.test(value.trim())) return "";
const cleaned = replaceForbiddenUserFacingTerms(
  cleanInlineSourcePlaceholders(value, locale),
  locale
);
if (/^[=+\-@\t\r]/.test(cleaned)) return `'${cleaned}`;
return cleaned;
  }
  return String(value);
}

function addReferenceRow(sheet: ExcelJS.Worksheet, values: unknown[], locale: PreparedReportExport["locale"] = "ru") {
  return sheet.addRow(values.map((value) => safeReferenceCell(value, locale)));
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.eachCell((cell) => {
    cell.border = { top: { style: "thin", color: { argb: BORDER } }, left: { style: "thin", color: { argb: BORDER } }, bottom: { style: "thin", color: { argb: BORDER } }, right: { style: "thin", color: { argb: BORDER } } };
  });
}

function finalizeWorksheet(worksheet: ExcelJS.Worksheet, widths: number[]) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.columns = widths.map((width) => ({ width }));
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => {
      cell.border = { top: { style: "thin", color: { argb: BORDER } }, left: { style: "thin", color: { argb: BORDER } }, bottom: { style: "thin", color: { argb: BORDER } }, right: { style: "thin", color: { argb: BORDER } } };
    });
    if (rowNumber === 1) row.height = 22;
  });
}

function maybeAddLogo(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet) {
  try {
    const logoPath = path.join(process.cwd(), "public", "finko-logo.png");
    accessSync(logoPath);
    const logoId = workbook.addImage({ filename: logoPath, extension: "png" });
    sheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 150, height: 55 } });
  } catch {
    // Logo is optional for local tests, but used when available in the project.
  }
}

function addOverviewSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  const h = headers(data.locale);
  const sheet = workbook.addWorksheet(sheetNames(data.locale).overview);
  maybeAddLogo(workbook, sheet);
  addSafeRow(sheet, [data.title, ""], data.locale);
  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").font = { bold: true, size: 16 };
  addSafeRow(sheet, [h.generatedAt, data.generatedAt], data.locale);
  sheet.addRow([]);
  const header = addSafeRow(sheet, [h.field, h.value], data.locale);
  applyHeaderStyle(header);
  for (const row of data.summary) addSafeRow(sheet, [row.label, row.value], data.locale);
  sheet.addRow([]);
  const keyFindingsHeader = addSafeRow(sheet, [h.keyFindings, ""], data.locale);
  keyFindingsHeader.font = { bold: true };
  for (const item of data.executiveSummary) addSafeRow(sheet, [item, ""], data.locale);
  sheet.addRow([]);
  addSafeRow(sheet, [data.locale === "ru" ? "Ограничение ответственности" : data.locale === "uz" ? "Ogohlantirish" : "Disclaimer", data.disclaimer], data.locale);
  finalizeWorksheet(sheet, [34, 100]);
}

function addTableSheet(workbook: ExcelJS.Workbook, name: string, headerLabels: string[], rows: unknown[][], widths: number[], locale: PreparedReportExport["locale"] = "ru") {
  const sheet = workbook.addWorksheet(name);
  const header = addSafeRow(sheet, headerLabels, locale);
  applyHeaderStyle(header);
  for (const row of rows) addSafeRow(sheet, row, locale);
  finalizeWorksheet(sheet, widths);
  return sheet;
}

function addFinancialSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  const h = headers(data.locale);
  const sheet = addTableSheet(
    workbook,
    sheetNames(data.locale).financial,
    h.financial,
    data.financialRows.map((row) => [row.indicator, row.value, row.unit, row.comment]),
    [34, 24, 14, 54],
    data.locale
  );
  sheet.getColumn(2).numFmt = "#,##0";
}

function addFormulaSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  const h = headers(data.locale);
  const sheet = workbook.addWorksheet(sheetNames(data.locale).formulas);
  const header = addSafeRow(sheet, h.formula, data.locale);
  applyHeaderStyle(header);
  for (const row of data.formulaRows) {
    const excelRow = addSafeRow(sheet, [row.indicator, row.formula, row.substitution, row.result, row.source, "", "", "", ""], data.locale);
    const n = excelRow.number;
    if (/выруч|revenue/i.test(row.indicator)) {
      sheet.getCell(`F${n}`).value = data.report.financialModel.revenue.monthlyCapacity;
      sheet.getCell(`G${n}`).value = data.report.financialModel.revenue.averagePrice;
      sheet.getCell(`H${n}`).value = data.report.financialModel.revenue.expectedUtilizationPct / 100;
      sheet.getCell(`I${n}`).value = { formula: `F${n}*G${n}*H${n}`, result: data.report.financialModel.revenue.calculatedMonthlyRevenue };
    } else if (/cogs/i.test(row.indicator)) {
      sheet.getCell(`F${n}`).value = data.report.financialModel.revenue.effectiveUnits;
      sheet.getCell(`G${n}`).value = data.report.financialModel.cogs.unitCOGS;
      sheet.getCell(`H${n}`).value = 1 + data.report.financialModel.cogs.wasteAllowancePct / 100;
      sheet.getCell(`I${n}`).value = { formula: `F${n}*G${n}*H${n}`, result: data.report.financialModel.cogs.monthlyCOGS };
    } else if (/gap|разрыв/i.test(row.indicator)) {
      sheet.getCell(`F${n}`).value = data.report.financialModel.financing.totalInvestmentNeed;
      sheet.getCell(`G${n}`).value = data.report.financialModel.financing.availableFunding;
      sheet.getCell(`I${n}`).value = { formula: `MAX(F${n}-G${n},0)`, result: data.report.financialModel.financing.financingGap };
    } else if (/working|оборот/i.test(row.indicator)) {
      sheet.getCell(`F${n}`).value = data.report.financialModel.workingCapital.monthlyFixedCosts;
      sheet.getCell(`G${n}`).value = data.report.financialModel.workingCapital.bufferMonths;
      sheet.getCell(`H${n}`).value = data.report.financialModel.workingCapital.initialInventory + data.report.financialModel.workingCapital.accountsReceivableBuffer - data.report.financialModel.workingCapital.accountsPayableBuffer + data.report.financialModel.workingCapital.seasonalStockBuffer;
      sheet.getCell(`I${n}`).value = { formula: `F${n}*G${n}+H${n}`, result: data.report.financialModel.workingCapital.requiredWorkingCapital };
    }
  }
  finalizeWorksheet(sheet, [28, 34, 52, 22, 22, 16, 16, 16, 22]);
  sheet.getColumn(9).numFmt = "#,##0";
}

function addReadinessSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  const names = sheetNames(data.locale);
  const rows = [
    [data.locale === "ru" ? "Оценка реализуемости" : data.locale === "uz" ? "Amalga oshirish bahosi" : "Feasibility score", `${data.report.feasibilityScore}/100`],
    [data.locale === "ru" ? "Готовность к финансированию" : data.locale === "uz" ? "Moliyalashtirishga tayyorlik" : "Financing readiness", `${data.report.bankReadinessScore}/100`],
    [data.locale === "ru" ? "Рекомендация" : data.locale === "uz" ? "Tavsiya" : "Recommendation", data.financingRecommendation]
  ];
  addTableSheet(workbook, names.readiness, [headers(data.locale).field, headers(data.locale).value], rows, [34, 90], data.locale);
}

function addChartsSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  const names = sheetNames(data.locale);
  const sheet = workbook.addWorksheet(names.charts);
  maybeAddLogo(workbook, sheet);
  addSafeRow(sheet, [data.locale === "ru" ? "Данные для построения графиков" : data.locale === "uz" ? "Grafiklar uchun ma'lumot" : "Chart-ready data", ""], data.locale);
  sheet.addRow([]);
  const header = addSafeRow(sheet, [data.locale === "ru" ? "Серия" : data.locale === "uz" ? "Seriya" : "Series", data.locale === "ru" ? "Статья" : data.locale === "uz" ? "Modda" : "Item", data.locale === "ru" ? "Сумма" : data.locale === "uz" ? "Summa" : "Amount"], data.locale);
  applyHeaderStyle(header);
  const rows: Array<[string, string, string]> = [
    ...data.capexRows.filter((r) => !/итого|total|jami/i.test(r.item)).map((r) => [data.locale === "ru" ? "Стартовые вложения" : data.locale === "uz" ? "Boshlang'ich investitsiyalar" : "CapEx", r.item, r.amount] as [string, string, string]),
    ...data.opexRows.filter((r) => !/итого|total|jami/i.test(r.item)).map((r) => [data.locale === "ru" ? "Операционные расходы" : data.locale === "uz" ? "Operatsion xarajatlar" : "OpEx", r.item, r.amount] as [string, string, string]),
    [data.locale === "ru" ? "Выручка/себестоимость/EBITDA" : data.locale === "uz" ? "Tushum/tannarx/EBITDA" : "Revenue/COGS/EBITDA", reportMetric("monthlyRevenue", data.locale), data.report.financialModel.revenue.monthlyRevenue.toString()],
    [data.locale === "ru" ? "Выручка/себестоимость/EBITDA" : data.locale === "uz" ? "Tushum/tannarx/EBITDA" : "Revenue/COGS/EBITDA", reportMetric("cogs", data.locale), data.report.financialModel.cogs.monthlyCOGS.toString()],
    [data.locale === "ru" ? "Выручка/себестоимость/EBITDA" : data.locale === "uz" ? "Tushum/tannarx/EBITDA" : "Revenue/COGS/EBITDA", "EBITDA", data.report.financialModel.profitability.monthlyEBITDA.toString()],
    [data.locale === "ru" ? "Финансирование" : data.locale === "uz" ? "Moliyalashtirish" : "Financing", reportMetric("ownContribution", data.locale), data.report.financialModel.financing.ownContributionUZS.toString()],
    [data.locale === "ru" ? "Финансирование" : data.locale === "uz" ? "Moliyalashtirish" : "Financing", reportMetric("loanAmount", data.locale), data.report.financialModel.financing.loanRequired.toString()],
    [data.locale === "ru" ? "Финансирование" : data.locale === "uz" ? "Moliyalashtirish" : "Financing", reportMetric("leasingAmount", data.locale), data.report.financialModel.financing.leasingRequired.toString()],
    [data.locale === "ru" ? "Финансирование" : data.locale === "uz" ? "Moliyalashtirish" : "Financing", reportMetric("financingGap", data.locale), data.report.financialModel.financing.financingGap.toString()]
  ];
  for (const row of rows) addSafeRow(sheet, row, data.locale);
  sheet.addRow([]);
  addSafeRow(sheet, [data.locale === "ru" ? "Примечание" : data.locale === "uz" ? "Izoh" : "Note", data.locale === "ru" ? "Лист содержит таблицы для построения графиков и логотип FINKO." : data.locale === "uz" ? "Grafiklar uchun tayyor jadvallar berilgan." : "Chart-ready tables are provided for workbook viewers."], data.locale);
  finalizeWorksheet(sheet, [26, 36, 24]);
}


function addAIAnalysisSheet(workbook: ExcelJS.Workbook, data: PreparedReportExport) {
  if (!data.aiReport) return;
  const sheet = workbook.addWorksheet(data.locale === "ru" ? "ИИ Анализ и рекомендации" : data.locale === "uz" ? "AI tahlili va tavsiyalar" : "AI Analysis and Recommendations");
  const sections = [
    { title: data.locale === "ru" ? "Резюме" : data.locale === "uz" ? "Xulosa" : "Summary", content: data.aiReport.executiveSummary },
    { title: data.locale === "ru" ? "Анализ рынка" : data.locale === "uz" ? "Bozor tahlili" : "Market analysis", content: data.aiReport.marketAnalysis },
    { title: data.locale === "ru" ? "Оценка бизнес-модели" : data.locale === "uz" ? "Biznes model bahosi" : "Business model assessment", content: data.aiReport.businessModelAssessment },
    { title: data.locale === "ru" ? "Финансовый анализ" : data.locale === "uz" ? "Moliyaviy tahlil" : "Financial analysis", content: data.aiReport.financialAnalysis },
    { title: data.locale === "ru" ? "Анализ рисков" : data.locale === "uz" ? "Risk tahlili" : "Risk assessment", content: data.aiReport.riskAssessment },
    { title: data.locale === "ru" ? "План действий" : data.locale === "uz" ? "Harakat rejasi" : "Action plan", content: data.aiReport.actionPlan },
    { title: data.locale === "ru" ? "Готовность к финансированию" : data.locale === "uz" ? "Moliyalashtirishga tayyorlik" : "Investment readiness", content: data.aiReport.investmentReadiness }
  ];

  let rowNum = 1;
  for (const section of sections) {
    const headerRow = sheet.getRow(rowNum++);
    headerRow.getCell(1).value = section.title;
    headerRow.getCell(1).font = { bold: true, size: 13, color: { argb: BRAND } };
    headerRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    headerRow.getCell(1).alignment = { wrapText: true, vertical: "top" };

    const contentRow = sheet.getRow(rowNum++);
    contentRow.getCell(1).value = safeCell(section.content, data.locale) as string;
    contentRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    contentRow.height = Math.min(220, Math.max(42, String(section.content ?? "").length / 4));
    rowNum += 1;
  }

  if (data.aiReport.citations?.length) {
    const citHeader = sheet.getRow(rowNum++);
    citHeader.getCell(1).value = data.locale === "ru" ? "Использованные источники" : data.locale === "uz" ? "Foydalanilgan manbalar" : "Sources used";
    citHeader.getCell(1).font = { bold: true, size: 12 };
    for (const citation of data.aiReport.citations) {
      const row = sheet.getRow(rowNum++);
      row.getCell(1).value = safeCell(`• ${citation.text}`, data.locale) as string;
      const citationSource = String(safeCell(citation.source, data.locale) ?? "");

  if (citation.url) {
    row.getCell(2).value = { text: citationSource, hyperlink: citation.url };
  } else {
    row.getCell(2).value = citationSource;
  }
      row.alignment = { wrapText: true, vertical: "top" };
    }
  }

  sheet.getColumn(1).width = 90;
  sheet.getColumn(2).width = 45;
  finalizeWorksheet(sheet, [90, 45]);
}

export async function buildExcelReportBuffer(project: Record<string, unknown>, localeOverride?: unknown) {
  const data = prepareReportExport(project, localeOverride);
  return buildExcelReportFromData(data);
}

export async function buildExcelReportFromData(data: PreparedReportExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FINKO Business Advisor";
  workbook.company = "FINKO";
  workbook.created = new Date();
  workbook.modified = new Date();

  const names = sheetNames(data.locale);
  const h = headers(data.locale);
  addOverviewSheet(workbook, data);
  addAIAnalysisSheet(workbook, data);
  addTableSheet(workbook, names.businessProfile, h.breakdown, data.businessProfileRows.map((r) => [r.item, r.amount, r.source, r.comment]), [30, 32, 24, 54], data.locale);
  addTableSheet(workbook, names.market, h.breakdown, data.marketEvidenceRows.map((r) => [r.item, r.amount, r.source, r.comment]), [32, 38, 18, 70], data.locale);
  addFinancialSheet(workbook, data);
  addTableSheet(workbook, names.sensitivity, h.breakdown, data.sensitivityRows.map((r) => [r.item, r.amount, r.source, r.comment]), [34, 28, 18, 48], data.locale);
  const riskLevel = (level: string, score?: number) => formatRiskLevel(level, data.locale, score);
  const riskMatrixHeaders = data.locale === "ru"
    ? ["Риск", "Вероятность", "Влияние", "Балл", "Уровень"]
    : data.locale === "uz"
      ? ["Risk", "Ehtimollik", "Ta'sir", "Ball", "Daraja"]
      : ["Risk", "Probability", "Impact", "Score", "Level"];
  const riskRegisterHeaders = data.locale === "ru"
    ? ["Риск", "Уровень", "Причина", "Доказательства", "Недостающие данные", "Митигация", "Ответственный", "Срок"]
    : data.locale === "uz"
      ? ["Risk", "Daraja", "Sabab", "Dalillar", "Yetishmayotgan ma'lumot", "Kamaytirish", "Mas'ul", "Muddat"]
      : ["Risk", "Level", "Reason", "Evidence", "Missing data", "Mitigation", "Owner", "Timing"];
  addTableSheet(workbook, names.riskMatrix, riskMatrixHeaders, data.report.riskMatrix.map((r) => [r.title, r.probability, r.impact, r.score, riskLevel(r.level, r.score)]), [34, 14, 14, 12, 16], data.locale);
  addTableSheet(workbook, names.riskRegister, riskRegisterHeaders, data.report.riskMatrix.map((r) => [r.title, riskLevel(r.level, r.score), r.reason, (r.evidence ?? []).join("; "), (r.missingData ?? []).join("; "), r.mitigation, r.owner, r.timing]), [30, 14, 46, 40, 40, 54, 22, 22], data.locale);
  addTableSheet(workbook, names.documents, h.breakdown, data.documentRows.map((r) => [r.item, r.amount, r.source, r.comment]), [36, 26, 36, 72], data.locale);
  addTableSheet(workbook, names.premises, h.breakdown, data.premisesRows.map((r) => [r.item, r.amount, r.source, r.comment]), [32, 34, 22, 58], data.locale);
  addReadinessSheet(workbook, data);
  addTableSheet(workbook, names.recommendations, h.breakdown, data.actionPlanRows.map((r) => [r.item, r.amount, r.source, r.comment]), [10, 90, 22, 28], data.locale);
  const sourceSheet = workbook.addWorksheet(names.sources);
  applyHeaderStyle(addReferenceRow(sourceSheet, h.sources, data.locale));
  for (const r of data.sources) addReferenceRow(sourceSheet, [r.sourceName, r.sourceType, r.url, r.year, r.lastUpdated, r.notes], data.locale);
  finalizeWorksheet(sourceSheet, [24, 18, 36, 10, 18, 64]);
  addTableSheet(workbook, names.assumptions, h.breakdown, data.assumptionRows.map((r) => [r.item, r.amount, r.source, r.comment]), [14, 100, 28, 20], data.locale);
  addFormulaSheet(workbook, data);
  addTableSheet(workbook, names.capex, h.breakdown, data.capexRows.map((r) => [r.item, r.amount, r.source, r.comment]), [34, 22, 22, 44], data.locale);
  addTableSheet(workbook, names.opex, h.breakdown, data.opexRows.map((r) => [r.item, r.amount, r.source, r.comment]), [34, 22, 22, 44], data.locale);
  addTableSheet(workbook, names.financing, h.breakdown, data.financingRows.map((r) => [r.item, r.amount, r.source, r.comment]), [34, 28, 22, 52], data.locale);
  addTableSheet(workbook, names.glossary, h.glossary, data.glossaryRows.map((r) => [r.term, r.definition]), [24, 100], data.locale);
  addChartsSheet(workbook, data);
  addTableSheet(workbook, names.importExport, h.importExport, data.importExport.map((r) => [r.type, r.hsCode, r.productCategory, r.year, r.country, r.valueUsd, r.volume, r.unit, r.source]), [14, 12, 34, 12, 20, 16, 16, 12, 24], data.locale);
  if (data.warnings.length) {
    addTableSheet(workbook, data.locale === "ru" ? "Предупреждения" : data.locale === "uz" ? "Ogohlantirishlar" : "Warnings", h.warnings, data.warnings.map((r) => [r.title, r.message, r.values, r.severity]), [28, 76, 60, 16], data.locale);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
