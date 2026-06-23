import type { Locale } from "../types/project.ts";

export type SourceType = "official_statistics" | "multilateral_statistics" | "custom_upload" | "registry" | "note" | "proxy";

export type MarketDataPointInput = {
  sector: string;
  businessType?: string;
  indicator: string;
  year: number;
  region?: string;
  value?: number | null;
  unit?: string;
  currency?: string;
  hsCode?: string;
  activityCode?: string;
  tradeType?: "import" | "export" | string;
  country?: string;
  productCategory?: string;
  valueUsd?: number | null;
  volume?: number | null;
  sourceName: string;
  sourceUrl?: string;
  sourceType: SourceType | string;
  lastUpdated?: string | Date | null;
  retrievedAt?: string;
  geography?: string;
  classification?: string;
  matchQuality?: "exact" | "close_proxy" | "broad_proxy" | "not_found";
  confidence?: "high" | "medium" | "low";
  explanation?: string;
};

export type MarketDataPoint = MarketDataPointInput & {
  id?: string;
};

export type SectorMapping = {
  businessType: string;
  normalizedSector: string;
  possibleHsCodes: string[];
  possibleActivityCodes?: string[];
  keywords: {
    ru: string[];
    uz: string[];
    en: string[];
  };
  confidence: "high" | "medium" | "low";
  mappingSource: "static_dictionary" | "ai_suggested" | "user_confirmed";
};

export type MarketDataResult = {
  locale: Locale;
  businessType: string;
  region?: string;
  mapping: SectorMapping;
  dataPoints: MarketDataPoint[];
  messages: string[];
  sources: Array<{
    sourceName: string;
    sourceType: string;
    sourceUrl?: string;
    year?: number;
    lastUpdated?: string;
    notes?: string;
  }>;
};
