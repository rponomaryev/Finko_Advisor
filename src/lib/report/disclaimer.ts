import type { StructuredProjectData } from "../types/project.ts";

export const MVP_DISCLAIMER =
  "Данный отчет является предварительной консультационной оценкой. Он не является гарантией прибыли, финансирования, одобрения кредита или инвестиционной рекомендацией. Рыночные числовые данные используются только при наличии источника; финансовые допущения необходимо проверить перед принятием решений.";

const localizedDisclaimers = {
  ru: MVP_DISCLAIMER,
  uz: "Ushbu hisobot dastlabki maslahat bahosidir. U foyda, moliyalashtirish, kredit ma'qullanishi yoki investitsiya tavsiyasini kafolatlamaydi. Bozor raqamli ma'lumotlari faqat manba mavjud bo'lsa ishlatiladi; moliyaviy farazlar qaror qabul qilishdan oldin tekshirilishi kerak.",
  en: "This report is a preliminary advisory assessment. It is not a guarantee of profit, financing, loan approval, or an investment recommendation. Market numeric data is used only when a source is available; financial assumptions must be verified before making decisions."
} as const;

export function getLocalizedDisclaimer(locale?: StructuredProjectData["userLanguage"]): string {
  return localizedDisclaimers[locale ?? "ru"] ?? localizedDisclaimers.ru;
}
