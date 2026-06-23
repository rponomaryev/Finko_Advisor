import type { Locale, StructuredProjectData } from "../types/project.ts";

export type CanonicalLocation = {
  country?: string;
  regionType?: "city" | "region" | "district" | "unknown";
  regionCode?: string;
  regionName?: string;
  districtName?: string;
  userInput?: string;
};

const tashkentCityDistricts = [
  { ru: "Юнусабад", uz: "Yunusobod", en: "Yunusabad", aliases: [/юну?сабад/i, /yunus[oa]bod/i, /yunusabad/i] },
  { ru: "Чиланзар", uz: "Chilonzor", en: "Chilanzar", aliases: [/чиланзар/i, /chilonzor/i, /chilanzar/i] },
  { ru: "Сергели", uz: "Sergeli", en: "Sergeli", aliases: [/сергел/i, /sergeli/i] },
  { ru: "Мирзо-Улугбек", uz: "Mirzo Ulug'bek", en: "Mirzo Ulugbek", aliases: [/мирзо/i, /улугбек/i, /mirzo/i, /ulug/i] },
  { ru: "Шайхантахур", uz: "Shayxontohur", en: "Shaykhantahur", aliases: [/шайхан/i, /shayxontohur/i, /shayhontohur/i, /shaykhantahur/i, /shaykhantakhur/i] },
  { ru: "Яшнабад", uz: "Yashnobod", en: "Yashnabad", aliases: [/яшнабад/i, /yashn[oa]bod/i, /yashnabad/i] },
  { ru: "Яккасарай", uz: "Yakkasaroy", en: "Yakkasaray", aliases: [/яккасарай/i, /yakkasaroy/i, /yakkasaray/i] },
  { ru: "Учтепа", uz: "Uchtepa", en: "Uchtepa", aliases: [/учтепа/i, /uchtepa/i] },
  { ru: "Алмазар", uz: "Olmazor", en: "Almazar", aliases: [/алмазар/i, /almazar/i, /olmazor/i] },
  { ru: "Бектемир", uz: "Bektemir", en: "Bektemir", aliases: [/бектемир/i, /bektemir/i] },
  { ru: "Мирабад", uz: "Mirobod", en: "Mirabad", aliases: [/мирабад/i, /mirobod/i, /mirabad/i] },
  { ru: "Янгихаёт", uz: "Yangihayot", en: "Yangikhayot", aliases: [/янгиха/i, /yangihayot/i, /yangikhayot/i] }
];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/[’'`]/g, "'").replace(/ё/g, "е").replace(/\s+/g, " ");
}

export function isTashkentCityRegion(value: unknown): boolean {
  const text = normalizeText(value);
  return /^(г\.?\s*)?ташкент(\s+город|\s+шахри)?$/.test(text)
    || /^tashkent\s*(city|shahri)?$/.test(text)
    || /^toshkent\s*(shahri)?$/.test(text)
    || /^город\s+ташкент$/.test(text)
    || /^city\s+of\s+tashkent$/.test(text);
}

export function isTashkentRegion(value: unknown): boolean {
  const text = normalizeText(value);
  return /ташкентск.*област/.test(text) || /tashkent\s+region/.test(text) || /toshkent\s+viloyati/.test(text);
}

export function isTashkentCityDistrict(value: unknown): boolean {
  return Boolean(resolveTashkentDistrictName(value, "ru"));
}

export function resolveTashkentDistrictName(value: unknown, locale: Locale = "ru"): string | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const match = tashkentCityDistricts.find((district) => district.aliases.some((alias) => alias.test(text)));
  return match?.[locale];
}

export function normalizeLocation(input: Pick<StructuredProjectData, "region" | "district" | "userLanguage">): CanonicalLocation {
  const region = String(input.region ?? "").trim();
  const district = String(input.district ?? "").trim();
  const districtIsTashkentCity = isTashkentCityDistrict(district);
  if (isTashkentCityRegion(region) || (districtIsTashkentCity && !isTashkentRegion(region))) {
    return {
      country: "UZ",
      regionType: "city",
      regionCode: "tashkent_city",
      regionName: "Ташкент город",
      districtName: district ? (resolveTashkentDistrictName(district, "ru") ?? district) : undefined,
      userInput: [region, district].filter(Boolean).join(", ")
    };
  }
  if (isTashkentRegion(region)) {
    return {
      country: "UZ",
      regionType: "region",
      regionCode: "tashkent_region",
      regionName: "Ташкентская область",
      districtName: district || undefined,
      userInput: [region, district].filter(Boolean).join(", ")
    };
  }
  return {
    country: "UZ",
    regionType: region ? "region" : "unknown",
    regionName: region || undefined,
    districtName: district || undefined,
    userInput: [region, district].filter(Boolean).join(", ")
  };
}

export function normalizeLocationFields<T extends Pick<StructuredProjectData, "region" | "district" | "userLanguage">>(data: T): T {
  const location = normalizeLocation(data);
  return {
    ...data,
    region: location.regionName ?? data.region,
    district: location.districtName ?? data.district
  };
}

export function formatLocation(
  input: Pick<StructuredProjectData, "region" | "district" | "userLanguage"> | CanonicalLocation,
  locale: Locale = "ru",
  options: { includeDistrictSuffix?: boolean } = {}
): string {
  const location = "regionName" in input || "regionType" in input
    ? input as CanonicalLocation
    : normalizeLocation(input as Pick<StructuredProjectData, "region" | "district" | "userLanguage">);
  const includeDistrictSuffix = options.includeDistrictSuffix ?? true;
  let region = location.regionName ?? "";
  let district = location.districtName ?? "";
  if (location.regionCode === "tashkent_city") {
    region = locale === "uz" ? "Toshkent shahri" : locale === "en" ? "Tashkent city" : "Ташкент";
    const localizedDistrict = resolveTashkentDistrictName(district, locale) ?? district;
    district = localizedDistrict;
    if (district && includeDistrictSuffix) {
      district = locale === "uz" ? `${district} tumani` : locale === "en" ? `${district} district` : district.replace(/\s*район$/i, "");
    }
  } else if (location.regionCode === "tashkent_region") {
    region = locale === "uz" ? "Toshkent viloyati" : locale === "en" ? "Tashkent region" : "Ташкентская область";
  }
  return [region, district].filter(Boolean).join(", ");
}

export function formatRegion(value: unknown, locale: Locale = "ru"): string {
  const location = normalizeLocation({ region: String(value ?? "") });
  if (location.regionCode === "tashkent_city") return locale === "uz" ? "Toshkent shahri" : locale === "en" ? "Tashkent city" : "Ташкент город";
  if (location.regionCode === "tashkent_region") return locale === "uz" ? "Toshkent viloyati" : locale === "en" ? "Tashkent region" : "Ташкентская область";
  return String(value ?? "");
}

export function formatDistrict(value: unknown, locale: Locale = "ru"): string {
  return resolveTashkentDistrictName(value, locale) ?? String(value ?? "");
}
