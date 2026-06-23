import type { Locale } from "../types/project.ts";
import { formatRegion } from "../location/locationNormalizer.ts";

export type UzbekistanRegion = {
  id: string;
  ru: string;
  uz: string;
  en: string;
};

export const uzbekistanRegions: UzbekistanRegion[] = [
  { id: "andijan", ru: "Андижанская область", uz: "Andijon viloyati", en: "Andijan Region" },
  { id: "bukhara", ru: "Бухарская область", uz: "Buxoro viloyati", en: "Bukhara Region" },
  { id: "fergana", ru: "Ферганская область", uz: "Farg'ona viloyati", en: "Fergana Region" },
  { id: "jizzakh", ru: "Джизакская область", uz: "Jizzax viloyati", en: "Jizzakh Region" },
  { id: "khorezm", ru: "Хорезмская область", uz: "Xorazm viloyati", en: "Khorezm Region" },
  { id: "namangan", ru: "Наманганская область", uz: "Namangan viloyati", en: "Namangan Region" },
  { id: "navoi", ru: "Навоийская область", uz: "Navoiy viloyati", en: "Navoi Region" },
  { id: "qashqadaryo", ru: "Кашкадарьинская область", uz: "Qashqadaryo viloyati", en: "Qashqadaryo Region" },
  { id: "karakalpakstan", ru: "Республика Каракалпакстан", uz: "Qoraqalpog'iston Respublikasi", en: "Republic of Karakalpakstan" },
  { id: "samarkand", ru: "Самаркандская область", uz: "Samarqand viloyati", en: "Samarkand Region" },
  { id: "sirdaryo", ru: "Сырдарьинская область", uz: "Sirdaryo viloyati", en: "Sirdaryo Region" },
  { id: "surxondaryo", ru: "Сурхандарьинская область", uz: "Surxondaryo viloyati", en: "Surxondaryo Region" },
  { id: "tashkent_region", ru: "Ташкентская область", uz: "Toshkent viloyati", en: "Tashkent Region" },
  { id: "tashkent_city", ru: "Ташкент город", uz: "Toshkent shahri", en: "Tashkent City" }
];

export function getRegions(locale: Locale = "ru") {
  return uzbekistanRegions.map((region) => ({
    id: region.id,
    label: region[locale]
  }));
}

export function translateRegion(value: string | undefined, locale: Locale = "ru") {
  if (!value) return "";
  const normalized = formatRegion(value, locale);
  if (normalized && normalized !== value) return normalized;
  const region = uzbekistanRegions.find((item) =>
    item.ru === value || item.uz === value || item.en === value || item.id === value
  );
  return region ? region[locale] : value;
}
