import type { Locale } from "../types/project.ts";

export function officialDataNotFoundMessage(locale: Locale = "ru") {
  if (locale === "uz") return "Ushbu ko'rsatkich bo'yicha rasmiy raqamli ma'lumot topilmadi.";
  if (locale === "en") return "Official numerical data for this indicator was not found.";
  return "Официальные числовые данные по этому показателю не найдены.";
}

export function mappingClarificationMessage(locale: Locale = "ru") {
  if (locale === "uz") return "Sektor mosligi aniq emas. Admin rasmiy ma'lumot yuklaganda biznes turi yoki faoliyat kodini aniqlashtiring.";
  if (locale === "en") return "The sector mapping is uncertain. Clarify the business type or activity code when uploading official data.";
  return "Сопоставление сектора неочевидно. Уточните тип бизнеса или код деятельности при загрузке официальных данных.";
}
