import type { AppLocale } from "./index.ts";
import { resolveUserLocale } from "./resolveUserLocale.ts";

export type ReportLocale = AppLocale;

type Localized<T = string> = Record<AppLocale, T>;

export const reportLocaleNames: Record<AppLocale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O'zbekcha"
};

export const reportMessages = {
  sections: {
    formulas: { ru: "Формулы", en: "Formulas", uz: "Formulalar" },
    workingCapital: { ru: "Оборотный капитал", en: "Working capital", uz: "Aylanma kapital" },
    financing: { ru: "Финансирование", en: "Financing", uz: "Moliyalashtirish" },
    warnings: { ru: "Предупреждения по данным", en: "Data warnings", uz: "Ma'lumotlar bo'yicha ogohlantirishlar" },
    collateral: { ru: "Залог", en: "Collateral", uz: "Garov" },
    readiness: { ru: "Готовность", en: "Readiness", uz: "Tayyorlik" },
    charts: { ru: "Графики", en: "Charts", uz: "Grafiklar" },
    export: { ru: "Экспорт", en: "Export", uz: "Eksport" },
    disclaimer: { ru: "Ограничение ответственности", en: "Disclaimer", uz: "Ogohlantirish" }
  },
  statuses: {
    ok: { ru: "OK", en: "OK", uz: "OK" },
    notApplicable: { ru: "Не применяется", en: "Not applicable", uz: "Qo'llanilmaydi" },
    notFilled: { ru: "Не указано", en: "Not specified", uz: "Ko'rsatilmagan" },
    notCalculated: { ru: "Не рассчитывается", en: "Not calculated", uz: "Hisoblanmaydi" },
    requiresImprovement: { ru: "Требует доработки", en: "Requires improvement", uz: "Takomillashtirish kerak" },
    feasible: { ru: "предварительно реализуемый", en: "preliminarily feasible", uz: "dastlabki bahoda amalga oshirish mumkin" },
    improveBeforeLaunch: { ru: "требует доработки перед запуском", en: "requires improvement before launch", uz: "ishga tushirishdan oldin takomillashtirish kerak" },
    noCriticalRisks: { ru: "риски спроса, документов и финансирования требуют подтверждения", en: "demand, document and financing risks require validation", uz: "talab, hujjatlar va moliyalashtirish risklari tasdiqlanishi kerak" },
    high: { ru: "Высокий", en: "High", uz: "Yuqori" },
    medium: { ru: "Средний", en: "Medium", uz: "O'rta" },
    low: { ru: "Низкий", en: "Low", uz: "Past" }
  },
  source: {
    user_input: { ru: "Данные пользователя", en: "User input", uz: "Foydalanuvchi kiritgan" },
    assumption: { ru: "Допущение", en: "Assumption", uz: "Faraz" },
    external_source: { ru: "Внешний источник", en: "External source", uz: "Tashqi manba" },
    calculated: { ru: "Расчет", en: "Calculated", uz: "Hisoblangan" },
    estimated: { ru: "Оценка", en: "Estimated", uz: "Baholangan" },
    market_proxy: { ru: "Рыночный ориентир", en: "Market proxy", uz: "Bozor orientiri" },
    not_found: { ru: "Не найдено", en: "Not found", uz: "Topilmadi" }
  },
  metrics: {
    totalInvestmentNeed: { ru: "Общий объем инвестиций", en: "Total investment need", uz: "Umumiy investitsiya ehtiyoji" },
    ownContribution: { ru: "Собственные средства", en: "Own contribution", uz: "O'z mablag'i" },
    ownContributionShare: { ru: "Доля собственных средств", en: "Own contribution share", uz: "O'z mablag'i ulushi" },
    financingGap: { ru: "Разрыв финансирования", en: "Financing gap", uz: "Moliyalashtirish bo'shlig'i" },
    loanAmount: { ru: "Сумма кредита", en: "Loan amount", uz: "Kredit summasi" },
    annualLoanRate: { ru: "Годовая ставка кредита", en: "Annual loan rate", uz: "Kreditning yillik stavkasi" },
    monthlyLoanPayment: { ru: "Ежемесячный платеж по кредиту", en: "Monthly loan payment", uz: "Oylik kredit to'lovi" },
    leasingAmount: { ru: "Сумма лизинга", en: "Leasing amount", uz: "Lizing summasi" },
    startupCapex: { ru: "Стартовые вложения", en: "Startup CapEx", uz: "Boshlang'ich investitsiyalar" },
    workingCapital: { ru: "Оборотный капитал", en: "Working capital", uz: "Aylanma kapital" },
    monthlyPayroll: { ru: "Фонд оплаты труда в месяц", en: "Monthly payroll", uz: "Oylik ish haqi fondi" },
    monthlyRevenue: { ru: "Месячная выручка", en: "Monthly revenue", uz: "Oylik tushum" },
    annualRevenue: { ru: "Годовая выручка", en: "Annual revenue", uz: "Yillik tushum" },
    cogs: { ru: "Себестоимость продаж", en: "COGS", uz: "Sotuv tannarxi" },
    cogsPerUnit: { ru: "Себестоимость среднего чека/единицы", en: "COGS per unit", uz: "O'rtacha chek/birlik tannarxi" },
    grossMargin: { ru: "Валовая маржа", en: "Gross margin", uz: "Yalpi marja" },
    ebitda: { ru: "EBITDA", en: "EBITDA", uz: "EBITDA" },
    breakEven: { ru: "Точка безубыточности", en: "Break-even point", uz: "Zararsizlik nuqtasi" },
    dscr: { ru: "DSCR", en: "DSCR", uz: "DSCR" },
    paybackPeriod: { ru: "Срок окупаемости", en: "Payback period", uz: "Qoplash muddati" },
    employeeCount: { ru: "Количество сотрудников", en: "Employee count", uz: "Xodimlar soni" },
    exchangeRate: { ru: "Курс USD/UZS", en: "USD/UZS exchange rate", uz: "USD/UZS valyuta kursi" },
    exchangeRateDate: { ru: "Дата курса USD/UZS", en: "USD/UZS rate date", uz: "USD/UZS kursi sanasi" },
    plannedVolume: { ru: "Плановый объем", en: "Planned volume", uz: "Rejadagi hajm" },
    equipment: { ru: "Оборудование", en: "Equipment", uz: "Uskunalar" },
    premisesSetup: { ru: "Ремонт и подготовка помещения", en: "Premises setup", uz: "Joyni tayyorlash" },
    availableFunding: { ru: "Доступное финансирование", en: "Available funding", uz: "Mavjud moliyalashtirish" },
    fundingSurplus: { ru: "Излишек финансирования", en: "Funding surplus", uz: "Ortiqcha moliyalashtirish" }
  },
  comments: {
    capexPlusWorkingCapital: { ru: "Стартовые вложения + оборотный капитал", en: "CapEx + working capital", uz: "Boshlang'ich investitsiyalar + aylanma kapital" },
    ownContributionEquivalent: { ru: "Указанная сумма и эквивалент в UZS", en: "Stated amount and UZS equivalent", uz: "Kiritilgan summa va UZS ekvivalenti" },
    ownContributionOfNeed: { ru: "От расчетной потребности", en: "Of calculated need", uz: "Hisoblangan ehtiyojdan" },
    gapToClose: { ru: "Нужно закрыть до запуска", en: "Must be covered before launch", uz: "Ishga tushirishdan oldin yopilishi kerak" },
    needCovered: { ru: "Потребность покрыта", en: "Need is covered", uz: "Ehtiyoj qoplangan" },
    creditNotSelected: { ru: "Кредит не выбран", en: "Credit not selected", uz: "Kredit tanlanmagan" },
    creditNeedsClarification: { ru: "Требует уточнения", en: "Needs clarification", uz: "Aniqlashtirish kerak" },
    creditNotApplicable: { ru: "Кредит не применяется", en: "Credit not applicable", uz: "Kredit qo'llanilmaydi" },
    annualMonths: { ru: "{rate}% годовых, {months} мес.", en: "{rate}% annual, {months} months", uz: "yillik {rate}%, {months} oy" },
    leasingNotApplicable: { ru: "Лизинг не применяется", en: "Leasing not applicable", uz: "Lizing qo'llanilmaydi" },
    capexVisibleItems: { ru: "Сумма видимых статей стартовых вложений", en: "Sum of visible CapEx items", uz: "Boshlang'ich investitsiyalar moddalari yig'indisi" },
    workingCapitalFormula: { ru: "{months} мес. фиксированных расходов + запасы/буферы", en: "{months} months of fixed costs + stock/buffers", uz: "{months} oy doimiy xarajatlar + zaxira/buferlar" },
    payrollByRoles: { ru: "Сумма по ролям и количеству сотрудников", en: "Sum by roles and headcount", uz: "Rollar va xodimlar soni bo'yicha summa" },
    monthlyRevenueFormula: { ru: "Объем × Цена × Загрузка", en: "Volume × Price × Utilization", uz: "Hajm × Narx × Yuklama" },
    annualRevenueFormula: { ru: "Месячная выручка × 12", en: "Monthly revenue × 12", uz: "Oylik tushum × 12" },
    cogsAssumption: { ru: "Допущение по себестоимости", en: "COGS assumption", uz: "Tannarx farazi" },
    userData: { ru: "Данные пользователя", en: "User input", uz: "Foydalanuvchi kiritgan" },
    wasteAdjusted: { ru: "С учетом списаний/потерь", en: "Including waste/losses", uz: "Yo'qotishlar hisobga olingan" },
    grossProfitRevenue: { ru: "Валовая прибыль / Выручка", en: "Gross profit / Revenue", uz: "Yalpi foyda / Tushum" },
    grossProfitOpex: { ru: "Валовая прибыль - операционные расходы", en: "Gross profit - OpEx", uz: "Yalpi foyda - operatsion xarajatlar" },
    fixedContribution: { ru: "Фиксированные расходы / маржинальный доход", en: "Fixed OpEx / Contribution margin", uz: "Doimiy xarajatlar / marjinal daromad" },
    noDebtService: { ru: "Не применяется без долговой нагрузки", en: "Not applicable without debt service", uz: "Qarz to'lovi bo'lmasa qo'llanilmaydi" },
    noNegativeCashPayback: { ru: "Не рассчитывается при отрицательном денежном потоке", en: "Not calculated when cash flow is negative", uz: "Pul oqimi salbiy bo'lsa hisoblanmaydi" },
    investmentNetCash: { ru: "Потребность в инвестициях / чистый денежный поток", en: "Investment need / net cash flow", uz: "Investitsiya ehtiyoji / sof pul oqimi" },
    exchangeRateCbu: { ru: "Центральный банк Республики Узбекистан", en: "Central Bank of Uzbekistan", uz: "O'zbekiston Respublikasi Markaziy banki" },
    exchangeRateAssumption: { ru: "Расчетное допущение", en: "Calculation assumption", uz: "Hisob-kitob farazi" },
    fixedCosts: { ru: "Ежемесячные фиксированные операционные расходы", en: "Monthly fixed operating costs", uz: "Oylik doimiy operatsion xarajatlar" },
    bufferMonths: { ru: "Количество месяцев запаса", en: "Months covered by the buffer", uz: "Bufer oylar soni" },
    inventoryAdds: { ru: "Увеличивает потребность в оборотном капитале", en: "Adds to working capital need", uz: "Aylanma kapital ehtiyojini oshiradi" },
    payableReduces: { ru: "Снижает потребность в оборотном капитале", en: "Reduces working capital need", uz: "Aylanma kapital ehtiyojini kamaytiradi" },
    financingAvailable: { ru: "Собственные средства и подтвержденное финансирование", en: "Own funds and confirmed financing", uz: "O'z mablag'i va tasdiqlangan moliyalashtirish" },
    uncoveredNeed: { ru: "Непокрытая потребность в инвестициях", en: "Uncovered investment need", uz: "Qoplanmagan investitsiya ehtiyoji" },
    fundingAboveNeed: { ru: "Финансирование сверх потребности", en: "Funding above the investment need", uz: "Ehtiyojdan ortiq moliyalashtirish" },
    debtService: { ru: "EBITDA / платежи по долгу", en: "EBITDA divided by debt service", uz: "EBITDA qarzga xizmat ko'rsatishga bo'lingan" }
  },
  capex: {
    equipmentCapex: { ru: "Оборудование", en: "Equipment", uz: "Uskunalar" },
    premisesSetupCapex: { ru: "Ремонт и подготовка помещения", en: "Premises renovation and setup", uz: "Joyni ta'mirlash va tayyorlash" },
    furnitureFixturesCapex: { ru: "Мебель и инвентарь", en: "Furniture and fixtures", uz: "Mebel va inventar" },
    itPosWebsiteCapex: { ru: "Учёт, касса, терминал и сайт", en: "IT / POS / cash desk / website", uz: "Hisob, kassa, terminal va sayt" },
    registrationCertificationCapex: { ru: "Регистрация и сертификация", en: "Registration and certification", uz: "Ro'yxatdan o'tish va sertifikatlash" },
    initialInventoryCapex: { ru: "Первоначальный запас", en: "Initial inventory", uz: "Boshlang'ich zaxira" },
    deliveryInstallationCapex: { ru: "Доставка и монтаж", en: "Delivery and installation", uz: "Yetkazib berish va montaj" },
    trainingLaunchCapex: { ru: "Обучение и запуск", en: "Training and launch", uz: "O'qitish va ishga tushirish" },
    capexReserve: { ru: "Резерв стартовых вложений", en: "CapEx reserve", uz: "Boshlang'ich investitsiyalar zaxirasi" },
    otherCapex: { ru: "Прочие стартовые вложения", en: "Other CapEx", uz: "Boshqa boshlang'ich investitsiyalar" },
    moldCost: { ru: "Формы / оснастка", en: "Molds / tooling", uz: "Qoliplar / uskunalar" }
  },
  opex: {
    monthlyPayroll: { ru: "Зарплата", en: "Payroll", uz: "Ish haqi" },
    monthlyRent: { ru: "Аренда", en: "Rent", uz: "Ijara" },
    monthlyUtilities: { ru: "Коммунальные", en: "Utilities", uz: "Kommunal xarajatlar" },
    monthlyMarketing: { ru: "Маркетинг", en: "Marketing", uz: "Marketing" },
    monthlyMaintenance: { ru: "Обслуживание", en: "Maintenance", uz: "Texnik xizmat" },
    monthlyTaxes: { ru: "Налоги", en: "Taxes", uz: "Soliqlar" },
    monthlyLogistics: { ru: "Логистика", en: "Logistics", uz: "Logistika" },
    monthlySoftware: { ru: "ПО / IT", en: "Software / IT", uz: "Dasturiy ta'minot / IT" },
    monthlyInsurance: { ru: "Страхование", en: "Insurance", uz: "Sug'urta" },
    monthlyAccounting: { ru: "Бухгалтерия", en: "Accounting", uz: "Buxgalteriya" },
    monthlyOtherOpex: { ru: "Прочие расходы", en: "Other expenses", uz: "Boshqa xarajatlar" }
  },
  formulas: {
    monthlyRevenue: {
      indicator: { ru: "Месячная выручка", en: "Monthly revenue", uz: "Oylik tushum" },
      formula: { ru: "Объем × Цена × Загрузка", en: "Volume × Price × Utilization", uz: "Hajm × Narx × Yuklama" }
    },
    cogs: {
      indicator: { ru: "Себестоимость", en: "COGS", uz: "Tannarx" },
      formula: { ru: "Количество единиц × Себестоимость единицы × (1 + Потери%)", en: "Units × Unit COGS × (1 + Waste%)", uz: "Birliklar soni × Bir birlik tannarxi × (1 + Yo'qotishlar%)" }
    },
    grossMargin: {
      indicator: { ru: "Валовая маржа", en: "Gross margin", uz: "Yalpi marja" },
      formula: { ru: "Валовая прибыль / Выручка", en: "Gross profit / Revenue", uz: "Yalpi foyda / Tushum" }
    },
    opex: {
      indicator: { ru: "Операционные расходы", en: "Operating expenses", uz: "Operatsion xarajatlar" },
      formula: { ru: "ФОТ + Аренда + Коммунальные + Маркетинг + Обслуживание + Налоги + Логистика + ПО + Страхование + Бухгалтерия + Прочие расходы", en: "Payroll + Rent + Utilities + Marketing + Maintenance + Taxes + Logistics + Software + Insurance + Accounting + Other", uz: "Ish haqi fondi + Ijara + Kommunal xarajatlar + Marketing + Texnik xizmat + Soliqlar + Logistika + Dasturiy ta'minot + Sug'urta + Buxgalteriya + Boshqa xarajatlar" }
    },
    workingCapital: {
      indicator: { ru: "Оборотный капитал", en: "Working capital", uz: "Aylanma kapital" },
      formula: { ru: "Ежемесячные фиксированные расходы × месяцы буфера + первоначальный запас + буфер дебиторки - буфер кредиторки + сезонный запас", en: "Monthly fixed OpEx × Buffer months + Initial inventory + Accounts receivable buffer - Accounts payable buffer + Seasonal stock", uz: "Oylik doimiy xarajatlar × bufer oylari + boshlang'ich zaxira + debitorlik buferi - kreditorlik buferi + mavsumiy zaxira" }
    },
    financingGap: {
      indicator: { ru: "Разрыв финансирования", en: "Financing gap", uz: "Moliyalashtirish bo'shlig'i" },
      formula: { ru: "Общая потребность в инвестициях - Доступное финансирование", en: "Total investment need - Available funding", uz: "Umumiy investitsiya ehtiyoji - Mavjud moliyalashtirish" }
    },
    breakEven: {
      indicator: { ru: "Точка безубыточности", en: "Break-even point", uz: "Zararsizlik nuqtasi" },
      formula: { ru: "Фиксированные расходы / маржинальный доход на единицу", en: "Fixed OpEx / Contribution margin per unit", uz: "Doimiy xarajatlar / bir birlik marjinal daromadi" }
    },
    loanDscr: {
      indicator: { ru: "Платеж по кредиту / DSCR", en: "Loan payment / DSCR", uz: "Kredit to'lovi / DSCR" },
      formula: { ru: "Аннуитет: PMT; дифференцированный: основной долг / месяцы + проценты на остаток; DSCR = EBITDA / максимальный платеж", en: "Annuity: PMT; differentiated: principal / months + interest on remaining balance; DSCR = EBITDA / max payment", uz: "Annuitet: PMT; differensial: asosiy qarz / oylar + qoldiq foizi; DSCR = EBITDA / maksimal to'lov" }
    }
  }
} as const;

export function tReport<T = string>(entry: Localized<T>, locale: AppLocale): T {
  return entry[locale] ?? entry.ru;
}

export function getReportLocale(project?: Record<string, unknown> | null, uiLocale?: unknown): AppLocale {
  return resolveUserLocale({
    requestLocale: uiLocale,
    project
  });
}
