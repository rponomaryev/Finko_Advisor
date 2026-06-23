import type { AppLocale } from "../i18n/index.ts";

export type GlossaryTermKey =
  | "ebitda"
  | "capex"
  | "opex"
  | "cogs"
  | "dscr"
  | "grossMargin"
  | "contributionMargin"
  | "breakEven"
  | "paybackPeriod"
  | "workingCapital"
  | "debtService"
  | "utilizationRate"
  | "gracePeriod"
  | "collateral"
  | "annuityMethod"
  | "differentiatedMethod"
  | "exchangeRate"
  | "cbuRate"
  | "currencySnapshot";

export type GlossaryRow = {
  key: GlossaryTermKey;
  term: string;
  definition: string;
};

const glossary: Record<GlossaryTermKey, Record<AppLocale, Omit<GlossaryRow, "key">>> = {
  ebitda: {
    ru: { term: "EBITDA", definition: "Операционная прибыль до процентов, налогов и амортизации. В отчете это расчетный денежный ориентир до обслуживания долга." },
    en: { term: "EBITDA", definition: "Operating profit before interest, taxes, depreciation and amortization. In this report it is an indicative cash-flow measure before debt service." },
    uz: { term: "EBITDA", definition: "Foizlar, soliqlar va amortizatsiyadan oldingi operatsion foyda. Hisobotda qarz to'lovigacha bo'lgan pul oqimi ko'rsatkichi sifatida ishlatiladi." }
  },
  capex: {
    ru: { term: "Стартовые вложения", definition: "Капитальные затраты на запуск или расширение: оборудование, ремонт, мебель, сайт, сертификация и другие стартовые вложения." },
    en: { term: "CapEx", definition: "Capital expenditure for launch or expansion: equipment, fit-out, furniture, website, certification and other startup investments." },
    uz: { term: "CapEx", definition: "Boshlash yoki kengaytirish uchun kapital xarajatlar: uskuna, ta'mirlash, mebel, sayt, sertifikatlash va boshqa boshlang'ich investitsiyalar." }
  },
  opex: {
    ru: { term: "Операционные расходы", definition: "Расходы, которые бизнес несет каждый месяц: аренда, зарплаты, коммунальные услуги, маркетинг, логистика и сервис." },
    en: { term: "OpEx", definition: "Operating expenses incurred each month: rent, payroll, utilities, marketing, logistics and maintenance." },
    uz: { term: "OpEx", definition: "Har oy qilinadigan operatsion xarajatlar: ijara, ish haqi, kommunal, marketing, logistika va servis." }
  },
  cogs: {
    ru: { term: "Себестоимость продаж", definition: "Себестоимость проданных товаров или услуг: материалы, упаковка, прямая логистика и другие переменные затраты на единицу." },
    en: { term: "COGS", definition: "Cost of goods or services sold: materials, packaging, direct logistics and other variable costs per unit." },
    uz: { term: "COGS", definition: "Sotilgan tovar yoki xizmat tannarxi: xomashyo, qadoq, bevosita logistika va birlikka to'g'ri keladigan o'zgaruvchan xarajatlar." }
  },
  dscr: {
    ru: { term: "DSCR", definition: "Показывает, насколько EBITDA покрывает платежи по долгу. Для дифференцированного кредита используется самый тяжелый платеж." },
    en: { term: "DSCR", definition: "Shows how well EBITDA covers debt payments. For differentiated loans this report uses the heaviest payment month." },
    uz: { term: "DSCR", definition: "EBITDA qarz to'lovlarini qanchalik qoplay olishini ko'rsatadi. Differensial kreditda eng og'ir to'lov oyi olinadi." }
  },
  grossMargin: {
    ru: { term: "Валовая маржа", definition: "Доля выручки, которая остается после вычета прямой себестоимости." },
    en: { term: "Gross margin", definition: "Share of revenue left after direct cost of goods or services is deducted." },
    uz: { term: "Yalpi marja", definition: "Bevosita tannarx chegirilgandan keyin tushumdan qoladigan ulush." }
  },
  contributionMargin: {
    ru: { term: "Маржинальный доход", definition: "Цена продажи минус переменные затраты на единицу. Используется для расчета точки безубыточности." },
    en: { term: "Contribution margin", definition: "Sales price minus variable cost per unit. It is used for break-even calculation." },
    uz: { term: "Marjinal daromad", definition: "Sotuv narxi minus birlikka o'zgaruvchan xarajat. Zararsizlik nuqtasini hisoblashda ishlatiladi." }
  },
  breakEven: {
    ru: { term: "Точка безубыточности", definition: "Объем продаж, при котором выручка покрывает постоянные и переменные расходы." },
    en: { term: "Break-even point", definition: "Sales level where revenue covers fixed and variable costs." },
    uz: { term: "Zararsizlik nuqtasi", definition: "Tushum doimiy va o'zgaruvchan xarajatlarni qoplaydigan sotuv darajasi." }
  },
  paybackPeriod: {
    ru: { term: "Срок окупаемости", definition: "Оценка времени, за которое чистый денежный поток возвращает первоначальные инвестиции." },
    en: { term: "Payback period", definition: "Estimated time needed for net cash flow to recover the initial investment." },
    uz: { term: "O'zini qoplash muddati", definition: "Sof pul oqimi boshlang'ich investitsiyani qoplashiga ketadigan taxminiy vaqt." }
  },
  workingCapital: {
    ru: { term: "Оборотный капитал", definition: "Деньги на запасы, текущие расходы и платежные разрывы до стабильной выручки." },
    en: { term: "Working capital", definition: "Funds for inventory, current expenses and payment gaps before stable revenue." },
    uz: { term: "Aylanma kapital", definition: "Barqaror tushumgacha zaxira, joriy xarajat va to'lov uzilishlari uchun mablag'." }
  },
  debtService: {
    ru: { term: "Платежи по долгу", definition: "Ежемесячные платежи по кредиту и лизингу, включая основной долг и проценты." },
    en: { term: "Debt service", definition: "Monthly loan and leasing payments, including principal and interest." },
    uz: { term: "Qarzga xizmat ko'rsatish", definition: "Asosiy qarz va foizlarni o'z ichiga olgan oylik kredit/lizing to'lovlari." }
  },
  utilizationRate: {
    ru: { term: "Загрузка мощности", definition: "Доля плановой мощности, которую бизнес реально использует в расчетах." },
    en: { term: "Utilization rate", definition: "Share of planned capacity that the business actually uses in calculations." },
    uz: { term: "Quvvatdan foydalanish", definition: "Hisob-kitobda ishlatiladigan reja quvvatining amaldagi ulushi." }
  },
  gracePeriod: {
    ru: { term: "Льготный период", definition: "Период, когда основной долг не погашается. В текущей модели проценты считаются отдельно как допущение." },
    en: { term: "Grace period", definition: "Period when principal is not repaid. In the current model, interest during grace is treated as an explicit assumption." },
    uz: { term: "Imtiyozli davr", definition: "Asosiy qarz to'lanmaydigan davr. Hozirgi modelda bu davrdagi foizlar alohida faraz sifatida hisoblanadi." }
  },
  collateral: {
    ru: { term: "Залог", definition: "Актив или гарантия, которые банк или лизинговая компания оценивают как обеспечение сделки." },
    en: { term: "Collateral", definition: "Asset or guarantee assessed by a bank or leasing company as security for financing." },
    uz: { term: "Garov", definition: "Bank yoki lizing kompaniyasi moliyalashtirish ta'minoti sifatida baholaydigan aktiv yoki kafolat." }
  },
  annuityMethod: {
    ru: { term: "Аннуитетный метод", definition: "Ежемесячный платеж одинаковый на протяжении срока кредита, если ставка и срок не меняются." },
    en: { term: "Annuity method", definition: "Monthly payment stays the same during the loan term if rate and term do not change." },
    uz: { term: "Annuitet usuli", definition: "Stavka va muddat o'zgarmasa, kredit muddati davomida oylik to'lov bir xil bo'ladi." }
  },
  differentiatedMethod: {
    ru: { term: "Дифференцированный метод", definition: "Основной долг гасится равными частями, а проценты уменьшаются вместе с остатком долга." },
    en: { term: "Differentiated method", definition: "Principal is repaid in equal parts, while interest declines as the outstanding balance falls." },
    uz: { term: "Differensial usul", definition: "Asosiy qarz teng qismlarda to'lanadi, foiz esa qoldiq kamaygani sari kamayadi." }
  },
  exchangeRate: {
    ru: { term: "Курс валюты", definition: "Коэффициент пересчета одной валюты в другую. В проекте USD пересчитывается в UZS." },
    en: { term: "Exchange rate", definition: "Rate used to convert one currency into another. In this project USD is converted to UZS." },
    uz: { term: "Valyuta kursi", definition: "Bir valyutani boshqasiga aylantirish koeffitsiyenti. Loyihada USD UZSga aylantiriladi." }
  },
  cbuRate: {
    ru: { term: "Курс Центрального банка", definition: "Официальный курс Центрального банка Республики Узбекистан на дату заявки или сохраненного отчета." },
    en: { term: "CBU rate", definition: "Official Central Bank of Uzbekistan rate for the application date or saved report snapshot." },
    uz: { term: "MB kursi", definition: "Ariza sanasi yoki saqlangan hisobot snapshoti uchun O'zbekiston Respublikasi Markaziy bankining rasmiy kursi." }
  },
  currencySnapshot: {
    ru: { term: "Снимок курса валюты", definition: "Сохраненная копия курса: запрошенная дата, дата курса ЦБ, значение, источник и время получения." },
    en: { term: "Currency snapshot", definition: "Saved exchange-rate record: requested date, CBU rate date, value, source and fetch time." },
    uz: { term: "Valyuta snapshoti", definition: "Saqlangan kurs yozuvi: so'ralgan sana, MB kurs sanasi, qiymat, manba va olish vaqti." }
  }
};

export const defaultGlossaryKeys: GlossaryTermKey[] = [
  "ebitda",
  "capex",
  "opex",
  "cogs",
  "dscr",
  "grossMargin",
  "contributionMargin",
  "breakEven",
  "paybackPeriod",
  "workingCapital",
  "debtService",
  "utilizationRate",
  "gracePeriod",
  "collateral",
  "annuityMethod",
  "differentiatedMethod",
  "exchangeRate",
  "cbuRate",
  "currencySnapshot"
];

export function getGlossaryRow(key: GlossaryTermKey, locale: AppLocale): GlossaryRow {
  return { key, ...glossary[key][locale] };
}

export function getGlossaryRows(locale: AppLocale, keys: GlossaryTermKey[] = defaultGlossaryKeys): GlossaryRow[] {
  return keys.map((key) => getGlossaryRow(key, locale));
}

export function glossaryText(key: GlossaryTermKey, locale: AppLocale): string {
  return glossary[key][locale].definition;
}
